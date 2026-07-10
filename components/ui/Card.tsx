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
    ...(accent ? { borderLeftColor: accent, borderLeftWidth: "3.5px" } : {}),
  };

  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? "cursor-pointer hover:border-arctic/40 active:scale-[0.99] transition-all duration-150" : ""} ${className}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
}

export function CardInner({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`card-inner ${onClick ? "cursor-pointer" : ""} ${className}`}>{children}</div>;
}

export function CardLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label mb-2 ${className}`}>{children}</p>;
}
