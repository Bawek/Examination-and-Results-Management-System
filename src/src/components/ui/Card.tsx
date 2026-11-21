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
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    glass: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    bordered: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
    },
  };

  const paddingStyles = {
    sm: { padding: '20px' },
    md: { padding: '24px' },
    lg: { padding: '28px' },
  };

  // glow prop kept in interface for backward compat but is a no-op
  const hoverableStyles = hoverable ? {
    cursor: 'default',
  } : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...paddingStyles[padding],
        ...hoverableStyles,
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        Object.assign(e.currentTarget.style, {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transform: 'translateY(-1px)',
        });
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        Object.assign(e.currentTarget.style, {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          transform: 'translateY(0)',
        });
      } : undefined}
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
  <div style={{ marginBottom: '20px', ...style }}>{children}</div>
);

interface CardTitleProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, size = 'md', style }) => {
  const sizeStyles = {
    sm: { fontSize: '14px', fontWeight: 600, lineHeight: '1.5', letterSpacing: '0.01em' },
    md: { fontSize: '16px', fontWeight: 600, lineHeight: '1.5', letterSpacing: '0.01em' },
    lg: { fontSize: '18px', fontWeight: 700, lineHeight: '1.4', letterSpacing: '0.01em' },
  };

  return (
    <h2 style={{ color: '#0f172a', ...sizeStyles[size], ...style }}>
      {children}
    </h2>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: '1.6', letterSpacing: '0.01em', ...style }}>
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
  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', ...style }}>
    {children}
  </div>
);
