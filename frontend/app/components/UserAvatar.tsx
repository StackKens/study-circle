import { avatarColor, initials } from "../utils/chat";

interface UserAvatarProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-sm",
};

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = "md",
  onClick,
  className = "",
}: UserAvatarProps) {
  const dim = sizeMap[size];
  const base = `flex-shrink-0 ${dim} rounded-full object-cover ${className}`;
  const interactive = onClick
    ? "cursor-pointer hover:ring-2 hover:ring-teal-400 hover:ring-offset-1 transition-all"
    : "";

  if (avatarUrl) {
    const el = (
      <img src={avatarUrl} alt={name} className={`${base} ${interactive}`} />
    );
    return onClick ? (
      <button type="button" onClick={onClick} className="rounded-full">
        {el}
      </button>
    ) : (
      el
    );
  }

  const color = avatarColor(userId);
  const inner = (
    <div
      className={`${base} ${color} ${interactive} flex items-center justify-center text-white font-bold`}
    >
      {initials(name)}
    </div>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="rounded-full">
      {inner}
    </button>
  ) : (
    inner
  );
}
