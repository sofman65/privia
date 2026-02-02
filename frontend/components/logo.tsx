import * as React from "react";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "h-12 w-12" }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Privia logo"
    >
      {/* Background */}
      

      {/* Circle container */}
      <circle
        cx="64"
        cy="64"
        r="44"
        stroke="#E7EDF8"
        strokeWidth="6"
        fill="none"
      />

      {/* P mark */}
      <path
        fill="#E7EDF8"
        d="M46 36h24c15 0 25 9 25 23 0 13.5-9.8 22.5-24 22.5H58v15H46V36Zm22.8 33c6 0 9.8-3.6 9.8-9s-3.8-8.7-9.8-8.7H58V69h10.8Z"
      />
    </svg>
  );
}
