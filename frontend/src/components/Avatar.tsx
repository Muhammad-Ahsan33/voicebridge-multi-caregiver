import { useEffect, useState } from "react";

interface AvatarProps {
  color: string;
  label: string;
  imageUrl?: string | null;
  size?: "md" | "lg" | "xl";
  rounded?: "full" | "card";
}

const sizeMap = {
  md: "w-14 h-14 text-xl",
  lg: "w-20 h-20 text-3xl",
  xl: "w-full h-full text-6xl",
};

export default function Avatar({ color, label, imageUrl, size = "md", rounded = "full" }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden font-bold text-white shrink-0 ${sizeMap[size]} ${
        rounded === "full" ? "rounded-full" : "rounded-card"
      }`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        label
      )}
    </div>
  );
}
