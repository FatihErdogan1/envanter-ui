import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'danger' | 'secondary' | 'success' | 'info' | 'warning';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary:   'btn-primary',
  danger:    'btn-danger',
  secondary: 'btn-secondary',
  success:   'btn-success',
  info:      'btn-info',
  warning:   'btn-warning',
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${variantClass[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
