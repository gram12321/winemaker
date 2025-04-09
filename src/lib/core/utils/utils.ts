import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SkillLevels } from "../constants/staffConstants"
import { getColorClass } from './formatUtils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
