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
    return [];
  }
}

export async function initializeActivitySystem(): Promise<void> {
  try {
    const activities = await loadAllActivitiesFromDb();
    
    if (activities.length > 0) {
      const gameState = getGameState();
      
      // Try to import services dynamically to avoid circular dependencies
      let services: Record<string, any> = {};
      try {
        // Import vineyard service for handling vineyard-related activities
        const vineyardService = await import('../../services/vineyardService');
        services.vineyard = vineyardService;
        
        // Import staff service for handling staff-related activities
        const staffService = await import('../../services/staffService');
        services.staff = staffService;
        
        // Import displayManager for updating UI display states
        const displayManagerModule = await import('../game/displayManager');
        services.displayManager = displayManagerModule.default;
        
        // Add more service imports here as needed for other entity types
      } catch (error) {
        console.error('Error loading services:', error);
      }
      
      // Separate activities by type
      const vineyardActivities = activities.filter(a => 
        a.targetId && (
          a.category === WorkCategory.PLANTING ||
          a.category === WorkCategory.HARVESTING ||
          a.category === WorkCategory.CLEARING ||
          a.category === WorkCategory.UPROOTING
        )
      );
      
      const staffSearchActivities = activities.filter(a => 
        a.category === WorkCategory.STAFF_SEARCH
      );
      
      const staffHiringActivities = activities.filter(a => 
        a.category === WorkCategory.ADMINISTRATION && 
        a.params?.staffToHire !== undefined
      );
      
      // Process vineyard activities (maintain existing behavior)
      for (const activity of vineyardActivities) {
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
               
                // Update activity with the values from entity status (don't override totalWork if it's already set)
                activity.appliedWork = appliedWork;
                if (totalWork > 0 && activity.totalWork === 0) {
                  activity.totalWork = totalWork;
                }
             } else {
                // Fallback to percentage format
                const percentMatch = vineyard.status.match(percentRegex);
                if (percentMatch) {
                  const percent = parseInt(percentMatch[1]);
                  activity.appliedWork = Math.round(activity.totalWork * (percent / 100));
                }
              }
            }

            // Re-register the progress callback for activities
            activity.progressCallback = async (progress: number) => {
              // Calculate the new appliedWork value based on progress
              const newAppliedWork = Math.round(activity.totalWork * progress);
              activity.appliedWork = newAppliedWork;
              
              // Update target entity with raw work values
              await updateVineyard(activity.targetId, {
                status: `${activity.category}: ${activity.appliedWork}/${activity.totalWork}`,
              });
            };
          }
        }
      }
      
      // Process staff search activities
      for (const activity of staffSearchActivities) {
        if (services.staff && services.displayManager) {
          // Update display state with the activity ID
          services.displayManager.updateDisplayState('staffSearchActivity', {
            activityId: activity.id
          });
          
          // Register completion callback
          activity.completionCallback = async () => {
            const finalActivity = activity;
            const cost = finalActivity.params?.searchCost || 0;
            const searchOpts = finalActivity.params?.searchOptions;
            
            if (!searchOpts) return;
            
            // Deduct cost 
            const { updatePlayerMoney } = await import('../../gameState');
            updatePlayerMoney(-cost);
            
            // Generate candidates
            const candidates = services.staff.generateStaffCandidates(searchOpts);
            
            // Update display state with results and clear activity ID
            services.displayManager.updateDisplayState('staffSearchActivity', {
              results: candidates,
              activityId: null
            });
            
            // Show toast notification
            const { toast } = await import('../../lib/ui/toast');
            toast({ 
              title: "Search Complete", 
              description: `Found ${candidates.length} potential candidates.` 
            });
          };
        }
      }
      
      // Process staff hiring activities
      for (const activity of staffHiringActivities) {
        if (services.staff && services.displayManager && activity.params?.staffToHire) {
          // Update display state with the activity ID
          services.displayManager.updateDisplayState('staffHiringActivity', {
            activityId: activity.id
          });
          
          // Register completion callback
          activity.completionCallback = async () => {
            const staffToHire = activity.params?.staffToHire;
            
            if (!staffToHire) return;
            
            // Call the complete hiring process function
            const hiredStaff = await services.staff.completeHiringProcess(activity.id);
            
            // Clear activity ID in display state
            services.displayManager.updateDisplayState('staffHiringActivity', {
              activityId: null
            });
          };
        }
      }
      
      // Update game state with the restored activities
      updateGameState({
        ...gameState,
        activities: activities
      });
    } else {
      updateGameState({
        activities: []
      });
    }
  } catch (error) {
    console.error('Error initializing activity system:', error);
    updateGameState({
      activities: []
    });
  }
}

export async function saveActivityToDb(activity: Activity): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
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
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      return false;
    }

    // Verify the activity belongs to the current user
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activity.id);
    const activityDoc = await getDoc(activityRef);
    if (!activityDoc.exists() || activityDoc.data().userId !== player.id) {
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
    return false;
  }
}

export async function loadActivityFromDb(activityId: string): Promise<Activity | null> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      return null;
    }

    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    const activitySnapshot = await getDoc(activityRef);
    
    if (activitySnapshot.exists()) {
      const data = activitySnapshot.data();
      // Verify the activity belongs to the current user
      if (data.userId !== player.id) {
        return null;
      }
      return data as Activity;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function removeActivityFromDb(activityId: string): Promise<boolean> {
  try {
    const { player } = getGameState();
    if (!player?.id) {
      return false;
    }

    // Verify the activity belongs to the current user before deleting
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    const activityDoc = await getDoc(activityRef);
    if (!activityDoc.exists() || activityDoc.data().userId !== player.id) {
      return false;
    }

    await deleteDoc(activityRef);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete all activities from Firestore for all users
 * Admin function that bypasses user checks
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteAllActivitiesFromDb(): Promise<boolean> {
  try {
    const querySnapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    return false;
  }
}

export default { initializeActivitySystem, saveActivityToDb, updateActivityInDb, loadActivityFromDb, loadAllActivitiesFromDb, removeActivityFromDb, deleteAllActivitiesFromDb };