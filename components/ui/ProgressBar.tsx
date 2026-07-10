"use client";

interface ProgressBarProps {
  value: number;       // 0-100
  color?: string;      // hex or css var
  height?: number;     // px, default 6
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  color = "var(--accent)",
  height = 6,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="label">{label}</span>}
          {showLabel && (
            <span className="text-xs font-semibold" style={{ color }}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className="progress-track"
        style={{ height: `${height}px` }}
      >
        <div
          className="progress-fill"
          style={{
            width: `${clamped}%`,
            background: color,
            transition: animated ? "width 0.6s ease" : "none",
          }}
        />
      </div>
    </div>
  );
}

export function XPBar({
  value,
  max,
  color = "var(--accent)",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="xp-bar">
      <div
        className="xp-bar-fill"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
        }}
      />
    </div>
  );
}
