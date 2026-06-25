import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — utility for merging Tailwind classes conditionally.
 * Used by VengenceUI components. Import as:
 *   import { cn } from "../lib/utils";
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
