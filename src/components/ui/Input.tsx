import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  rightElement,
  fullWidth = false,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const baseStyles = {
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#0f172a',
    padding: icon ? '10px 14px 10px 44px' : '10px 14px',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.01em',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const errorStyles = error ? {
    borderColor: '#ef4444',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '10px',
            lineHeight: '1.5',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        <input
          style={{
            ...baseStyles,
            ...errorStyles,
            ...style,
          }}
          onFocus={(e) => {
            Object.assign(e.currentTarget.style, {
              borderColor: '#6366f1',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
            });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            Object.assign(e.currentTarget.style, {
              borderColor: error ? '#ef4444' : '#cbd5e1',
              boxShadow: 'none',
            });
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {helper && !error && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
          {helper}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', lineHeight: '1.4' }}>
          {error}
        </p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  fullWidth = false,
  style,
  children,
  onFocus,
  onBlur,
  ...props
}) => {
  const baseStyles = {
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#0f172a',
    padding: '10px 14px',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.01em',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  };

  const errorStyles = error ? {
    borderColor: '#ef4444',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '10px',
            lineHeight: '1.5',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}
      <select
        style={{
          ...baseStyles,
          ...errorStyles,
          ...style,
        }}
        onFocus={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
          });
          onFocus?.(e);
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: error ? '#ef4444' : '#cbd5e1',
            boxShadow: 'none',
          });
          onBlur?.(e);
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', lineHeight: '1.4' }}>
          {error}
        </p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  fullWidth = false,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const baseStyles = {
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#0f172a',
    padding: '10px 14px',
    fontSize: '14px',
    lineHeight: '1.6',
    letterSpacing: '0.01em',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
  };

  const errorStyles = error ? {
    borderColor: '#ef4444',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '10px',
            lineHeight: '1.5',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        style={{
          ...baseStyles,
          ...errorStyles,
          ...style,
        }}
        onFocus={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
          });
          onFocus?.(e);
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: error ? '#ef4444' : '#cbd5e1',
            boxShadow: 'none',
          });
          onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', lineHeight: '1.4' }}>
          {error}
        </p>
      )}
    </div>
  );
};
