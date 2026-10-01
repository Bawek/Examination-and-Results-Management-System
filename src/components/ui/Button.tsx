import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  style,
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, var(--brand-600), var(--brand-700))',
      color: '#fff',
      borderColor: 'var(--brand-600)',
      boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-muted)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#fca5a5',
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '10px 20px', fontSize: '14px' },
  };

  const hoverStyles = variant === 'primary' ? {
    background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
    boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
    transform: 'translateY(-1px)',
  } : variant === 'secondary' ? {
    background: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.14)',
  } : variant === 'ghost' ? {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
  } : variant === 'danger' ? {
    background: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  } : {};

  // Allow custom styles to override default styles
  const mergedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  return (
    <button
      disabled={disabled || loading}
      style={mergedStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, {
            ...variantStyles[variant],
            transform: 'translateY(0)',
          });
        }
      }}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin-smooth 0.8s linear infinite',
          }}
        />
      )}
      {!loading && iconPosition === 'left' && icon}
      {children}
      {!loading && iconPosition === 'right' && icon}
    </button>
  );
};
