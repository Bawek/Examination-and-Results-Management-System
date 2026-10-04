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
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
    warning: {
      background: '#fef9c3',
      color: '#854d0e',
      border: '1px solid #fde047',
    },
    danger: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
    info: {
      background: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #93c5fd',
    },
    brand: {
      background: '#ede9fe',
      color: '#4c1d95',
      border: '1px solid #c4b5fd',
    },
    muted: {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '4px 10px',
      fontSize: '12px',
      gap: '4px',
      lineHeight: '1.4',
    },
    md: {
      padding: '6px 14px',
      fontSize: '13px',
      gap: '6px',
      lineHeight: '1.4',
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
