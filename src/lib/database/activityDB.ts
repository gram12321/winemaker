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
    appliedWork: activity.appliedWork  // Explicitly include appliedWork
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

  console.log(`Sanitized activity for DB: ${activity.id}, appliedWork: ${activity.appliedWork} -> ${sanitized.appliedWork}`);
  return sanitized;
}

export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;
    
    if (!companyName) {
      console.warn('No company name found when loading activities');
      return [];
    }

    // Get the company document
    const companyRef = doc(db, 'companies', companyName);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      console.warn('Company document not found when loading activities');
      return [];
    }

    const data = companyDoc.data();
    const activities = data.activities || [];
    
    // Map the activities to the correct type
    const mappedActivities: Activity[] = activities.map((activity: any) => {
      console.log('Loading activity from company document:', activity.id, 'with appliedWork:', activity.appliedWork);
      return {
        id: activity.id,
        userId: activity.userId || gameState.player?.id || 'unknown',
        category: activity.category as WorkCategory,
        totalWork: activity.totalWork || 0,
        appliedWork: activity.appliedWork || 0,
        targetId: activity.targetId || null,
        params: activity.params || {}
      } as Activity;
    });
    
    console.log(`Loaded ${mappedActivities.length} activities from company document`);
    return mappedActivities;
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
}

export async function initializeActivitySystem(): Promise<void> {
  try {
    // First load activities from collection
    const activitiesFromCollection = await loadAllActivitiesFromDb();
    
    // Then get activities from game state - these are loaded from the company document
    const gameState = getGameState();
    const activitiesFromGameState = gameState.activities || [];
    
    console.log(`Activity initialization: ${activitiesFromCollection.length} activities from collection, ${activitiesFromGameState.length} activities from gameState`);
    
    // Merge activities, prioritizing those from collection but including those only in gameState
    const combinedActivities: Activity[] = [...activitiesFromCollection];
    
    // Add activities from gameState that aren't in collection
    const collectionIds = new Set(activitiesFromCollection.map(a => a.id));
    activitiesFromGameState.forEach(a => {
      if (!collectionIds.has(a.id)) {
        console.log(`Adding activity from gameState that's not in collection: ${a.id}, appliedWork: ${a.appliedWork}`);
        
        // Create activity with all required fields
        const activity: Activity = {
          id: a.id,
          userId: gameState.player?.id || 'unknown',
          category: a.category,
          totalWork: a.totalWork || 0,
          appliedWork: a.appliedWork || 0,
          targetId: a.targetId,
          params: a.params
        };
        
        combinedActivities.push(activity);
      }
    });
    
    if (combinedActivities.length > 0) {
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
      } catch (error) {
        console.error('Error loading services:', error);
      }
      
      // Separate activities by type
      const vineyardActivities = combinedActivities.filter(a => 
        a.targetId && (
          a.category === WorkCategory.PLANTING ||
          a.category === WorkCategory.HARVESTING ||
          a.category === WorkCategory.CLEARING ||
          a.category === WorkCategory.UPROOTING
        )
      );
      
      const staffSearchActivities = combinedActivities.filter(a => 
        a.category === WorkCategory.STAFF_SEARCH
      );
      
      const staffHiringActivities = combinedActivities.filter(a => 
        a.category === WorkCategory.ADMINISTRATION && 
        a.params?.staffToHire !== undefined
      );
      
      console.log(`Processing activities: ${vineyardActivities.length} vineyard, ${staffSearchActivities.length} staff search, ${staffHiringActivities.length} staff hiring`);
      
      // Process vineyard activities (maintain existing behavior)
      for (const activity of vineyardActivities) {
        if (activity.targetId && services.vineyard) { 
          const { updateVineyard, getVineyardById } = services.vineyard;
          const vineyard = getVineyardById(activity.targetId);
          
          if (vineyard) {
            console.log(`Processing vineyard activity ${activity.id}, applied work: ${activity.appliedWork}`);
            
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
                console.log(`Updated vineyard activity from status: ${activity.appliedWork}/${activity.totalWork}`);
              } else {
                // Fallback to percentage format
                const percentMatch = vineyard.status.match(percentRegex);
                if (percentMatch) {
                  const percent = parseInt(percentMatch[1]);
                  activity.appliedWork = Math.round(activity.totalWork * (percent / 100));
                  console.log(`Updated vineyard activity from percent: ${activity.appliedWork}/${activity.totalWork} (${percent}%)`);
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
          console.log(`Processing staff search activity ${activity.id}, applied work: ${activity.appliedWork}/${activity.totalWork}`);
          
          // Update display state with the activity ID
          services.displayManager.updateDisplayState('staffSearchActivity', {
            activityId: activity.id
          });
          
          // Register completion callback
          activity.completionCallback = async () => {
            const finalActivity = activity;
            const cost = finalActivity.params?.searchCost || 0;
            const searchOpts = finalActivity.params?.searchOptions;
            
            console.log(`Staff search completion callback for ${activity.id} with options:`, searchOpts);
            
            if (!searchOpts) {
              console.warn(`No search options found for activity ${activity.id}`);
              return;
            }
            
            // Deduct cost 
            const { updatePlayerMoney } = await import('../../gameState');
            updatePlayerMoney(-cost);
            
            // Generate candidates
            const candidates = services.staff.generateStaffCandidates(searchOpts);
            console.log(`Generated ${candidates.length} candidates for search`);
            
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
            
            // Save any changes to activity
            await saveActivityToDb(finalActivity);
          };
        }
      }
      
      // Process staff hiring activities
      for (const activity of staffHiringActivities) {
        if (services.staff && services.displayManager && activity.params?.staffToHire) {
          console.log(`Processing staff hiring activity ${activity.id}, applied work: ${activity.appliedWork}/${activity.totalWork}`);
          
          // Update display state with the activity ID
          services.displayManager.updateDisplayState('staffHiringActivity', {
            activityId: activity.id
          });
          
          // Register completion callback
          activity.completionCallback = async () => {
            const staffToHire = activity.params?.staffToHire;
            
            if (!staffToHire) {
              console.warn(`No staff to hire found for activity ${activity.id}`);
              return;
            }
            
            console.log(`Staff hiring completion callback for ${activity.id}, hiring:`, staffToHire.name);
            
            // Call the complete hiring process function
            const hiredStaff = await services.staff.completeHiringProcess(activity.id);
            
            // Clear activity ID in display state
            services.displayManager.updateDisplayState('staffHiringActivity', {
              activityId: null
            });
            
            // Save any changes to activity
            await saveActivityToDb(activity);
          };
        }
      }
      
      // Update game state with the restored activities
      updateGameState({
        ...gameState,
        activities: combinedActivities
      });

      console.log(`Activity system initialized with ${combinedActivities.length} activities`);
    } else {
      updateGameState({
        activities: []
      });
      console.log('No activities to initialize');
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
    console.log(`Saving activity to DB: ${activity.id}, appliedWork: ${activity.appliedWork}`);
    const activityRef = doc(db, ACTIVITIES_COLLECTION, activity.id);
    const sanitizedActivity = sanitizeActivityForDb(activity);
    await setDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error saving activity to DB:', error);
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  try {
    console.log(`Updating activity in DB: ${activity.id}, appliedWork: ${activity.appliedWork}`);
    const activityRef = doc(db, ACTIVITIES_COLLECTION, activity.id);
    const sanitizedActivity = sanitizeActivityForDb(activity);
    await updateDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error updating activity in DB:', error);
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