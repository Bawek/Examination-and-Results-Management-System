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
  onFocus,
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.5',
    letterSpacing: '0.01em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
  };

  const variantStyles = {
    primary: {
      background: '#4f46e5',
      color: '#fff',
      borderColor: '#4f46e5',
      boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
    },
    secondary: {
      background: '#fff',
      color: '#374151',
      borderColor: '#e2e8f0',
      border: '1px solid #e2e8f0',
    },
    ghost: {
      background: 'transparent',
      color: '#6b7280',
      borderColor: 'transparent',
    },
    danger: {
      background: '#fee2e2',
      color: '#b91c1c',
      borderColor: '#fca5a5',
      border: '1px solid #fca5a5',
    },
  };

  const sizeStyles = {
    sm: { padding: '10px 16px', fontSize: '13px' },
    md: { padding: '12px 20px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '15px' },
  };

  const hoverStyles = variant === 'primary' ? {
    background: '#4338ca',
    boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
    transform: 'translateY(-1px)',
  } : variant === 'secondary' ? {
    background: '#f8fafc',
    borderColor: '#cbd5e1',
  } : variant === 'ghost' ? {
    background: '#f3f4f6',
    color: '#374151',
  } : variant === 'danger' ? {
    background: '#fecaca',
    borderColor: '#f87171',
  } : {};

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
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid #6366f1';
        e.currentTarget.style.outlineOffset = '2px';
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(79,70,229,0.3)',
            borderTopColor: '#4f46e5',
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
