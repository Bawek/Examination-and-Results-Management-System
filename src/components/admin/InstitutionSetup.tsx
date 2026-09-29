import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { SchoolSettings, GradingScale } from '../../types/index.ts';
import { Save, Check, Shield } from 'lucide-react';

export const InstitutionSetup: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SchoolSettings>>({});
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        setSettings(data.settings);
        setScales(data.gradingScales);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSavedMessage('Settings successfully saved to PostgreSQL database.');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading institution settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Institution & Assessment Policies (ACD-01, ACD-09)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Governs academic identity, grading scales, pass thresholds, rounding rules, and ranking logic.
          </p>
        </div>
        {savedMessage && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institution Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>Institution Profile</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Institution Legal Name</label>
              <input
                type="text"
                value={settings.institution_name || ''}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Timezone (Server Authoritative)</label>
              <select
                value={settings.timezone || 'UTC'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</option>
                <option value="Europe/London">Europe/London (GMT / BST)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Telephone</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Calculation & Results Engine Policies */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Calculation Engine Rules (RES-01 to RES-10, 8.5)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pass Threshold (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.pass_percentage ?? 50.0}
                onChange={(e) => setSettings({ ...settings, pass_percentage: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums"
              />
              <p className="text-[10px] text-slate-500 mt-1">Minimum subject / overall score to award Pass</p>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Rounding Decimal Places</label>
              <input
                type="number"
                min="0"
                max="4"
                value={settings.rounding_decimals ?? 2}
                onChange={(e) => setSettings({ ...settings, rounding_decimals: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums"
              />
              <p className="text-[10px] text-slate-500 mt-1">Stored consistently as DECIMAL(5,2)</p>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Student Ranking</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rankToggle"
                  checked={settings.ranking_enabled ?? true}
                  onChange={(e) => setSettings({ ...settings, ranking_enabled: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="rankToggle" className="text-xs text-slate-700">
                  Compute term class ranks (with tie-handling)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Scale Preview */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Active Grading Scale & Grade Points (ACD-09)
            </h2>
            <span className="text-[11px] text-slate-500">Standard Academic 4.0 Scale</span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Score Range</th>
                  <th className="py-2.5 px-3">Grade Point</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-900">{s.grade}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-600">
                      {s.min_score}% – {s.max_score}%
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-900">
                      {parseFloat(s.grade_point.toString()).toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[11px] font-medium ${s.is_pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {s.is_pass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{s.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save System Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
