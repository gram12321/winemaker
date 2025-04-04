/**
 * Activity Manager
 * Manages and tracks work activities in the game
 */

import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState } from '@/gameState';
import { 
  ActivityProgress, 
  WorkCategory, 
  calculateStaffWorkContribution, 
  calculateToolSpeedBonus,
  applyWorkToActivity
} from './workCalculator';
import { consoleService } from '@/components/layout/Console';
import displayManager from './displayManager';
import { Staff } from '@/gameState';

// Store activities in gameState
const initializeActivitiesInGameState = () => {
  const gameState = getGameState();
  if (!gameState.activities) {
    updateGameState({
      activities: [] as ActivityProgress[]
    });
  }
};

/**
 * Get all current activities
 * @returns Array of activity progress objects
 */
export const getAllActivities = (): ActivityProgress[] => {
  initializeActivitiesInGameState();
  return getGameState().activities || [];
};

/**
 * Get activities by category
 * @param category Work category to filter by
 * @returns Array of activity progress objects matching the category
 */
export const getActivitiesByCategory = (category: WorkCategory): ActivityProgress[] => {
  return getAllActivities().filter(activity => activity.category === category);
};

/**
 * Get activity by ID
 * @param id Activity ID
 * @returns Activity progress object or undefined if not found
 */
export const getActivityById = (id: string): ActivityProgress | undefined => {
  return getAllActivities().find(activity => activity.id === id);
};

/**
 * Get activities for a target
 * @param targetId ID of the target (e.g., vineyard ID)
 * @returns Array of activity progress objects for the target
 */
export const getActivitiesForTarget = (targetId: string): ActivityProgress[] => {
  return getAllActivities().filter(activity => activity.targetId === targetId);
};

/**
 * Check if a target has any activities in progress
 * @param targetId ID of the target to check
 * @returns True if the target has activities, false otherwise
 */
export const isTargetBusy = (targetId: string): boolean => {
  return getAllActivities().some(activity => activity.targetId === targetId);
};

/**
 * Check if a target already has an active activity
 * @param targetId ID of the target to check
 * @param category Optional category to check (if only checking for specific activity types)
 * @returns true if an active activity exists, false otherwise
 */
export function hasActiveActivity(targetId: string, category?: string): boolean {
  if (!targetId) return false; // Early return if no targetId
  
  const gameState = getGameState();
  return gameState.activities.some(activity => 
    activity.targetId === targetId && 
    activity.appliedWork < activity.totalWork && // Not complete if applied work < total work
    (category ? activity.category === category : true)
  );
}

/**
 * Add a new activity
 * @param activity Activity progress object to add
 * @returns The added activity
 */
export const addActivity = (activity: ActivityProgress): ActivityProgress => {
  const gameState = getGameState();
  
  // Check if target already has an active activity
  if (activity.targetId && hasActiveActivity(activity.targetId, activity.category || undefined)) {
    const error = `Cannot start a new ${activity.category || 'work'} activity: target ${activity.targetId} already has an active activity`;
    consoleService.error(error);
    throw new Error(error);
  }
  
  initializeActivitiesInGameState();
  
  // Ensure the activity has an ID
  const activityWithId = {
    ...activity,
    id: activity.id || uuidv4()
  };
  
  // Add to game state
  const currentActivities = getAllActivities();
  updateGameState({
    activities: [...currentActivities, activityWithId]
  });
  
  consoleService.info(`Started ${activityWithId.category} activity`);
  displayManager.updateAllDisplays();
  
  return activityWithId;
};

/**
 * Update an activity
 * @param id Activity ID
 * @param updates Partial activity object with updates
 * @returns The updated activity or undefined if not found
 */
export const updateActivity = (id: string, updates: Partial<ActivityProgress>): ActivityProgress | undefined => {
  const currentActivities = getAllActivities();
  const activityIndex = currentActivities.findIndex(activity => activity.id === id);
  
  if (activityIndex === -1) return undefined;
  
  const updatedActivity = {
    ...currentActivities[activityIndex],
    ...updates
  };
  
  const updatedActivities = [...currentActivities];
  updatedActivities[activityIndex] = updatedActivity;
  
  updateGameState({
    activities: updatedActivities
  });
  
  displayManager.updateAllDisplays();
  
  return updatedActivity;
};

/**
 * Remove an activity
 * @param id Activity ID
 * @returns True if the activity was removed, false otherwise
 */
export const removeActivity = (id: string): boolean => {
  const currentActivities = getAllActivities();
  const updatedActivities = currentActivities.filter(activity => activity.id !== id);
  
  if (updatedActivities.length === currentActivities.length) {
    return false;
  }
  
  updateGameState({
    activities: updatedActivities
  });
  
  consoleService.info(`Completed activity`);
  displayManager.updateAllDisplays();
  
  return true;
};

/**
 * Assign staff to an activity
 * @param activityId Activity ID
 * @param staffIds IDs of staff to assign
 * @returns The updated activity or undefined if not found
 */
export const assignStaffToActivity = (activityId: string, staffIds: string[]): ActivityProgress | undefined => {
  const activity = getActivityById(activityId);
  if (!activity) return undefined;
  
  // Store the staff IDs in the activity params
  const updatedParams = {
    ...activity.params,
    assignedStaffIds: staffIds
  };
  
  return updateActivity(activityId, { params: updatedParams });
};

/**
 * Assign tools to an activity
 * @param activityId Activity ID
 * @param toolIds IDs of tools to assign
 * @returns The updated activity or undefined if not found
 */
export const assignToolsToActivity = (activityId: string, toolIds: string[]): ActivityProgress | undefined => {
  const activity = getActivityById(activityId);
  if (!activity) return undefined;
  
  // Store the tool IDs in the activity params
  const updatedParams = {
    ...activity.params,
    assignedToolIds: toolIds
  };
  
  return updateActivity(activityId, { params: updatedParams });
};

/**
 * Process all activities for one game tick
 * Apply work based on assigned staff and tools
 */
export const processActivitiesTick = (): void => {
  const gameState = getGameState();
  const activities = getAllActivities();
  const updatedActivities: ActivityProgress[] = [];
  const completedActivities: string[] = [];
  
  // Count the tasks per staff member (to match old system's workforce division)
  const staffTaskCount = new Map<string, number>();
  
  // First pass: count how many activities each staff is assigned to
  activities.forEach(activity => {
    const assignedStaffIds = activity.params?.assignedStaffIds || [];
    assignedStaffIds.forEach((staffId: string) => {
      staffTaskCount.set(staffId, (staffTaskCount.get(staffId) || 0) + 1);
    });
  });
  
  activities.forEach(activity => {
    // Get assigned staff for this activity
    const assignedStaffIds = activity.params?.assignedStaffIds || [];
    const assignedStaff = assignedStaffIds.map((id: string) => {
      const staff = gameState.staff.find(s => s.id === id);
      if (staff) {
        // Add the task count property to match old system
        return {
          ...staff,
          taskCount: staffTaskCount.get(id) || 1
        };
      }
      return null;
    }).filter(Boolean) as (Staff & { taskCount: number })[];
    
    // Get assigned tools for this activity
    const assignedToolIds = activity.params?.assignedToolIds || [];
    
    // Only apply work if staff is assigned (exact match to old system)
    if (assignedStaff.length > 0) {
      // Calculate work for each staff member based on relevant skill and task count
      let appliedWork = 0;
      
      assignedStaff.forEach(staff => {
        // Get relevant skill based on activity category
        let relevantSkill = 0;
        switch (activity.category) {
          case WorkCategory.PLANTING:
          case WorkCategory.HARVESTING:
          case WorkCategory.CLEARING:
          case WorkCategory.UPROOTING:
            relevantSkill = staff.skills?.field || 0;
            break;
          case WorkCategory.CRUSHING:
          case WorkCategory.FERMENTATION:
            relevantSkill = staff.skills?.winery || 0;
            break;
          case WorkCategory.BUILDING:
          case WorkCategory.UPGRADING:
          case WorkCategory.MAINTENANCE:
            relevantSkill = staff.skills?.maintenance || 0;
            break;
          case WorkCategory.STAFF_SEARCH:
          case WorkCategory.ADMINISTRATION:
            relevantSkill = staff.skills?.administration || 0;
            break;
          default:
            // Use highest skill as fallback
            relevantSkill = Math.max(
              staff.skills?.field || 0,
              staff.skills?.winery || 0,
              staff.skills?.maintenance || 0,
              staff.skills?.administration || 0,
              staff.skills?.sales || 0
            );
        }
        
        // Workforce division by task count (exactly like old system)
        const workforce = staff.workforce || 50; // Default to 50 like old system
        appliedWork += (workforce / staff.taskCount) * relevantSkill;
      });
      
      // Apply tool bonus exactly like old system - multiplicative 
      if (assignedToolIds.length > 0) {
        appliedWork *= calculateToolSpeedBonus(assignedToolIds, activity.category);
      }
      
      // Apply work to the activity
      const updatedActivity = {
        ...activity,
        appliedWork: Math.min(activity.totalWork, activity.appliedWork + appliedWork)
      };
      
      updatedActivities.push(updatedActivity);
      
      // Check if activity is complete
      if (updatedActivity.appliedWork >= updatedActivity.totalWork) {
        completedActivities.push(activity.id);
        
        // Call completion callback if provided
        if (updatedActivity.completionCallback) {
          updatedActivity.completionCallback();
        }
      } else if (updatedActivity.progressCallback) {
        // Call progress callback if provided
        const progress = updatedActivity.appliedWork / updatedActivity.totalWork;
        updatedActivity.progressCallback(progress);
      }
    } else {
      // No staff assigned, no work applied (keep activity unchanged)
      updatedActivities.push(activity);
    }
  });
  
  // Update game state with updated activities
  updateGameState({
    activities: updatedActivities.filter(activity => 
      !completedActivities.includes(activity.id)
    )
  });
  
  // Log completions
  if (completedActivities.length > 0) {
    completedActivities.forEach(id => {
      const activity = activities.find(a => a.id === id);
      if (activity) {
        consoleService.info(`Completed ${activity.category} activity`);
      }
    });
  }
  
  displayManager.updateAllDisplays();
}

/**
 * Calculate progress percentage for an activity
 * @param activityId Activity ID
 * @returns Progress percentage (0-100) or 0 if activity not found
 */
export const getActivityProgress = (activityId: string): number => {
  const activity = getActivityById(activityId);
  if (!activity) return 0;
  
  return (activity.appliedWork / activity.totalWork) * 100;
};

/**
 * Get progress for a specific target
 * @param targetId Target ID
 * @param category Optional category to filter by
 * @returns Progress object with percentages
 */
export const getTargetProgress = (
  targetId: string, 
  category?: WorkCategory
): { 
  hasActivities: boolean;
  overallProgress: number;
  activitiesByCategory: Record<WorkCategory, number>;
} => {
  const activities = getActivitiesForTarget(targetId);
  
  if (activities.length === 0) {
    return { 
      hasActivities: false, 
      overallProgress: 0,
      activitiesByCategory: {} as Record<WorkCategory, number>
    };
  }
  
  // Filter by category if provided
  const filteredActivities = category 
    ? activities.filter(a => a.category === category)
    : activities;
  
  // Calculate overall progress
  const totalWork = filteredActivities.reduce((sum, a) => sum + a.totalWork, 0);
  const totalApplied = filteredActivities.reduce((sum, a) => sum + a.appliedWork, 0);
  const overallProgress = totalWork > 0 ? (totalApplied / totalWork) * 100 : 0;
  
  // Calculate progress by category
  const activitiesByCategory = filteredActivities.reduce((acc, activity) => {
    const cat = activity.category;
    if (!acc[cat]) {
      acc[cat] = 0;
    }
    
    const categoryProgress = (activity.appliedWork / activity.totalWork) * 100;
    acc[cat] = Math.max(acc[cat], categoryProgress);
    
    return acc;
  }, {} as Record<WorkCategory, number>);
  
  return {
    hasActivities: true,
    overallProgress,
    activitiesByCategory
  };
}; 