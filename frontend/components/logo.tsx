import Image from "next/image";
import * as React from "react";

import brandLight from "../public/LOGO.png";
import brandDark from "../public/brand-logo-white.png";
import flowerLight from "../public/flower-black.png";
import flowerDark from "../public/flower-white.png";

type LogoProps = {
  /** Choose full wordmark or the flower mark */
  variant?: "brand" | "flower";
  /** Pick the correct contrast for the background the logo sits on */
  mode?: "light" | "dark";
  /** Whether to eagerly load this instance (e.g., above the fold) */
  priority?: boolean;
  className?: string;
};

export function Logo({
  variant = "brand",
  mode = "light",
  className = "h-20 w-auto",
  priority = false,
}: LogoProps) {
  const src =
    variant === "brand"
      ? mode === "dark"
        ? brandDark
        : brandLight
      : mode === "dark"
        ? flowerDark
        : flowerLight;

  return <Image src={src} alt="Privia logo" className={className} priority={priority} />;
}
