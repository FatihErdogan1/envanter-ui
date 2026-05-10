import { ReactNode } from 'react';

interface Props {
  title: string;
  search?: ReactNode;
  children?: ReactNode;
}

export default function PageHeader({ title, search, children }: Props) {
  return (
    <div className="mb-4 pb-3 border-b border-border">
      <div className="flex items-center justify-between">
        <h1 className="pixel-heading text-sm">{title}</h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      {search && <div className="mt-3">{search}</div>}
    </div>
  );
}
