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
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between';
  gap?: string;
}

export const Flex: React.FC<FlexProps> = ({ 
  children, 
  direction = 'row', 
  align, 
  justify,
  gap,
  className,
  ...props 
}) => {
  const alignClass = align ? `items-${align}` : '';
  const justifyClass = justify ? `justify-${justify}` : '';
  const directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
  const gapClass = gap ? `gap-${gap}` : '';
  
  return (
    <div 
      className={cn("flex", directionClass, alignClass, justifyClass, gapClass, className)} 
      {...props}
    >
      {children}
    </div>
  );
};

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
  gap?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  cols = 1, 
  gap = '4',
  className,
  ...props 
}) => (
  <div 
    className={cn(`grid grid-cols-${cols} gap-${gap}`, className)} 
    {...props}
  >
    {children}
  </div>
);

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
