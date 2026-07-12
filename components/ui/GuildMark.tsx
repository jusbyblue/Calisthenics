import React from "react";

interface GuildMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function GuildMark({ size = 24, className = "", ...props }: GuildMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 
        Ascending Monogram (C + G + Stepped Progression).
        Mathematically aligned on a 4-unit grid inside a 16x16 bounding box.
      */}
      <path d="M 20 4 H 4 V 20 H 20 V 12 H 12 V 8 H 8" />
    </svg>
  );
}
