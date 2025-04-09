import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SkillLevels } from "../constants/staffConstants"
import { getColorClass } from './formatUtils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a descriptive category name for a given wine quality (0-1).
 */
export function getWineQualityCategory(quality: number): string {
  if (quality < 0.1) return "Undrinkable";
  if (quality < 0.2) return "Vinegar Surprise";
  if (quality < 0.3) return "House Pour";
  if (quality < 0.4) return "Everyday Sipper";
  if (quality < 0.5) return "Solid Bottle";
  if (quality < 0.6) return "Well-Balanced";
  if (quality < 0.7) return "Sommelier's Choice";
  if (quality < 0.8) return "Cellar Reserve";
  if (quality < 0.9) return "Connoisseur's Pick";
  return "Vintage Perfection";
}

/**
 * Gets detailed information for a given skill level (0-1), including name and color class.
 */
export function getSkillLevelInfo(level: number): {
  name: string;
  modifier: number;
  costMultiplier: number;
  levelKey: number;
  colorClass: string;
} {
  // Get the numeric keys of SkillLevels and sort them
  const levelKeys = Object.keys(SkillLevels).map(Number).sort((a, b) => a - b);

  // Find the closest level key to the input skillLevel
  const closestKey = levelKeys.reduce((prev, curr) => {
    return Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev;
  });

  // Get the data for the closest key
  const skillData = SkillLevels[closestKey as keyof typeof SkillLevels];

  // Get the color class based on the closest key (which is 0.1-1.0 scale)
  const colorClass = getColorClass(closestKey);

  // Return combined info, providing defaults if data not found
  return {
    name: skillData?.name || 'Unknown',
    modifier: skillData?.modifier || 0,
    costMultiplier: skillData?.costMultiplier || 1,
    levelKey: closestKey, // Return the key itself (0.1, 0.2, etc.)
    colorClass, // Include the color class
  };
}
