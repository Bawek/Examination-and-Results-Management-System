import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  style?: React.CSSProperties;
}

export const Container: React.FC<ContainerProps> = ({ children, size = 'lg', style }) => {
  const sizeStyles = {
    sm: { maxWidth: '640px' },
    md: { maxWidth: '768px' },
    lg: { maxWidth: '1024px' },
    full: { maxWidth: '100%' },
  };

  return (
    <div
      style={{
        width: '100%',
        margin: '0 auto',
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: number | string;
  wrap?: 'wrap' | 'nowrap';
  style?: React.CSSProperties;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align = 'center',
  justify = 'flex-start',
  gap = 0,
  wrap = 'nowrap',
  style,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      flexWrap: wrap,
      ...style,
    }}
  >
    {children}
  </div>
);

interface GridProps {
  children: React.ReactNode;
  columns?: number | string;
  gap?: number | string;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({ children, columns = 1, gap = 16, style }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      ...style,
    }}
  >
    {children}
  </div>
);

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Section: React.FC<SectionProps> = ({ children, title, description, actions, style }) => (
  <section style={{ marginBottom: '28px', ...style }}>
    {(title || description || actions) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div>
          {title && (
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#f1f5f9',
                margin: '0 0 4px',
              }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{description}</p>
          )}
        </div>
        {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

interface SpacerProps {
  size?: number | string;
  vertical?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({ size = 16, vertical = true }) => (
  <div style={{ width: vertical ? '100%' : size, height: vertical ? size : '100%' }} />
);

interface DividerProps {
  style?: React.CSSProperties;
}

export const Divider: React.FC<DividerProps> = ({ style }) => (
  <div
    style={{
      height: '1px',
      background: 'rgba(255,255,255,0.06)',
      margin: '16px 0',
      ...style,
    }}
  />
);
