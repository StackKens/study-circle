interface InputProps {
  label: string;
  placeholder?: string;
  type: "text" | "email" | "password" | "number";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  fullWidth?: boolean;
}
export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  fullWidth = false,
}: InputProps) {
  return (
    <div className={`${fullWidth ? "w-full" : ""} flex flex-col gap-1`}>
      {/* Label */}
      <label className="text-sm font-medium text-(--dark)">{label}</label>

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          px-4 py-3 rounded-lg border w-70 
          bg-white text-(--dark)
          outline-none transition-all duration-200

          border-(--border)
          focus:border-(--g3)
          focus:ring-2 focus:ring-(--g4)

          ${error ? "border-red-500 focus:ring-red-200" : ""}
        `}
      />

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
