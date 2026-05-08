import { ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
}

export default function PageHeader({ title, children }: Props) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
      <h1 className="pixel-heading text-sm">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
