import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, icon, type = 'text', id, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && visible ? 'text' : type;
    const inputId = id ?? props.name ?? label;
    const errorId = `${inputId}-error`;

    return (
      <div className="field">
        <label className="field__label" htmlFor={inputId}>{label}</label>
        <div className={`field__control ${error ? 'field__control--error' : ''}`}>
          {icon && <span className="field__icon" aria-hidden="true">{icon}</span>}
          <input
            {...props}
            id={inputId}
            ref={ref}
            type={inputType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="field__input"
          />
          {isPassword && (
            <button
              className="field__toggle"
              type="button"
              aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              aria-pressed={visible}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="field__error" id={errorId} role="alert">{error}</p>}
      </div>
    );
  },
);
