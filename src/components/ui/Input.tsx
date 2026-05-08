import { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-muted font-pixel text-xs">{label}</label>}
      <input className={`input-field ${error ? 'border-red' : ''} ${className}`} {...rest} />
      {error && <span className="text-red text-sm font-vt">{error}</span>}
    </div>
  );
}
