import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Flagpole */}
      <rect x="8" y="2" width="2" height="25" rx="1" className="fill-primary" />
      {/* Flag pennant */}
      <path d="M10 3L24 7.5L10 13V3Z" className="fill-primary" />
      {/* Ground / putting green */}
      <ellipse
        cx="14"
        cy="27.5"
        rx="10"
        ry="2.5"
        className="fill-primary"
        opacity="0.25"
      />
    </svg>
  );
}
