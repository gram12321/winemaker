import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState } from '@/gameState';
import { 
  ActivityProgress, 
  WorkCategory, 
  calculateToolSpeedBonus, 
  calculateTotalWork, 
  calculateStaffWorkContribution, 
  TASK_RATES, 
  INITIAL_WORK, 
  DENSITY_BASED_TASKS
} from './workCalculator';

import displayManager from './displayManager';
import { Staff } from '@/gameState';
import { toast } from '../ui/toast';
import { saveActivityToDb, removeActivityFromDb, updateActivityInDb } from '../database/activityDB';

// Store activities in gameState
const initializeActivitiesInGameState = () => {
  const gameState = getGameState();
  if (!gameState.activities) {
    updateGameState({
      activities: [] as ActivityProgress[]
    });
  }
};

// Type definitions for activity management
export interface ActivityOptions {
  category: WorkCategory;
  amount: number;
  title: string;
  targetId?: string;
  density?: number;
  taskMultipliers?: Record<string, number>;
  workModifiers?: number[];
  cost?: number;
  additionalParams?: Record<string, any>;
}

// Map of completion callbacks by activity ID
const completionCallbacks: Record<string, () => void> = {};
const progressCallbacks: Record<string, (progress: number) => void> = {};

// Add the Activity type for clarity
export type Activity = ActivityProgress;


export const estimateActivityWork = (options: Partial<ActivityOptions>): number => {
  if (!options.category || !options.amount) return 0;
  
  const category = options.category;
  
  // Use category-level constants instead of parameters
  const rate = TASK_RATES[category];
  const initialWork = INITIAL_WORK[category];
  const useDensityAdjustment = DENSITY_BASED_TASKS.includes(category);
  
  // For clearing subtasks - use the provided task rates if available
  if (category === WorkCategory.CLEARING && options.additionalParams?.taskRate) {
    return calculateTotalWork(options.amount, {
      rate: options.additionalParams.taskRate,
      initialWork: options.additionalParams.taskInitialWork || initialWork,
      density: options.density,
      useDensityAdjustment,
      workModifiers: options.workModifiers
    });
  }
  
  return calculateTotalWork(options.amount, {
    rate,
    initialWork,
    density: options.density,
    useDensityAdjustment,
    workModifiers: options.workModifiers
  });
};


export const startActivityWithDisplayState = (
  displayStateKey: string, 
  options: ActivityOptions
): string | null => {
  // Ensure display state exists
  if (!displayManager.getDisplayState(displayStateKey)) {
    displayManager.createDisplayState(displayStateKey, {
      activityId: null as string | null
    });
  }
  
  const displayState = displayManager.getDisplayState(displayStateKey);
  
  // Check if there's already an activity in progress
  if (displayState.activityId && getActivityById(displayState.activityId)) {
    // console.warn(`[ActivityManager] Activity already in progress with ID ${displayState.activityId}`);
    return displayState.activityId;
  }
  
  try {
    const { 
      category, 
      amount, 
      title,
      targetId, 
      density, 
      taskMultipliers, 
      workModifiers, 
      cost, 
      additionalParams 
    } = options;

    // Use category-level constants by default
    let rate = TASK_RATES[category];
    let initialWork = INITIAL_WORK[category];
    const useDensityAdjustment = DENSITY_BASED_TASKS.includes(category);
    
    // For clearing subtasks - use the provided task rates if available
    if (category === WorkCategory.CLEARING && additionalParams?.taskRate) {
      rate = additionalParams.taskRate;
      initialWork = additionalParams.taskInitialWork || initialWork;
    }

    // Calculate total work required
    const totalWork = calculateTotalWork(amount, {
      rate,
      initialWork,
      density,
      useDensityAdjustment,
      workModifiers
    });

    // Create activity ID
    const activityId = uuidv4();

    // Create the activity
    const activity: ActivityProgress = {
      id: activityId,
      category,
      totalWork,
      appliedWork: 0,
      targetId,
      params: {
        ...additionalParams,
        title
      }
    };

    // Add the activity
    addActivity(activity);

    // Update display state
    displayManager.updateDisplayState(displayStateKey, { activityId });

    // Show toast notification
    toast({
      title: `${title} Started`,
      description: `Started ${category} activity with ${totalWork} work units required`
    });

    return activityId;
  } catch (error) {
    // console.error('[ActivityManager] Error starting activity:', error);
    
    // Show error toast
    toast({
      title: 'Error',
      description: 'Failed to start activity. Please try again.',
      variant: 'destructive',
    });
    
    return null;
  }
};

export const assignStaffWithDisplayState = (
  displayStateKey: string,
  staffIds: string[]
): boolean => {
  const displayState = displayManager.getDisplayState(displayStateKey);
  const activityId = displayState?.activityId;
  
  if (!activityId) {
    return false;
  }
  
  try {
    // Get staff information for better toast messages
    const assignedStaffCount = staffIds.length;
    
    // Assign staff
    assignStaffToActivity(activityId, staffIds);
    
    // Success toast
    if (assignedStaffCount > 0) {
      // Get the activity to show better information
      const activity = getActivityById(activityId);
      const activityTitle = activity?.params?.title || 'activity';
      
      toast({
        title: 'Staff Assigned',
        description: `${assignedStaffCount} staff ${assignedStaffCount === 1 ? 'member' : 'members'} assigned to ${activityTitle}`
      });
    }
    
    return true;
  } catch (error) {
    // console.error('[ActivityManager] Error assigning staff:', error);
    
    toast({
      title: 'Assignment Failed',
      description: 'Failed to assign staff to activity',
      variant: 'destructive'
    });
    
    return false;
  }
};

export const setActivityCompletionCallback = (
  activityId: string,
  callback: () => void
): void => {
  completionCallbacks[activityId] = callback;
  
  // If the activity exists, update it
  const activity = getActivityById(activityId);
  if (activity) {
    updateActivity(activityId, {
      completionCallback: callback
    });
  }
};

export const setActivityProgressCallback = (
  activityId: string,
  callback: (progress: number) => void
): void => {
  progressCallbacks[activityId] = callback;
  
  // If the activity exists, update it
  const activity = getActivityById(activityId);
  if (activity) {
    updateActivity(activityId, {
      progressCallback: callback
    });
  }
};

export const cancelActivityWithDisplayState = (
  displayStateKey: string
): boolean => {
  const displayState = displayManager.getDisplayState(displayStateKey);
  const activityId = displayState?.activityId;
  
  if (!activityId) {
    return false;
  }
  
  try {
    // Remove the activity
    removeActivity(activityId);
    
    // Reset state
    displayManager.updateDisplayState(displayStateKey, { activityId: null });
    
    // console.log(`[ActivityManager] Cancelled activity ${activityId}`);
    toast({
      title: 'Activity Cancelled',
      description: 'The activity has been cancelled.'
    });
    
    // Clear callbacks
    delete completionCallbacks[activityId];
    delete progressCallbacks[activityId];
    
    return true;
  } catch (error) {
    // console.error('[ActivityManager] Error cancelling activity:', error);
    return false;
  }
};

export const getActivityProgressFromDisplayState = (
  displayStateKey: string
): {
  activityId: string | null;
  progress: number;
  isInProgress: boolean;
  appliedWork: number;
  totalWork: number;
} => {
  const displayState = displayManager.getDisplayState(displayStateKey);
  const activityId = displayState?.activityId;
  
  if (!activityId) {
    return {
      activityId: null,
      progress: 0,
      isInProgress: false,
      appliedWork: 0,
      totalWork: 0
    };
  }
  
  const activity = getActivityById(activityId);
  if (!activity) {
    // Activity not found, it might have been completed and removed
    displayManager.updateDisplayState(displayStateKey, { activityId: null });
    return {
      activityId: null,
      progress: 0,
      isInProgress: false,
      appliedWork: 0,
      totalWork: 0
    };
  }
  
  const progress = (activity.appliedWork / activity.totalWork) * 100;
  
  return {
    activityId,
    progress,
    isInProgress: true,
    appliedWork: activity.appliedWork,
    totalWork: activity.totalWork
  };
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
 * Add a new activity to the game state and saves to Firebase
 * @param activity Activity to add
 * @returns The added activity or null if the activity cannot be added
 */
export const addActivity = (activity: ActivityProgress): ActivityProgress | null => {
  const gameState = getGameState();
  const activities = gameState.activities || [];

  // Check if target already has an active activity of the same category
  if (activity.targetId && activity.category) {
    const hasActiveActivity = activities.some(
      a => a.targetId === activity.targetId && 
          a.category === activity.category &&
          a.appliedWork < a.totalWork
    );

    if (hasActiveActivity) {
      // Instead of throwing an error, show a toast message
      toast({
        title: "Activity Already in Progress",
        description: "This target already has an active upgrade. Please wait for the current activity to complete.",
        variant: "destructive"
      });
      return null;
    }
  }

  // Ensure the activity has an ID if not provided
  const newActivity = {
    ...activity,
    id: activity.id || `activity-${uuidv4()}`
  };

  updateGameState({
    activities: [...activities, newActivity],
  });

  // Save to database if we have a player ID
  const player = gameState.player;
  if (player?.id) {
    saveActivityToDb({
      ...newActivity,
      userId: player.id
    }).catch(error => {
      console.error('Error saving activity to database:', error);
    });
  }

  displayManager.updateAllDisplays();
  return newActivity;
};

/**
 * Update an activity in the game state and Firebase
 * @param id Activity ID to update
 * @param updates Partial activity updates
 * @returns The updated activity or undefined if not found
 */
export const updateActivity = (id: string, updates: Partial<ActivityProgress>): ActivityProgress | undefined => {
  const gameState = getGameState();
  let updatedActivity: ActivityProgress | undefined;
  
  // Update in game state
  const activities = gameState.activities.map(activity => {
    if (activity.id === id) {
      updatedActivity = { ...activity, ...updates };
      return updatedActivity;
    }
    return activity;
  });
  
  if (updatedActivity) {
    updateGameState({ activities });
    
    // Save to Firebase in the background - add userId for database compatibility
    const { player } = getGameState();
    if (player?.id) {
      updateActivityInDb({
        ...updatedActivity,
        userId: player.id
      }).catch(error => {
        // console.error('[ActivityManager] Error updating activity in database:', error);
      });
    } else {
      // console.warn('[ActivityManager] Cannot update activity in database: no player ID found');
    }
  }
  
  return updatedActivity;
};

/**
 * Remove an activity from the game state and Firebase
 * @param id Activity ID to remove
 * @returns true if successful, false otherwise
 */
export const removeActivity = (id: string): boolean => {
  const gameState = getGameState();
  const activityExists = gameState.activities.some(activity => activity.id === id);
  
  if (activityExists) {
    // Remove from game state
    const activities = gameState.activities.filter(activity => activity.id !== id);
    updateGameState({ activities });
    
    // Remove from Firebase in the background
    removeActivityFromDb(id).catch(error => {
      // console.error('[ActivityManager] Error removing activity from database:', error);
    });
    
    // Clean up callbacks
    delete completionCallbacks[id];
    delete progressCallbacks[id];
    
    return true;
  }
  
  return false;
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
 * Get work details for an activity
 * @param activityId Activity ID
 * @returns Object with applied and total work, or null if activity not found
 */
export const getActivityWorkDetails = (activityId: string): { 
  appliedWork: number; 
  totalWork: number;
  title?: string;
} | null => {
  const activity = getActivityById(activityId);
  if (!activity) return null;
  
  return {
    appliedWork: activity.appliedWork,
    totalWork: activity.totalWork,
    title: activity.params?.title
  };
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
          taskCount: staffTaskCount.get(id) || 1 // Get actual task count for this staff member
        };
      }
      return null;
    }).filter(Boolean) as (Staff & { taskCount: number })[];
    
    // Get assigned tools for this activity
    const assignedToolIds = activity.params?.assignedToolIds || [];
    
    // Only apply work if staff is assigned (exact match to old system)
    if (assignedStaff.length > 0) {
      
      // Calculate work for each staff member individually, considering their task count
      let appliedWorkThisTick = 0;
      assignedStaff.forEach(staff => {
        // Calculate the staff member's POTENTIAL contribution to this category
        const potentialContribution = calculateStaffWorkContribution([staff], activity.category);
        // Divide by their total task count
        const actualContribution = potentialContribution / staff.taskCount;
        appliedWorkThisTick += actualContribution;
      });
      
      // Apply tool bonus exactly like old system - multiplicative 
      if (assignedToolIds.length > 0) {
        const toolBonus = calculateToolSpeedBonus(assignedToolIds, activity.category);
        appliedWorkThisTick *= toolBonus;
      }
      
      // Apply work to the activity
      const updatedActivity = {
        ...activity,
        appliedWork: Math.min(activity.totalWork, activity.appliedWork + appliedWorkThisTick)
      };
      
      updatedActivities.push(updatedActivity);
      
      // Check if activity is complete
      if (updatedActivity.appliedWork >= updatedActivity.totalWork) {
        completedActivities.push(activity.id);
        
        // Call completion callback if provided
        if (typeof updatedActivity.completionCallback === 'function') {
          try {
            updatedActivity.completionCallback();
          } catch (error) {
            // console.error(`Error in completion callback for activity ${activity.id}:`, error);
          }
        }
        
        // Also check our global callback store
        if (completionCallbacks[activity.id]) {
          try {
            completionCallbacks[activity.id]();
            // Remove the callback after execution
            delete completionCallbacks[activity.id];
          } catch (error) {
            // console.error(`Error in stored completion callback for activity ${activity.id}:`, error);
          }
        }
      } else {
        // Activity not complete, call progress callback
        const progress = updatedActivity.appliedWork / updatedActivity.totalWork;
        
        // Call the callback on the activity if available
        if (typeof updatedActivity.progressCallback === 'function') {
          try {
            updatedActivity.progressCallback(progress);
          } catch (error) {
            // console.error(`Error in progress callback for activity ${activity.id}:`, error);
          }
        }
        
        // Call our stored progress callback
        if (progressCallbacks[activity.id]) {
          try {
            progressCallbacks[activity.id](progress);
          } catch (error) {
            // console.error(`Error in stored progress callback for activity ${activity.id}:`, error);
          }
        }
      }
    } else {
      // No staff assigned, no work applied (keep activity unchanged)
      updatedActivities.push(activity);
    }
  });
  
  // Update game state with updated activities
  const remainingActivities = updatedActivities.filter(activity => 
    !completedActivities.includes(activity.id)
  );
  
  updateGameState({
    activities: remainingActivities
  });
  
  // Log completions
  if (completedActivities.length > 0) {
    completedActivities.forEach(id => {
      const activity = activities.find(a => a.id === id);
      if (activity) {
        // consoleService.info(`Completed ${activity.category} activity`);
      }
    });
  }
  
  displayManager.updateAllDisplays();
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