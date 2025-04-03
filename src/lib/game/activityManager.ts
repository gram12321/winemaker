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
 * Add a new activity
 * @param activity Activity progress object to add
 * @returns The added activity
 */
export const addActivity = (activity: ActivityProgress): ActivityProgress => {
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
  
  activities.forEach(activity => {
    // Temporary: Add some work each tick until staff system is implemented
    const workPerTick = activity.totalWork * 0.1; // 10% progress per tick
    const updatedActivity = {
      ...activity,
      appliedWork: Math.min(activity.totalWork, (activity.appliedWork || 0) + workPerTick)
    };

    // Check if activity is complete
    if (updatedActivity.appliedWork >= updatedActivity.totalWork) {
      completedActivities.push(activity.id);
      // Call completion callback if it exists
      if (activity.completionCallback) {
        activity.completionCallback();
      }
    } else {
      updatedActivities.push(updatedActivity);
      // Call progress callback if it exists
      if (activity.progressCallback) {
        const progress = updatedActivity.appliedWork / updatedActivity.totalWork;
        activity.progressCallback(progress);
      }
    }
  });

  // Remove completed activities and update the rest
  completedActivities.forEach(id => removeActivity(id));
  if (updatedActivities.length > 0) {
    updateGameState({
      activities: updatedActivities
    });
    displayManager.updateAllDisplays();
  }
};

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