import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'muted';
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'sm',
  dot = false,
  style,
}) => {
  const variantStyles = {
    success: {
      background: 'rgba(16,185,129,0.12)',
      color: '#34d399',
      border: '1px solid rgba(16,185,129,0.25)',
    },
    warning: {
      background: 'rgba(245,158,11,0.12)',
      color: '#fbbf24',
      border: '1px solid rgba(245,158,11,0.25)',
    },
    danger: {
      background: 'rgba(239,68,68,0.12)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.25)',
    },
    info: {
      background: 'rgba(56,189,248,0.12)',
      color: '#38bdf8',
      border: '1px solid rgba(56,189,248,0.25)',
    },
    brand: {
      background: 'rgba(99,102,241,0.15)',
      color: '#a5b4fc',
      border: '1px solid rgba(99,102,241,0.3)',
    },
    muted: {
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-muted)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '2px 9px',
      fontSize: '11px',
      gap: '4px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '12px',
      gap: '6px',
    },
  };

  return (
    <span
      className="badge"
      style={{
        display: style?.display || 'inline-flex',
        alignItems: style?.alignItems || 'center',
        justifyContent: style?.justifyContent || 'center',
        borderRadius: '100px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'currentColor',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; defaultLabel: string }> = {
    published: { variant: 'success', defaultLabel: 'Published' },
    results_released: { variant: 'info', defaultLabel: 'Results Released' },
    closed: { variant: 'muted', defaultLabel: 'Closed' },
    draft: { variant: 'warning', defaultLabel: 'Draft' },
    approved: { variant: 'brand', defaultLabel: 'Approved' },
    active: { variant: 'success', defaultLabel: 'Active' },
    pending: { variant: 'warning', defaultLabel: 'Pending' },
    error: { variant: 'danger', defaultLabel: 'Error' },
    locked: { variant: 'danger', defaultLabel: 'Locked' },
    unlocked: { variant: 'success', defaultLabel: 'Unlocked' },
  };

  const config = statusConfig[status] || { variant: 'muted', defaultLabel: status };
  const displayLabel = label || config.defaultLabel;

  return <Badge variant={config.variant}>{displayLabel}</Badge>;
};
