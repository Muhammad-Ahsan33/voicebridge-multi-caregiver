interface AvatarProps {
  color: string;
  label: string;
  size?: "md" | "lg" | "xl";
  rounded?: "full" | "card";
}

const sizeMap = {
  md: "w-14 h-14 text-xl",
  lg: "w-20 h-20 text-3xl",
  xl: "w-full h-full text-6xl",
};

export default function Avatar({ color, label, size = "md", rounded = "full" }: AvatarProps) {
  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 ${sizeMap[size]} ${
        rounded === "full" ? "rounded-full" : "rounded-card"
      }`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
