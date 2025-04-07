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
    
    // Filter activities with targetId for entity-bound activities
    const targetedActivities = activities.filter(a => a.targetId);
    
    if (activities.length > 0) {
      const gameState = getGameState();
      
      // Try to import services dynamically to avoid circular dependencies
      let services: Record<string, any> = {};
      try {
        // Import vineyard service for handling vineyard-related activities
        const vineyardService = await import('../../services/vineyardService');
        services.vineyard = vineyardService;
        
        // Add more service imports here as needed for other entity types
        // Example: const buildingService = await import('../../services/buildingService');
        //          services.building = buildingService;
      } catch (error) {
        console.error('[ActivityDB] Error importing services:', error);
      }
      
      // Set up callbacks for activities with targets
      for (const activity of targetedActivities) {
        console.log(`[ActivityDB] Restoring activity: ${activity.id} of type ${activity.category} for target ${activity.targetId}`);
        
        // Register appropriate callback based on activity category and target type
        if (activity.targetId && services.vineyard) {
          const { updateVineyard, getVineyardById } = services.vineyard;
          const vineyard = getVineyardById(activity.targetId);
          
          if (vineyard) {
            // Restore existing work values if they exist in the target entity's status
            const statusRegex = new RegExp(`${activity.category}: (\\d+)\\/(\\d+)`);
            const percentRegex = new RegExp(`${activity.category}: (\\d+)%`);
            
            if (vineyard.status) {
              // Extract work values from status
              const workMatch = vineyard.status.match(statusRegex);
              
              if (workMatch) {
                const appliedWork = parseInt(workMatch[1]);
                const totalWork = parseInt(workMatch[2]);
                
                console.log(`[ActivityDB] Found existing progress in entity ${activity.targetId}: ${appliedWork}/${totalWork}`);
                
                // Update activity with the values from entity status (don't override totalWork if it's already set)
                activity.appliedWork = appliedWork;
                if (totalWork > 0 && activity.totalWork === 0) {
                  activity.totalWork = totalWork;
                }
                
                console.log(`[ActivityDB] Updated activity ${activity.id} with progress: ${activity.appliedWork}/${activity.totalWork}`);
              } else {
                // Fallback to percentage format
                const percentMatch = vineyard.status.match(percentRegex);
                if (percentMatch) {
                  const percent = parseInt(percentMatch[1]);
                  activity.appliedWork = Math.round(activity.totalWork * (percent / 100));
                  console.log(`[ActivityDB] Converted percentage (${percent}%) to work values: ${activity.appliedWork}/${activity.totalWork}`);
                }
              }
            }

            // Re-register the progress callback for activities
            activity.progressCallback = async (progress: number) => {
              // Calculate the new appliedWork value based on progress
              const newAppliedWork = Math.round(activity.totalWork * progress);
              activity.appliedWork = newAppliedWork;
              
              // Update target entity with raw work values
              console.log(`[ActivityDB] Updating target ${activity.targetId} with progress for ${activity.category}: ${activity.appliedWork}/${activity.totalWork}`);
              await updateVineyard(activity.targetId, {
                status: `${activity.category}: ${activity.appliedWork}/${activity.totalWork}`,
              });
            };
          }
          
          // Add handlers for other entity types here
          // else if (activity.targetId && services.building) { ... }
        }
      }
      
      // Update game state with the restored activities
      updateGameState({
        ...gameState,
        activities: activities
      });
      
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