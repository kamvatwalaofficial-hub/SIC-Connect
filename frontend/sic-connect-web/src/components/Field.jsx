/** Labelled text input with optional error text. */
export function Field({ label, error, className = '', as = 'input', children, ...props }) {
  const Control = as;
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {as === 'select' ? (
        <select className="input" {...props}>
          {children}
        </select>
      ) : (
        <Control className="input" {...props} />
      )}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
