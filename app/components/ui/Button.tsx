interface ButtonProps {
  variant?: "primary" | "outline" | "ghost" | "amber";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  fullWidth = false,
  type = "button",
  disabled,
}: ButtonProps) {
  const baseStyles = "rounded-xl font-medium transition-all duration-200";
  const variants = {
    primary: "bg-[var(--g2)] text-white hover:bg-[var(--g3)]",

    outline: "border border-[var(--g2)] text-[var(--g2)] hover:bg-[var(--g5)]",

    ghost: "bg-transparent text-[var(--g2)] hover:bg-[var(--g5)]",

    amber: "bg-[var(--amber)] text-white hover:bg-[var(--amber2)]",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:scale-[1.02]"
        }
      `}
    >
      {children}
    </button>
  );
}
