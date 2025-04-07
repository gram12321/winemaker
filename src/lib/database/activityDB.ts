import { doc, setDoc, collection, getDoc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getGameState, updateGameState } from '../../gameState';
import { WorkCategory } from '../game/workCalculator';

// Define Activity type
export interface Activity {
  id: string;
  userId: string;  // Add userId to tie activities to specific users
  category: WorkCategory;
  totalWork: number;
  appliedWork: number;
  targetId?: string;
  params?: Record<string, any>;
  completionCallback?: () => void;
  progressCallback?: (progress: number) => void;
}

const ACTIVITIES_COLLECTION = 'activities';

// Helper function to sanitize activity data for Firebase
function sanitizeActivityForDb(activity: Activity) {
  // Start with required fields
  const sanitized: any = {
    id: activity.id,
    userId: activity.userId,  // Include userId in sanitized data
    category: activity.category,
    totalWork: activity.totalWork,
    appliedWork: activity.appliedWork
  };

  // Add optional targetId if it exists
  if (activity.targetId) {
    sanitized.targetId = activity.targetId;
  }

  // Initialize params object only if we have data to put in it
  const params: Record<string, any> = {};
  
  // Only add title if it exists and is not undefined
  if (activity.params?.title) {
    params.title = activity.params.title;
  }
  
  // Always include these arrays, defaulting to empty if not present
  params.assignedStaffIds = activity.params?.assignedStaffIds || [];
  params.assignedToolIds = activity.params?.assignedToolIds || [];
  
  // Add any additional params that exist and are not undefined
  if (activity.params) {
    Object.entries(activity.params).forEach(([key, value]) => {
      if (value !== undefined && 
          key !== 'title' && 
          key !== 'assignedStaffIds' && 
          key !== 'assignedToolIds') {
        params[key] = value;
      }
    });
  }

  // Only add params to sanitized object if it's not empty
  if (Object.keys(params).length > 0) {
    sanitized.params = params;
  }

  return sanitized;
}

export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      console.error('[ActivityDB] No player ID found when loading activities');
      return [];
    }

    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const activitiesQuery = query(activitiesRef, where('userId', '==', player.id));
    const querySnapshot = await getDocs(activitiesQuery);
    
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        ...data,
        category: data.category as WorkCategory
      } as Activity);
    });
    
    return activities;
  } catch (error) {
    console.error('[ActivityDB] Error loading activities:', error);
    return [];
  }
}

export async function initializeActivitySystem(): Promise<void> {
  try {
    const activities = await loadAllActivitiesFromDb();
    console.log('[ActivityDB] Loaded activities:', activities);
    
    const plantingActivities = activities.filter(a => a.category === 'planting' && a.targetId);
    
    if (activities.length > 0) {
      const gameState = getGameState();
      
      // First, get all vineyards with planting status to sync progress values
      try {
        const { getVineyards, getVineyardById } = await import('../../services/vineyardService');
        const vineyards = getVineyards();
        
        // Update activity progress based on vineyard status
        for (const activity of plantingActivities) {
          if (activity.targetId) {
            const vineyard = getVineyardById(activity.targetId);
            if (vineyard && vineyard.status && vineyard.status.includes('Planting:')) {
              // Extract work values from status
              const workMatch = vineyard.status.match(/Planting: (\d+)\/(\d+)/);
              
              if (workMatch) {
                const appliedWork = parseInt(workMatch[1]);
                const totalWork = parseInt(workMatch[2]);
                
                console.log(`[ActivityDB] Found existing progress in vineyard ${activity.targetId}: ${appliedWork}/${totalWork}`);
                
                // Update activity with the values from vineyard status (don't override totalWork if it's already set)
                activity.appliedWork = appliedWork;
                if (totalWork > 0 && activity.totalWork === 0) {
                  activity.totalWork = totalWork;
                }
                
                console.log(`[ActivityDB] Updated activity ${activity.id} with progress: ${activity.appliedWork}/${activity.totalWork}`);
              } else {
                // Fallback to old percentage format
                const percentMatch = vineyard.status.match(/Planting: (\d+)%/);
                if (percentMatch) {
                  const percent = parseInt(percentMatch[1]);
                  activity.appliedWork = Math.round(activity.totalWork * (percent / 100));
                  console.log(`[ActivityDB] Converted percentage (${percent}%) to work values: ${activity.appliedWork}/${activity.totalWork}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[ActivityDB] Error synchronizing activity progress with vineyard status:', error);
      }
      
      // Now set up callbacks for activities
      for (const activity of activities) {
        if (activity.category === 'planting' && activity.targetId) {
          console.log(`[ActivityDB] Restoring planting activity: ${activity.id} for target ${activity.targetId}, progress: ${activity.appliedWork}/${activity.totalWork}`);
          
          // Import vineyardService dynamically to avoid circular dependencies
          const { updateVineyard, getVineyardById } = await import('../../services/vineyardService');
          
          // Re-register the progress callback for planting activities
          activity.progressCallback = async (progress: number) => {
            if (activity.targetId) {
              // Calculate the new appliedWork value based on progress
              const newAppliedWork = Math.round(activity.totalWork * progress);
              activity.appliedWork = newAppliedWork;
              
              // Update vineyard with raw work values
              console.log(`[ActivityDB] Updating vineyard ${activity.targetId} with progress: ${activity.appliedWork}/${activity.totalWork}`);
              await updateVineyard(activity.targetId, {
                status: `Planting: ${activity.appliedWork}/${activity.totalWork}`,
              });
            }
          };
          
          // Don't call the progress callback immediately to avoid overwriting 
          // the vineyard status that might have a different progress value
        }
      }
      
      // Update game state with the fixed activities
      updateGameState({
        ...gameState,
        activities: activities
      });
      
      // Final update for vineyard status if needed - but don't overwrite existing progress
      if (plantingActivities.length > 0) {
        try {
          console.log(`[ActivityDB] Found ${plantingActivities.length} planting activities to restore vineyard status`);
          
          // Don't update vineyard status here, as we've already extracted the correct values
          // from the vineyards and updated the activities instead
        } catch (error) {
          console.error('[ActivityDB] Error updating vineyard status after loading activities:', error);
        }
      }
      
      console.log(`[ActivityDB] Restored ${activities.length} activities with callbacks`);
    } else {
      updateGameState({
        activities: []
      });
    }
  } catch (error) {
    console.error('[ActivityDB] Error initializing activity system:', error);
    updateGameState({
      activities: []
    });
  }
}

export async function saveActivityToDb(activity: Activity): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      console.error('[ActivityDB] No player ID found when saving activity');
      return false;
    }

    const activityWithUser = {
      ...activity,
      userId: player.id
    };

    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activity.id);
    const sanitizedActivity = sanitizeActivityForDb(activityWithUser);
    await setDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error saving activity to database:', error);
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      console.error('[ActivityDB] No player ID found when updating activity');
      return false;
    }

    // Verify the activity belongs to the current user
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activity.id);
    const activityDoc = await getDoc(activityRef);
    if (!activityDoc.exists() || activityDoc.data().userId !== player.id) {
      console.error('[ActivityDB] Activity does not belong to current user');
      return false;
    }

    const activityWithUser = {
      ...activity,
      userId: player.id
    };

    const sanitizedActivity = sanitizeActivityForDb(activityWithUser);
    await updateDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error updating activity in database:', error);
    return false;
  }
}

export async function loadActivityFromDb(activityId: string): Promise<Activity | null> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      console.error('[ActivityDB] No player ID found when loading activity');
      return null;
    }

    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    const activitySnapshot = await getDoc(activityRef);
    
    if (activitySnapshot.exists()) {
      const data = activitySnapshot.data();
      // Verify the activity belongs to the current user
      if (data.userId !== player.id) {
        console.error('[ActivityDB] Activity does not belong to current user');
        return null;
      }
      return data as Activity;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading activity from database:', error);
    return null;
  }
}

export async function removeActivityFromDb(activityId: string): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      console.error('[ActivityDB] No player ID found when removing activity');
      return false;
    }

    // Verify the activity belongs to the current user before deleting
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    const activityDoc = await getDoc(activityRef);
    if (!activityDoc.exists() || activityDoc.data().userId !== player.id) {
      console.error('[ActivityDB] Activity does not belong to current user');
      return false;
    }

    await deleteDoc(activityRef);
    return true;
  } catch (error) {
    console.error('Error removing activity from database:', error);
    return false;
  }
}

export default { initializeActivitySystem, saveActivityToDb, updateActivityInDb, loadActivityFromDb, loadAllActivitiesFromDb, removeActivityFromDb };