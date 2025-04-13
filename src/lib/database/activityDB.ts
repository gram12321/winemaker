import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getGameState, updateGameState } from '../../gameState';
import { WorkCategory, ActivityProgress } from '../game/workCalculator';
import { setActivityCompletionCallback } from '../game/activityManager';
import { updateVineyard } from '../../services/vineyardService';
import { DEFAULT_VINEYARD_HEALTH } from '../../lib/core/constants/gameConstants';
import displayManager from '@/lib/game/displayManager';
import { toast } from '@/lib/ui/toast';
import { consoleService } from '@/components/layout/Console';
import { generateStaffCandidates, completeHiringProcess } from '../../services/staffService';

// Activity types
export interface Activity extends ActivityProgress {
  userId?: string;
}

type ActivityForDb = Omit<Activity, 'completionCallback' | 'progressCallback'> & {
  userId: string;
};

// Core database operations
export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;

    if (!companyName) {
      return [];
    }

    const companyRef = doc(db, 'companies', companyName);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      return [];
    }

    const data = companyDoc.data();
    const activitiesFromDb: ActivityForDb[] = data.activities || [];
    const mappedActivities: Activity[] = activitiesFromDb.map(activityData => ({ ...activityData } as Activity));

    return mappedActivities;
  } catch (error) {
    return [];
  }
}

export async function saveActivityToDb(activity: Activity): Promise<boolean> {
  const gameState = getGameState();
  const companyName = gameState.player?.companyName;
  
  if (!companyName) {
    return false;
  }
  
  const companyRef = doc(db, 'companies', companyName);

  try {
    const companyDoc = await getDoc(companyRef);
    if (!companyDoc.exists()) {
      return false;
    }

    const companyData = companyDoc.data();
    const currentActivitiesFromDb: ActivityForDb[] = companyData.activities || [];
    const sanitizedActivity = sanitizeActivityForDb(activity);

    // Check if activity exists and update or add as needed
    const activityIndex = currentActivitiesFromDb.findIndex(a => a.id === sanitizedActivity.id);
    let updatedActivitiesForDb: ActivityForDb[];

    if (activityIndex > -1) {
      updatedActivitiesForDb = [...currentActivitiesFromDb];
      updatedActivitiesForDb[activityIndex] = sanitizedActivity;
    } else {
      updatedActivitiesForDb = [...currentActivitiesFromDb, sanitizedActivity];
    }

    await updateDoc(companyRef, { activities: updatedActivitiesForDb });

    // Update local gameState
    const currentLocalActivities = gameState.activities || [];
    const localIndex = currentLocalActivities.findIndex(a => a.id === activity.id);
    let updatedLocalActivities;
    
    if (localIndex > -1) {
      updatedLocalActivities = [...currentLocalActivities];
      updatedLocalActivities[localIndex] = activity; 
    } else {
      updatedLocalActivities = [...currentLocalActivities, activity];
    }
    
    updateGameState({ activities: updatedLocalActivities }); 
    return true;
  } catch (error) {
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  return saveActivityToDb(activity);
}

export async function removeActivityFromDb(activityId: string): Promise<boolean> {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;

    if (!companyName) {
      return false;
    }

    const companyRef = doc(db, 'companies', companyName);
    const companyDoc = await getDoc(companyRef);
    if (!companyDoc.exists()) {
      return false;
    }

    const companyData = companyDoc.data();
    const currentActivitiesFromDb: ActivityForDb[] = companyData.activities || [];
    const updatedActivitiesForDb = currentActivitiesFromDb.filter(a => a.id !== activityId);

    if (updatedActivitiesForDb.length === currentActivitiesFromDb.length) {
      // Activity wasn't found in the database - this is fine, it's already not there
      
      // Still update local state if needed
      const currentLocalActivities = gameState.activities || [];
      const updatedLocalActivities = currentLocalActivities.filter(a => a.id !== activityId);
      if (updatedLocalActivities.length !== currentLocalActivities.length) {
        updateGameState({ activities: updatedLocalActivities }); 
      }
      
      return true;
    }

    await updateDoc(companyRef, { activities: updatedActivitiesForDb });

    // Update local gameState
    const updatedLocalActivities = (gameState.activities || []).filter(a => a.id !== activityId);
    updateGameState({ activities: updatedLocalActivities }); 

    return true;
  } catch (error) {
    return false;
  }
}

// Activity system initialization
export async function initializeActivitySystem(): Promise<void> {
  try {
    const loadedActivities = await loadAllActivitiesFromDb();
    const gameState = getGameState();

    const currentActivityIds = new Set((gameState.activities || []).map(a => a.id));
    const loadedActivityIds = new Set(loadedActivities.map(a => a.id));

    let needsUpdate = loadedActivities.length !== currentActivityIds.size || 
                      ![...loadedActivityIds].every(id => currentActivityIds.has(id));

    if (needsUpdate) {
      updateGameState({ activities: loadedActivities }); 
    }

    // Re-attach runtime callbacks for ongoing activities
    await reattachActivityCallbacks();
  } catch (error) {
    if (!getGameState().activities) {
      updateGameState({ activities: [] });
    }
  }
}

// Helper function to sanitize activity data for Firebase
function sanitizeActivityForDb(activity: Activity): ActivityForDb {
  const sanitized: Partial<Activity> = { ...activity }; 

  // Remove callbacks which can't be serialized
  delete sanitized.completionCallback;
  delete sanitized.progressCallback;

  // Process nested objects and handle undefined values
  const sanitizeForFirebase = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeForFirebase(item));
    }
    
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      
      result[key] = obj[key] === undefined ? null : sanitizeForFirebase(obj[key]);
    }
    return result;
  };

  // Sanitize params object
  const sanitizedParams = sanitized.params ? sanitizeForFirebase(sanitized.params) : {};
  
  // Create database-ready activity object with required fields
  const dbActivity: ActivityForDb = {
    id: sanitized.id || '', 
    userId: sanitized.userId || getGameState().player?.id || 'unknown',
    category: (sanitized.category || WorkCategory.ADMINISTRATION) as WorkCategory,
    totalWork: sanitized.totalWork || 0,
    appliedWork: sanitized.appliedWork || 0,
    targetId: sanitized.targetId || '',
    params: {
      ...sanitizedParams,
      assignedStaffIds: Array.isArray(sanitizedParams.assignedStaffIds) 
        ? sanitizedParams.assignedStaffIds 
        : [],
      assignedToolIds: Array.isArray(sanitizedParams.assignedToolIds) 
        ? sanitizedParams.assignedToolIds 
        : []
    }
  };
  
  // Final sanitization pass
  const finalSanitized = sanitizeForFirebase(dbActivity) as ActivityForDb;
  return finalSanitized;
}

// Re-attach callbacks to activities loaded from the database
async function reattachActivityCallbacks(): Promise<void> {
  const activitiesInState = getGameState().activities || [];
  
  if (activitiesInState.length === 0) return;
  
  for (const activity of activitiesInState) {
    if (!activity.id) continue;
    
    try {
      switch (activity.category) {
        case 'clearing': {
          await handleClearingCallbacks(activity, activitiesInState);
          break;
        }
        case 'uprooting': {
          await handleUprootingCallbacks(activity);
          break;
        }
        case 'planting': {
          await handlePlantingCallbacks(activity);
          break;
        }
        case 'harvesting': {
          await handleHarvestingCallbacks(activity);
          break;
        }
        case 'staffSearch': {
          await handleStaffSearchCallbacks(activity);
          break;
        }
        case 'administration': {
          await handleAdministrationCallbacks(activity);
          break;
        }
        case 'crushing':
        case 'fermentation':
        case 'building':
        case 'upgrading':
        case 'maintenance': {
          setActivityCompletionCallback(activity.id, async () => {
            // Generic callback for these activity types
          });
          break;
        }
      }
    } catch (error) {
      // Error re-attaching callbacks
    }
  }
}

// Callback handler for clearing activities
async function handleClearingCallbacks(
  activity: Activity, 
  activitiesInState: Activity[], 
): Promise<void> {
  const targetId = activity.targetId;
  if (!targetId) return;
  
  // Get all clearing activities for the same target (vineyard)
  const relatedActivities = activitiesInState.filter(a => 
    a.category === 'clearing' && a.targetId === targetId);
  
  // Only run this for the first activity of each vineyard to avoid duplication
  if (relatedActivities[0]?.id !== activity.id) return;
  
  // For each related activity, reattach the callback logic
  relatedActivities.forEach(clearingActivity => {
    const taskId = clearingActivity.params?.taskId;
    if (!taskId) return;
    
    setActivityCompletionCallback(clearingActivity.id, async () => {
      // Check if this was the last task
      const remainingActivities = getGameState().activities
        .filter(a => a.category === 'clearing' && a.targetId === targetId);
      
      // If this is the last activity or all have almost completed (applied work > 95% of total)
      const allNearlyComplete = remainingActivities.every(a => 
        a.appliedWork >= a.totalWork * 0.95);
      
      if (remainingActivities.length <= 1 || allNearlyComplete) {
        // Get vineyard and check its status
        const vineyard = getGameState().vineyards.find(v => v.id === targetId);
        if (vineyard && vineyard.status === 'Clearing in Progress') {
          // If the vineyard is still in clearing status, update its status to cleared
          
          // Collect all task IDs to calculate health improvement
          const completedTaskIds = new Set<string>();
          relatedActivities.forEach(a => {
            if (a.params?.taskId) {
              completedTaskIds.add(a.params.taskId);
            }
          });
          
          // Get original health and task parameters from activity params
          const originalActivity = relatedActivities.find(a => a.params?.originalHealth !== undefined);
          const originalHealth = originalActivity?.params?.originalHealth || vineyard.vineyardHealth;
          const isOrganic = !!originalActivity?.params?.isOrganic;
          
          // Reconstruct options to calculate health improvement
          let healthImprovement = 0;
          if (completedTaskIds.has('clear-vegetation')) healthImprovement += 0.10;
          if (completedTaskIds.has('remove-debris')) healthImprovement += 0.05;
          if (completedTaskIds.has('soil-amendment')) healthImprovement += 0.15;
          if (completedTaskIds.has('remove-vines')) {
            healthImprovement += 0.20; // Default to 100% replanting intensity
          }
          
          // Calculate new health based on original health + improvements
          const newHealth = Math.min(1.0, originalHealth + healthImprovement);
          
          await updateVineyard(targetId, {
            status: 'Cleared',
            vineyardHealth: newHealth,
            completedClearingTasks: [...completedTaskIds],
            farmingMethod: isOrganic ? 'Non-Conventional' : 'Conventional'
          });
        }
      }
    });
  });
}

// Callback handler for uprooting activities
async function handleUprootingCallbacks(
  activity: Activity,
): Promise<void> {
  const targetId = activity.targetId;
  if (!targetId) return;
  
  setActivityCompletionCallback(activity.id, async () => {
    const vineyard = getGameState().vineyards.find(v => v.id === targetId);
    if (vineyard) {
      await updateVineyard(targetId, {
        grape: null,
        vineAge: 0,
        density: 0,
        vineyardHealth: DEFAULT_VINEYARD_HEALTH,
        status: 'Ready to be planted',
        ripeness: 0,
        organicYears: 0,
        remainingYield: null,
        completedClearingTasks: [],
        farmingMethod: 'Conventional'
      });
      
      // Update UI
      displayManager.updateDisplayState('vineyardView', { currentActivityId: null });
      
      toast({
        title: "Uprooting Complete",
        description: "The vineyard is now ready for planting with new grape varieties."
      });
      
      consoleService.success(`Uprooting of vineyard complete! The vineyard is now ready for planting.`);
    }
  });
}

// Callback handler for planting activities
async function handlePlantingCallbacks(
  activity: Activity,
): Promise<void> {
  const targetId = activity.targetId;
  if (!targetId) return;
  
  setActivityCompletionCallback(activity.id, async () => {
    const vineyard = getGameState().vineyards.find(v => v.id === targetId);
    
    if (vineyard && vineyard.status.includes('Planting')) {
      const { season } = getGameState();
      
      // Get grape and density from activity parameters
      const grape = activity.params?.grape || activity.params?.additionalParams?.grape;
      const density = activity.params?.density || activity.params?.additionalParams?.density || 5000;
      
      // Determine initial status based on season
      let initialStatus = 'Growing';
      if (season === 'Winter') {
        initialStatus = 'No yield in first season';
      } else if (season === 'Summer') {
        initialStatus = 'Ripening';
      } else if (season === 'Fall') {
        initialStatus = 'Ready for Harvest';
      }
      
      await updateVineyard(targetId, {
        grape,
        density,
        status: initialStatus,
        ripeness: season === 'Summer' || season === 'Fall' ? 0.1 : 0,
        vineyardHealth: 0.8,
        vineAge: 0,
      });
    }
  });
}

// Callback handler for harvesting activities
async function handleHarvestingCallbacks(
  activity: Activity,
): Promise<void> {
  const targetId = activity.targetId;
  if (!targetId) return;
  
  setActivityCompletionCallback(activity.id, async () => {
    const vineyard = getGameState().vineyards.find(v => v.id === targetId);
    const { season } = getGameState();
    
    if (vineyard && vineyard.status.includes('Harvesting')) {
      // Assume fully harvested
      const newRemainingYield = 0;
      
      // Determine new status based on season
      const newStatus = (season !== 'Winter' && newRemainingYield > 0) 
        ? 'Ready for Harvest' 
        : 'Dormancy';
      
      await updateVineyard(targetId, {
        remainingYield: newRemainingYield,
        status: newStatus,
        ...(newRemainingYield <= 0 || season === 'Winter' ? { ripeness: 0 } : {})
      });
    }
  });
}

// Callback handler for staff search activities
async function handleStaffSearchCallbacks(
  activity: Activity,
): Promise<void> {
  displayManager.updateDisplayState('staffSearchActivity', { activityId: activity.id });
  
  setActivityCompletionCallback(activity.id, async () => {
    const { updatePlayerMoney } = await import('../../gameState');
    
    // Get search parameters
    const options = {
      numberOfCandidates: activity.params?.numberOfCandidates || 5,
      skillLevel: activity.params?.skillLevel || 0.3,
      specializations: activity.params?.specializations || []
    };
    
    // Deduct search cost
    const cost = activity.params?.searchCost || 0;
    if (cost > 0) {
      updatePlayerMoney(-cost);
    }
    
    // Generate candidates
    const candidates = generateStaffCandidates(options);
    
    // Update UI
    displayManager.updateDisplayState('staffSearchActivity', {
      results: candidates,
      activityId: null
    });
    
    toast({
      title: "Search Complete",
      description: `Found ${candidates.length} potential candidates.`
    });
  });
}

// Callback handler for administration activities
async function handleAdministrationCallbacks(
  activity: Activity,
): Promise<void> {
  // Check if this is a hiring activity
  if (activity.params?.hiringProcess === true || activity.params?.staffToHire) {
    displayManager.updateDisplayState('staffHiringActivity', { activityId: activity.id });
    
    setActivityCompletionCallback(activity.id, async () => {
      // Complete the hiring process
      completeHiringProcess(activity.id);
      
      // Update UI
      displayManager.updateDisplayState('staffHiringActivity', { activityId: null });
    });
  } else {
    setActivityCompletionCallback(activity.id, async () => {
      // Generic completion for other administration activities
    });
  }
}

export default { 
  initializeActivitySystem, 
  loadAllActivitiesFromDb, 
  saveActivityToDb, 
  updateActivityInDb, 
  removeActivityFromDb 
};