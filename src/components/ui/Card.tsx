import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  glow = false,
  className = '',
  style,
}) => {
  const baseStyles = {
    borderRadius: '14px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const variantStyles = {
    default: {
      background: 'rgba(17,24,39,0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    },
    glass: {
      background: 'var(--surface-card)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-card)',
    },
    bordered: {
      background: 'rgba(17,24,39,0.6)',
      border: '1px solid var(--border-muted)',
    },
  };

  const paddingStyles = {
    sm: { padding: '16px' },
    md: { padding: '20px' },
    lg: { padding: '24px' },
  };

  const glowStyles = glow ? {
    boxShadow: '0 0 30px rgba(99,102,241,0.2), 0 0 60px rgba(99,102,241,0.06)',
  } : {};

  const hoverStyles = hoverable ? {
    cursor: 'default',
  } : {};

  return (
    <div
      className={`glass-card ${className}`}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...paddingStyles[padding],
        ...glowStyles,
        ...hoverStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <div style={{ marginBottom: '16px', ...style }}>{children}</div>
);

interface CardTitleProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, size = 'md', style }) => {
  const sizeStyles = {
    sm: { fontSize: '13px', fontWeight: 700 },
    md: { fontSize: '14px', fontWeight: 700 },
    lg: { fontSize: '16px', fontWeight: 800 },
  };

  return (
    <h2 style={{ color: '#e2e8f0', ...sizeStyles[size], ...style }}>
      {children}
    </h2>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <p style={{ fontSize: '11px', color: '#374151', marginTop: '2px', ...style }}>
    {children}
  </p>
);

interface CardContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <div style={{ ...style }}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', ...style }}>
    {children}
  </div>
);
