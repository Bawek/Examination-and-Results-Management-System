import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightElement,
  fullWidth = false,
  style,
  ...props
}) => {
  const baseStyles = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: icon ? '8px 12px 8px 40px' : '8px 12px',
    fontSize: '13px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const errorStyles = error ? {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
            letterSpacing: '0.02em',
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
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
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
              borderColor: 'var(--brand-500)',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
              background: 'rgba(255,255,255,0.06)',
            });
          }}
          onBlur={(e) => {
            Object.assign(e.currentTarget.style, {
              borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-muted)',
              boxShadow: 'none',
              background: 'rgba(255,255,255,0.04)',
            });
          }}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
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
  ...props
}) => {
  const baseStyles = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: '13px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  };

  const errorStyles = error ? {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
            letterSpacing: '0.02em',
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
            borderColor: 'var(--brand-500)',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
            background: 'rgba(255,255,255,0.06)',
          });
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-muted)',
            boxShadow: 'none',
            background: 'rgba(255,255,255,0.04)',
          });
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
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
  ...props
}) => {
  const baseStyles = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: '13px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
  };

  const errorStyles = error ? {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  } : {};

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
            letterSpacing: '0.02em',
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
            borderColor: 'var(--brand-500)',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
            background: 'rgba(255,255,255,0.06)',
          });
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, {
            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-muted)',
            boxShadow: 'none',
            background: 'rgba(255,255,255,0.04)',
          });
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
