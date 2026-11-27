import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children, className, ...props }) => (
  <div className={cn("container mx-auto px-4", className)} {...props}>
    {children}
  </div>
);

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'flex-start' | 'center' | 'end' | 'flex-end' | 'stretch' | 'baseline';
  justify?: 'start' | 'flex-start' | 'center' | 'end' | 'flex-end' | 'between' | 'space-between';
  gap?: string | number;
  wrap?: boolean;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align,
  justify,
  gap,
  wrap,
  className,
  style,
  ...props
}) => {
  const alignValue = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align;
  const justifyValue =
    justify === 'between'
      ? 'space-between'
      : justify === 'start'
      ? 'flex-start'
      : justify === 'end'
      ? 'flex-end'
      : justify;

  const gapStyle = typeof gap === 'number' ? `${gap}px` : gap;

  return (
    <div
      className={cn('flex', direction === 'col' ? 'flex-col' : 'flex-row', className)}
      style={{
        alignItems: alignValue,
        justifyContent: justifyValue,
        gap: gapStyle,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
  columns?: number | string;
  gap?: string | number;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols,
  columns,
  gap = 16,
  className,
  style,
  ...props
}) => {
  const colSpec = columns ?? cols ?? 1;
  const gridTemplateColumns =
    typeof colSpec === 'number' ? `repeat(${colSpec}, minmax(0, 1fr))` : colSpec;
  const gapStyle = typeof gap === 'number' ? `${gap}px` : gap;

  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns,
        gap: gapStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ children, className, ...props }) => (
  <section className={cn("py-8", className)} {...props}>
    {children}
  </section>
);

interface SpacerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spacer: React.FC<SpacerProps> = ({ size = 'md' }) => {
  const sizeMap = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-16',
  };

  return <div className={sizeMap[size]} />;
};

interface DividerProps {
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ className }) => (
  <hr className={cn("border-t border-border my-4", className)} />
);
