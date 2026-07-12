"use client";

interface ProgressBarProps {
  value: number;       // 0-100
  color?: string;      // hex or css var
  height?: number;     // px, default 4
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  color = "var(--accent)",
  height = 4,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>}
          {showLabel && (
            <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
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
            transition: animated ? "width 0.3s ease-out" : "none",
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
    <div className="w-full h-1 bg-surface3 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: color,
        }}
      />
    </div>
  );
}
