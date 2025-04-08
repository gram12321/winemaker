import { Staff } from '@/gameState';
import { REGION_ALTITUDE_RANGES } from '@/lib/core/constants/vineyardConstants';
import { allResources } from './resource';

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
export const BASE_WORK_UNITS = 50;

// Default vine density used for density-based calculations
export const DEFAULT_VINE_DENSITY = 5000;

// Tasks that are affected by planting density
export const DENSITY_BASED_TASKS = [
  WorkCategory.PLANTING,
  WorkCategory.HARVESTING,
  WorkCategory.UPROOTING
];

// Base processing rates for different tasks
export const TASK_RATES: Record<string, number> = {
  [WorkCategory.PLANTING]: 0.7,      // 0.7 acres/week
  [WorkCategory.HARVESTING]: 4.4,    // 4.4 acres/week
  [WorkCategory.CRUSHING]: 2.5,      // 2.5 tons/week
  [WorkCategory.FERMENTATION]: 5.0,  // 5 kiloliters/week
  [WorkCategory.CLEARING]: 0.5,      // 0.5 acres/week
  [WorkCategory.UPROOTING]: 0.56,    // 0.56 acres/week
  [WorkCategory.BUILDING]: 100000,   // €100,000 worth per week
  [WorkCategory.UPGRADING]: 100000,  // €100,000 worth per week
  [WorkCategory.MAINTENANCE]: 500000, // €500,000 worth per week
  [WorkCategory.STAFF_SEARCH]: 5.0,  // 5 candidates/week
  [WorkCategory.ADMINISTRATION]: 1.0  // 1 administrative task/week
};

// Initial setup work for tasks that require setup before starting
export const INITIAL_WORK: Record<string, number> = {
  [WorkCategory.PLANTING]: 10,
  [WorkCategory.HARVESTING]: 5,
  [WorkCategory.CRUSHING]: 10,
  [WorkCategory.FERMENTATION]: 25,
  [WorkCategory.CLEARING]: 5,
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
    altitude?: number;
    country?: string;
    region?: string;
    resourceName?: string;
  }
): number {
  const {
    category,
    density,
    taskMultipliers = {},
    workModifiers = [],
    altitude,
    country,
    region,
    resourceName
  } = factors;

  // Get base rate for the task
  const baseRate = TASK_RATES[category];
  if (!baseRate) {
    console.error(`[WorkCalculator] No base rate found for category: ${category}`);
    return 0;
  }

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
  let baseWork = initialWork + workUnits;

  // --- Apply Planting Specific Modifiers --- START
  let plantingModifiers: number[] = [];
  if (category === WorkCategory.PLANTING) {
    // 1. Altitude Effect (Migrated from old plantingOverlay.js)
    if (altitude !== undefined && country && region) {
      const countryData = REGION_ALTITUDE_RANGES[country as keyof typeof REGION_ALTITUDE_RANGES];
      const altitudeRange = countryData ? (countryData[region as keyof typeof countryData] as [number, number] || null) : null;
      if (altitudeRange) {
        const [minAltitude, maxAltitude] = altitudeRange;
        if (maxAltitude > minAltitude) { // Avoid division by zero
          const medianAltitude = (minAltitude + maxAltitude) / 2;
          const altitudeDeviation = (altitude - medianAltitude) / (maxAltitude - minAltitude);
          // 5% less work for every 10% below median, 5% more for every 10% above
          // This translates to a modifier of deviation * 0.5
          const altitudeModifier = altitudeDeviation * 0.5;
          plantingModifiers.push(altitudeModifier);
        }
      }
    }

    // 2. Fragility Effect (Migrated from old plantingOverlay.js)
    if (resourceName) {
      const resource = allResources.find(r => r.name === resourceName);
      if (resource) {
        const robustness = resource.fragile; // Assuming fragile is the robustness (0-1)
        const fragilityModifier = (1 - robustness); // 0 means 0% extra, 0.6 means 60% extra
        plantingModifiers.push(fragilityModifier);
      }
    }
  }
  // --- Apply Planting Specific Modifiers --- END

  // Combine general modifiers and planting-specific modifiers
  const allModifiers = [...workModifiers, ...plantingModifiers];

  // Apply modifiers
  const totalWork = allModifiers.reduce((work, modifier) =>
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
  
  // Calculate staff tasks to simulate taskCount from old system
  // In a real implementation, you'd check how many activities each staff is assigned to
  const staffTaskCount = 1; // Default to 1 task per staff member
  
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
    
    // Direct port of the old system's formula: (workforce / taskCount) * relevantSkill
    let staffContribution = (workforce / staffTaskCount) * relevantSkill;
    
    // Apply specialization bonus if applicable (multiplicative, not additive like before)
    if (staffMember.specializations && staffMember.specializations.length > 0) {
      const hasRelevantSpecialization = staffMember.specializations.some(spec => 
        isSpecializationRelevant(spec, category)
      );
      
      if (hasRelevantSpecialization) {
        // Apply a 30% bonus multiplicatively as in the old system
        staffContribution *= 1.3;
      }
    }
    
    return total + staffContribution;
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