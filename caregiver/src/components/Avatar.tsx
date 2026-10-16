interface AvatarProps {
  color: string;
  initials: string;
  size?: number;
}

export default function Avatar({ color, initials, size = 44 }: AvatarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
