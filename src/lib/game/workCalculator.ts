import { Staff } from '@/gameState';
import { GrapeVariety, CLEARING_SUBTASK_RATES } from '@/lib/core/constants/vineyardConstants';
import { v4 as uuidv4 } from 'uuid';
import { BASELINE_VINE_DENSITY } from '@/lib/core/constants/gameConstants';

// Import or define BASE_WORK_UNITS
export const BASE_WORK_UNITS = 50; // work units per standard week

// WorkCategory enum - defines all activity types in the game
export enum WorkCategory {
  PLANTING = 'planting',
  HARVESTING = 'harvesting',
  CRUSHING = 'crushing',
  FERMENTATION = 'fermentation',
  CLEARING = 'clearing',
  UPROOTING = 'uprooting',
  BUILDING = 'building',
  UPGRADING = 'upgrading',
  UPGRADE = 'upgrading', // Alias for UPGRADING
  MAINTENANCE = 'maintenance',
  STAFF_SEARCH = 'staffSearch',
  ADMINISTRATION = 'administration'
}

// Default vine density used for density-based calculations
export const DEFAULT_VINE_DENSITY = 5000;

// Define density-based tasks
export const DENSITY_BASED_TASKS = [
  WorkCategory.PLANTING,
  WorkCategory.UPROOTING, 
  WorkCategory.HARVESTING
];

// Base processing rates for different tasks
export const TASK_RATES: Record<WorkCategory, number> = {
  [WorkCategory.PLANTING]: 0.7,     // acres/week
  [WorkCategory.HARVESTING]: 4.4,    // acres/week
  [WorkCategory.CRUSHING]: 2.5,     // tons/week
  [WorkCategory.FERMENTATION]: 5.0,  // kL/week
  [WorkCategory.CLEARING]: 1.0,     // Default rate for clearing
  [WorkCategory.UPROOTING]: 0.56,    // acres/week
  [WorkCategory.BUILDING]: 100000,  // €/week
  [WorkCategory.UPGRADING]: 100000, // €/week
  [WorkCategory.MAINTENANCE]: 500000, // €/week
  [WorkCategory.STAFF_SEARCH]: 5.0,  // candidates/week
  [WorkCategory.ADMINISTRATION]: 1.0 // default administration rate
};

// Define initial work for each category
export const INITIAL_WORK: Record<WorkCategory, number> = {
  [WorkCategory.PLANTING]: 10,
  [WorkCategory.HARVESTING]: 5,
  [WorkCategory.CRUSHING]: 10,
  [WorkCategory.FERMENTATION]: 25,
  [WorkCategory.CLEARING]: 5, // Base initial work for clearing category
  [WorkCategory.UPROOTING]: 10,
  [WorkCategory.BUILDING]: 200,
  [WorkCategory.UPGRADING]: 150,
  [WorkCategory.MAINTENANCE]: 10,
  [WorkCategory.STAFF_SEARCH]: 25,
  [WorkCategory.ADMINISTRATION]: 5
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

// Define valid clearing sub-task IDs as a type
type ClearingSubTaskId = keyof typeof CLEARING_SUBTASK_RATES;

/**
 * Core work calculation function - simplified to be a generic calculator
 * without special case handling for different activities
 */
export function calculateTotalWork(
  amount: number,
  factors: {
    rate: number; // Processing rate (units/week)
    initialWork?: number; // Initial setup work
    density?: number; // Vine density for density-based tasks
    useDensityAdjustment?: boolean; // Whether to adjust for density 
    workModifiers?: number[]; // Percentage modifiers (0.2 = +20%, -0.1 = -10%)
  }
): number {
  const { 
    rate, 
    initialWork = 0, 
    density, 
    useDensityAdjustment = false,
    workModifiers = [] 
  } = factors;
  
  // Adjust rate for density if needed
  const adjustedRate = (useDensityAdjustment && density) 
    ? rate / (density / BASELINE_VINE_DENSITY) 
    : rate;
  
  // Calculate work units
  const workWeeks = amount / adjustedRate;
  const workUnits = workWeeks * BASE_WORK_UNITS;
  
  // Base work = initial setup + calculated work units
  const baseWork = initialWork + workUnits;
  
  // Apply modifiers (e.g., skill bonuses, environmental factors)
  const totalWork = workModifiers.reduce((work, modifier) => 
    work * (1 + modifier), baseWork);
  
  return Math.ceil(totalWork);
}

/**
 * @deprecated Use DENSITY_BASED_TASKS.includes(category) directly instead
 * Helper function to check if a category uses density-based calculations
 */
export function isDensityBasedCategory(category: WorkCategory): boolean {
  return DENSITY_BASED_TASKS.includes(category);
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
  
  // Calculate total work contribution following old system's approach
  return staff.reduce((total, staffMember) => {
    // Get the relevant skill for this category
    let relevantSkill = 0;
    
    // Match skill to category based on staff's skillset
    if (staffMember.skills) {
      switch(category) {
        case WorkCategory.PLANTING:
        case WorkCategory.HARVESTING:
        case WorkCategory.CLEARING:
        case WorkCategory.UPROOTING:
          relevantSkill = staffMember.skills.field; // Field skill
          break;
        case WorkCategory.CRUSHING:
        case WorkCategory.FERMENTATION:
          relevantSkill = staffMember.skills.winery; // Winery skill
          break;
        case WorkCategory.BUILDING:
        case WorkCategory.UPGRADING:
        case WorkCategory.MAINTENANCE:
          relevantSkill = staffMember.skills.maintenance; // Maintenance skill
          break;
        case WorkCategory.STAFF_SEARCH:
        case WorkCategory.ADMINISTRATION:
          relevantSkill = staffMember.skills.administration; // Administration skill
          break;
        default:
          // Use the highest available skill as fallback
          relevantSkill = Math.max(
            staffMember.skills.field,
            staffMember.skills.winery,
            staffMember.skills.administration,
            staffMember.skills.sales,
            staffMember.skills.maintenance
          );
      }
    } else {
      // Fallback to general skill level if detailed skills not available
      relevantSkill = staffMember.skillLevel || 0.5;
    }
    
    // Match the old system's workforce calculation
    const workforce = staffMember.workforce || 50; // Default workforce is 50 in old system
    
    // Calculate potential contribution WITHOUT dividing by task count
    let staffPotentialContribution = workforce * relevantSkill;
    
    // Apply specialization bonus if applicable (multiplicative, not additive like before)
    if (staffMember.specializations && staffMember.specializations.length > 0) {
      const hasRelevantSpecialization = staffMember.specializations.some(spec => 
        isSpecializationRelevant(spec, category)
      );
      
      if (hasRelevantSpecialization) {
        // Apply a 30% bonus multiplicatively as in the old system
        staffPotentialContribution *= 1.3;
      }
    }
    
    return total + staffPotentialContribution;
  }, 0);
}

/**
 * Check if a specialization is relevant for a category
 * @param specialization Staff specialization
 * @param category Activity category
 * @returns True if specialization is relevant for the category
 */
function isSpecializationRelevant(specialization: string, category: WorkCategory): boolean {
  // Map specializations to relevant categories
  const specializationCategoryMap: Record<string, WorkCategory[]> = {
    'field': [
      WorkCategory.PLANTING,
      WorkCategory.HARVESTING,
      WorkCategory.CLEARING,
      WorkCategory.UPROOTING
    ],
    'winery': [
      WorkCategory.CRUSHING,
      WorkCategory.FERMENTATION
    ],
    'maintenance': [
      WorkCategory.BUILDING,
      WorkCategory.UPGRADING,
      WorkCategory.MAINTENANCE
    ],
    'administration': [
      WorkCategory.STAFF_SEARCH,
      WorkCategory.ADMINISTRATION
    ],
    'sales': [] // No direct activities yet
  };
  
  // Check if the specialization applies to this category
  const relevantCategories = specializationCategoryMap[specialization] || [];
  
  return relevantCategories.includes(category);
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
  // This should match the old system's implementation where tool bonuses are multiplicative
  
  // For now, implement a simple version with fixed speed bonuses
  // Each tool gives a 20% bonus, applied multiplicatively
  return toolIds.reduce((bonus, _) => bonus * 1.2, 1.0);
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
    additionalParams?: Record<string, any> & { // Allow standard params + specific ones for calculation
      // Factors needed for calculateTotalWork that might be passed in
      altitude?: number;
      country?: string;
      region?: string;
      resourceName?: GrapeVariety | null;
      skillLevel?: number;
      specializations?: string[];
    };
  }
): ActivityProgress {
  const { 
    density, 
    taskMultipliers, 
    workModifiers = [],
    targetId,
    completionCallback,
    progressCallback,
    additionalParams = {} // Default to empty object
  } = params;
  
  // Extract calculation-specific factors from additionalParams
  const { 
    altitude,
    country,
    region,
    resourceName,
    skillLevel,
    specializations,
    // Capture remaining params to store on the activity, excluding the calc factors
    ...storedParams 
  } = additionalParams;

  // Get rate and initial work based on category from constants
  const rate = TASK_RATES[category];
  const initialWork = INITIAL_WORK[category];
  
  // Check if this category should use density adjustment
  const useDensityAdjustment = DENSITY_BASED_TASKS.includes(category);

  // Apply task multiplier if available (for the specific category)
  const multiplier = taskMultipliers?.[category] || 1.0;
  const adjustedAmount = amount * multiplier;
  
  // Calculate total work using the simplified calculator
  const totalWork = calculateTotalWork(adjustedAmount, {
    rate,
    initialWork,
    density,
    useDensityAdjustment,
    workModifiers
  });
  
  return {
    id: uuidv4(), // Use uuidv4 for unique IDs
    category,
    totalWork,
    appliedWork: 0,
    completionCallback,
    progressCallback,
    targetId,
    params: storedParams // Store only the remaining additionalParams
  };
}

/**
 * Basic function to apply work to an activity
 */
export function applyWorkToActivity(
  activity: ActivityProgress,
  workAmount: number
): ActivityProgress {
  const appliedWork = Math.min(activity.totalWork, activity.appliedWork + workAmount);
  const progress = appliedWork / activity.totalWork;
  
  // Call progress callback if provided
  if (activity.progressCallback) {
    activity.progressCallback(progress);
  }
  
  // Call completion callback if activity is complete
  if (progress >= 1 && activity.completionCallback) {
    activity.completionCallback();
  }
  
  return {
    ...activity,
    appliedWork,
  };
} 