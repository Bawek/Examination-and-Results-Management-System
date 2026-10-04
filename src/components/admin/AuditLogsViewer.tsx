import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types/index.ts';
import { ShieldCheck, Search, Eye } from 'lucide-react';
import { Input, Badge, Modal, ModalFooter, Button } from '../ui';

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(actionFilter);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
            <span>Immutable Audit Trail &amp; Governance (ADM-01 to ADM-05)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof audit logs recording exam scheduling, mark submissions, result publications, and administrative overrides with documented reasons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            icon={<Search size={14} />}
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Timestamp (UTC)</th>
              <th className="py-2.5 px-3">Actor / User</th>
              <th className="py-2.5 px-3 font-mono">Action</th>
              <th className="py-2.5 px-3">Entity Type</th>
              <th className="py-2.5 px-3">Documented Reason (ADM-02)</th>
              <th className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  <div>{log.full_name || log.username || 'System'}</div>
                  {log.role && (
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{log.role}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                  <Badge variant="muted">{log.action}</Badge>
                </td>
                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                  {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                </td>
                <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                  {log.reason || '—'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="View JSON metadata"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event: ${selectedLog.action}` : ''}
        size="md"
      >
        {selectedLog && (
          <>
            <div style={{ fontSize: '12px', lineHeight: '1.6', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', marginBottom: '16px' }}>
              <div>Actor: {selectedLog.full_name} ({selectedLog.role})</div>
              <div>Entity: {selectedLog.entity_type} #{selectedLog.entity_id}</div>
              <div>Timestamp: {selectedLog.created_at}</div>
              <div>Reason: {selectedLog.reason}</div>
            </div>
            <pre style={{ padding: '12px', background: '#0f172a', color: '#e2e8f0', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', maxHeight: '224px' }}>
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};
