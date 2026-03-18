interface WordMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-lg tracking-tight",
  md: "text-2xl tracking-tight",
  lg: "text-3xl tracking-tight",
  xl: "text-4xl tracking-tight",
};

export function WordMark({ size = "md", className = "" }: WordMarkProps) {
  const textSize = sizeClasses[size];
  return (
    <span
      className={`font-black ${textSize} select-none ${className}`}
      style={{
        background:
          "linear-gradient(135deg, #22d3ee 0%, #818cf8 50%, #c084fc 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        textShadow: "none",
        filter: "drop-shadow(0 0 12px oklch(0.7 0.2 230 / 0.45))",
        letterSpacing: "-0.02em",
      }}
    >
      CybXSan
    </span>
  );
}
