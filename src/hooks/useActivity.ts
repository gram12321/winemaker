import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  WorkCategory, 
  calculateTotalWork,
  ActivityProgress
} from '../lib/game/workCalculator';
import { 
  addActivity, 
  getActivityById, 
  updateActivity, 
  getActivityProgress,
  assignStaffToActivity,
  removeActivity
} from '../lib/game/activityManager';
import displayManager from '../lib/game/displayManager';
import { toast } from '../lib/ui/toast';

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

export interface UseActivityResult {
  activityId: string | null;
  progress: number;
  isInProgress: boolean;
  appliedWork: number;
  totalWork: number;
  estimateWork: (options: Partial<ActivityOptions>) => number;
  startActivity: (options: ActivityOptions) => string | null;
  assignStaff: (staffIds: string[]) => void;
  onCompleted: (callback: () => void) => void;
  onProgress: (callback: (progress: number) => void) => void;
  cancelActivity: () => boolean;
}

export function useActivity(displayStateKey: string): UseActivityResult {
  // Ensure we have display state for this activity
  if (!displayManager.getDisplayState(displayStateKey)) {
    displayManager.createDisplayState(displayStateKey, {
      activityId: null as string | null
    });
  }

  const displayState = displayManager.getDisplayState(displayStateKey);
  const [progress, setProgress] = useState(0);
  const [appliedWork, setAppliedWork] = useState(0);
  const [totalWork, setTotalWork] = useState(0);
  const [completionCallbacks, setCompletionCallbacks] = useState<(() => void)[]>([]);
  const [progressCallback, setProgressCallback] = useState<((progress: number) => void) | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);

  // Check if an activity is in progress
  const isInProgress = displayState.activityId !== null;

  // Update activity information from activity manager
  useEffect(() => {
    const activityId = displayState.activityId;
    if (!activityId) {
      setProgress(0);
      setAppliedWork(0);
      setTotalWork(0);
      return;
    }

    const activity = getActivityById(activityId);
    if (activity) {
      setAppliedWork(activity.appliedWork);
      setTotalWork(activity.totalWork);
      setProgress((activity.appliedWork / activity.totalWork) * 100);
    } else {
      // Activity not found, it might have been completed and removed
      displayManager.updateDisplayState(displayStateKey, { activityId: null });
      setProgress(0);
      setAppliedWork(0);
      setTotalWork(0);
    }
  }, [displayState.activityId, displayState]);

  // Helper to estimate work for given options
  const estimateWork = (options: Partial<ActivityOptions>): number => {
    if (!options.category || !options.amount) return 0;
    
    return calculateTotalWork(options.amount, {
      category: options.category,
      density: options.density,
      taskMultipliers: options.taskMultipliers,
      workModifiers: options.workModifiers
    });
  };

  // Start a new activity
  const startActivity = useCallback((options: ActivityOptions): string | null => {
    if (displayState.activityId) {
      console.warn(`[useActivity] Activity already in progress with ID ${displayState.activityId}`);
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

      // Calculate total work required using the existing calculateTotalWork function
      const totalWork = calculateTotalWork(amount, {
        category,
        density,
        taskMultipliers,
        workModifiers
      });
      console.log(`[useActivity] Calculated work for ${category}: ${totalWork} units (amount: ${amount})`);

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
        description: `Started ${category} activity`
      });

      return activityId;
    } catch (error) {
      console.error('[useActivity] Error starting activity:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to start activity. Please try again.',
        variant: 'destructive',
      });
      
      return null;
    }
  }, [displayState.activityId]);

  // Assign staff to current activity
  const assignStaff = useCallback((staffIds: string[]) => {
    const activityId = displayState.activityId;
    if (!activityId) {
      console.warn('[useActivity] Cannot assign staff: No active activity');
      return false;
    }
    
    try {
      const activity = getActivityById(activityId);
      if (!activity) {
        console.warn('[useActivity] Cannot assign staff: Activity not found');
        return false;
      }
      
      // Assign staff to the activity
      assignStaffToActivity(activityId, staffIds);
      
      // Update local state
      setAssignedStaff(staffIds);
      
      console.log(`[useActivity] Assigned ${staffIds.length} staff to activity ${activityId}`);
      
      toast({
        title: 'Staff Assigned',
        description: `Assigned ${staffIds.length} staff to the activity`
      });
      
      return true;
    } catch (error) {
      console.error('[useActivity] Error assigning staff:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to assign staff. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [displayState.activityId]);

  // Set completion callback
  const onCompleted = useCallback((callback: () => void) => {
    setCompletionCallbacks(prev => [...prev, callback]);
    
    // If we already have an activity, update it with the callback
    const activityId = displayState.activityId;
    if (activityId) {
      updateActivity(activityId, {
        completionCallback: callback
      });
    }
  }, [displayState.activityId]);

  // Set progress callback
  const onProgress = (callback: (progress: number) => void) => {
    setProgressCallback(() => callback);
    
    // If we already have an activity, update it with the callback
    const activityId = displayState.activityId;
    if (activityId) {
      updateActivity(activityId, {
        progressCallback: callback
      });
    }
  };

  // Update activity when callbacks change
  useEffect(() => {
    const activityId = displayState.activityId;
    if (!activityId) return;

    if (completionCallbacks.length > 0 || progressCallback) {
      updateActivity(activityId, {
        completionCallback: completionCallbacks.length > 0 ? completionCallbacks[0] : undefined,
        progressCallback: progressCallback || undefined
      });
    }
  }, [completionCallbacks, progressCallback, displayState.activityId]);

  // Cancel the activity
  const cancelActivity = useCallback(() => {
    if (!displayState.activityId) {
      return false;
    }
    
    try {
      // Remove the activity
      removeActivity(displayState.activityId);
      
      // Reset state
      displayManager.updateDisplayState(displayStateKey, { activityId: null });
      setProgress(0);
      setAppliedWork(0);
      setTotalWork(0);
      setCompletionCallbacks([]);
      setAssignedStaff([]);
      
      console.log(`[useActivity] Cancelled activity ${displayState.activityId}`);
      
      toast({
        title: 'Activity Cancelled',
        description: 'The activity has been cancelled.'
      });
      
      return true;
    } catch (error) {
      console.error('[useActivity] Error cancelling activity:', error);
      return false;
    }
  }, [displayState.activityId, displayStateKey]);

  return {
    activityId: displayState.activityId,
    progress,
    isInProgress,
    appliedWork,
    totalWork,
    estimateWork,
    startActivity,
    assignStaff,
    onCompleted,
    onProgress,
    cancelActivity
  };
} 