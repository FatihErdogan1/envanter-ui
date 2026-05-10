interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'ARA...' }: Props) {
  return (
    <div className="relative w-64">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-pixel pointer-events-none" style={{ fontSize: '8px' }}>▶</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-7 font-vt text-lg placeholder:text-muted"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-red font-pixel transition-colors"
          style={{ fontSize: '8px' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
