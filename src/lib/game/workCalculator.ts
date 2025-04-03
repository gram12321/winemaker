/**
 * Work Calculator
 * Handles calculation of work required for various activities in the winery
 */

import { getGameState } from '@/gameState';
import { Staff } from '@/gameState';

// Work activity categories
export enum WorkCategory {
  PLANTING = 'planting',
  HARVESTING = 'harvesting',
  CRUSHING = 'crushing',
  FERMENTATION = 'fermentation',
  CLEARING = 'clearing',
  UPROOTING = 'uprooting',
  BUILDING = 'building',
  UPGRADING = 'upgrading',
  MAINTENANCE = 'maintenance',
  STAFF_SEARCH = 'staffSearch',
  ADMINISTRATION = 'administration'
}

// Base work units represent a standard amount of work per week
export const BASE_WORK_UNITS = 100;

// Default vine density used for density-based calculations
export const DEFAULT_VINE_DENSITY = 3000;

// Tasks that are affected by planting density
export const DENSITY_BASED_TASKS = [
  WorkCategory.PLANTING,
  WorkCategory.HARVESTING,
  WorkCategory.UPROOTING
];

// Base processing rates for different tasks
export const TASK_RATES: Record<WorkCategory, number> = {
  [WorkCategory.PLANTING]: 0.2,      // Acres per week
  [WorkCategory.HARVESTING]: 0.5,    // Acres per week
  [WorkCategory.CRUSHING]: 500,      // Kg per week
  [WorkCategory.FERMENTATION]: 1000, // Liters per week
  [WorkCategory.CLEARING]: 0.3,      // Acres per week
  [WorkCategory.UPROOTING]: 0.3,     // Acres per week
  [WorkCategory.BUILDING]: 0.25,     // Progress per week (relative)
  [WorkCategory.UPGRADING]: 0.5,     // Progress per week (relative)
  [WorkCategory.MAINTENANCE]: 0.2,   // Progress per week (relative)
  [WorkCategory.STAFF_SEARCH]: 1,    // Candidates per week
  [WorkCategory.ADMINISTRATION]: 1,  // Progress per week
};

// Initial setup work for tasks that require setup before starting
export const INITIAL_WORK: Partial<Record<WorkCategory, number>> = {
  [WorkCategory.BUILDING]: BASE_WORK_UNITS * 1,
  [WorkCategory.UPGRADING]: BASE_WORK_UNITS * 0.5,
  [WorkCategory.PLANTING]: BASE_WORK_UNITS * 0.3
};

// Activity progress interface
export interface ActivityProgress {
  id: string;
  category: WorkCategory;
  totalWork: number;
  appliedWork: number;
  completionCallback?: () => void;
  progressCallback?: (progress: number) => void;
  targetId?: string;
  params?: Record<string, any>;
}

/**
 * Calculate total work required for an activity
 * @param amount Amount of work (acres, kg, etc)
 * @param factors Various factors affecting work calculation
 * @returns Total work units required
 */
export function calculateTotalWork(
  amount: number, 
  factors: {
    category: WorkCategory;
    density?: number;
    taskMultipliers?: Record<string, number>;
    workModifiers?: number[];
  }
): number {
  const { category, density, taskMultipliers = {}, workModifiers = [] } = factors;
  
  // Get base rate for the task
  const baseRate = TASK_RATES[category];
  
  // Adjust rate for density if applicable
  const rate = DENSITY_BASED_TASKS.includes(category) && density 
    ? baseRate / (density / DEFAULT_VINE_DENSITY)
    : baseRate;
  
  // Calculate work weeks and convert to work units
  const multiplier = taskMultipliers[category] || 1.0;
  const workWeeks = (amount * multiplier) / rate;
  const workUnits = workWeeks * BASE_WORK_UNITS;
  
  // Add any initial work defined for the task
  const initialWork = INITIAL_WORK[category] || 0;
  
  // Calculate base work
  const baseWork = initialWork + workUnits;
  
  // Apply modifiers
  const totalWork = workModifiers.reduce((work, modifier) => 
    work * (1 + modifier), baseWork);
  
  // Return rounded up work units
  return Math.ceil(totalWork);
}

/**
 * Calculate work contribution from staff
 * @param staff Staff members assigned to the activity
 * @param category Work category to calculate contribution for
 * @returns Work units contributed per week
 */
export function calculateStaffWorkContribution(
  staff: Staff[],
  category: WorkCategory
): number {
  if (!staff.length) return 0;
  
  // Get all ongoing activities to calculate how staff time is divided
  const gameState = getGameState();
  const ongoingActivities: Record<string, string[]> = {};
  
  // Count activities each staff member is assigned to
  staff.forEach(staffMember => {
    if (!ongoingActivities[staffMember.id]) {
      ongoingActivities[staffMember.id] = [];
    }
    // In a real implementation, you'd query actual activities
    // For now, we'll assume each staff is only working on this activity
    ongoingActivities[staffMember.id].push(category);
  });
  
  // Calculate total work contribution
  return staff.reduce((total, staffMember) => {
    // Get the relevant skill for this category
    let relevantSkill = 0;
    
    // In a real implementation, match skill to category
    // This is a placeholder implementation
    switch(category) {
      case WorkCategory.PLANTING:
      case WorkCategory.HARVESTING:
      case WorkCategory.CLEARING:
      case WorkCategory.UPROOTING:
        relevantSkill = staffMember.skillLevel * 0.2; // Field skill
        break;
      case WorkCategory.CRUSHING:
      case WorkCategory.FERMENTATION:
        relevantSkill = staffMember.skillLevel * 0.2; // Winery skill
        break;
      case WorkCategory.BUILDING:
      case WorkCategory.UPGRADING:
      case WorkCategory.MAINTENANCE:
        relevantSkill = staffMember.skillLevel * 0.2; // Maintenance skill
        break;
      case WorkCategory.STAFF_SEARCH:
      case WorkCategory.ADMINISTRATION:
        relevantSkill = staffMember.skillLevel * 0.2; // Administration skill
        break;
      default:
        relevantSkill = staffMember.skillLevel * 0.1; // Default skill
    }
    
    // Account for staff working on multiple activities
    const activityCount = ongoingActivities[staffMember.id].length || 1;
    const workContribution = (BASE_WORK_UNITS * relevantSkill) / activityCount;
    
    return total + workContribution;
  }, 0);
}

/**
 * Calculate tool speed bonus for an activity
 * @param toolIds IDs of tools being used
 * @param category Work category the tools are used for
 * @returns Speed multiplier from tools
 */
export function calculateToolSpeedBonus(
  toolIds: string[],
  category: WorkCategory
): number {
  if (!toolIds.length) return 1.0;
  
  // In a real implementation, you'd retrieve tools from the game state
  // and calculate their combined effect
  // This is a placeholder implementation
  
  // Simple example: each tool provides a 20% bonus
  return 1.0 + (toolIds.length * 0.2);
}

/**
 * Create a new activity progress tracker
 * @param category Activity category
 * @param amount Amount of work to be done (acres, kg, etc)
 * @param params Additional parameters for the calculation
 * @returns Activity progress object
 */
export function createActivityProgress(
  category: WorkCategory,
  amount: number,
  params: {
    density?: number;
    taskMultipliers?: Record<string, number>;
    workModifiers?: number[];
    targetId?: string;
    completionCallback?: () => void;
    progressCallback?: (progress: number) => void;
    additionalParams?: Record<string, any>;
  }
): ActivityProgress {
  const { 
    density, 
    taskMultipliers, 
    workModifiers,
    targetId,
    completionCallback,
    progressCallback,
    additionalParams = {}
  } = params;
  
  const totalWork = calculateTotalWork(amount, {
    category,
    density,
    taskMultipliers,
    workModifiers
  });
  
  return {
    id: Date.now().toString(),
    category,
    totalWork,
    appliedWork: 0,
    completionCallback,
    progressCallback,
    targetId,
    params: additionalParams
  };
}

/**
 * Apply work to an activity progress tracker
 * @param activity Activity progress object
 * @param workAmount Amount of work to apply
 * @returns Updated activity progress object
 */
export function applyWorkToActivity(
  activity: ActivityProgress,
  workAmount: number
): ActivityProgress {
  const updatedActivity = {
    ...activity,
    appliedWork: Math.min(activity.totalWork, activity.appliedWork + workAmount)
  };
  
  const progress = updatedActivity.appliedWork / updatedActivity.totalWork;
  
  // Call progress callback if provided
  if (updatedActivity.progressCallback) {
    updatedActivity.progressCallback(progress);
  }
  
  // Call completion callback if work is complete
  if (progress >= 1 && updatedActivity.completionCallback) {
    updatedActivity.completionCallback();
  }
  
  return updatedActivity;
} 