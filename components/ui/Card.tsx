"use client";
import { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: string; // optional left border accent color
  style?: CSSProperties;
}

export function Card({ children, className = "", onClick, accent, style }: CardProps) {
  const combinedStyle = {
    ...style,
    ...(accent ? { borderLeftColor: accent, borderLeftWidth: "4px" } : {}),
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface1 rounded-xl p-5 ${
        onClick ? "cursor-pointer hover:bg-surface2 active:scale-[0.98] transition-all duration-200" : ""
      } border border-border shadow-sm ${className}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
}

export function CardInner({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick} 
      className={`bg-surface2 rounded-lg p-4 border border-border/50 ${
        onClick ? "cursor-pointer hover:bg-surface3 transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h4 className={`mb-3 uppercase tracking-wider text-[11px] font-bold text-muted ${className}`}>{children}</h4>;
}
