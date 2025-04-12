import { doc, setDoc, collection, getDoc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getGameState, updateGameState } from '../../gameState';
import { WorkCategory, ActivityProgress } from '../game/workCalculator'; // Import ActivityProgress from workCalculator

// Define Activity type for runtime (aligns with ActivityProgress)
export interface Activity extends ActivityProgress {
  userId?: string; // Add userId as optional for runtime flexibility if needed
}

// Define a type for Firestore storage, excluding callbacks
// Include userId here as it seems to be stored/expected within the company doc array
type ActivityForDb = Omit<Activity, 'completionCallback' | 'progressCallback'> & {
  userId: string; // Make userId required for storage consistency
};

// Helper function to sanitize activity data for Firebase
function sanitizeActivityForDb(activity: Activity): ActivityForDb {
  const sanitized: Partial<Activity> = { ...activity }; 

  delete sanitized.completionCallback;
  delete sanitized.progressCallback;

  // Ensure essential fields exist and have defaults for DB storage
  const dbActivity: ActivityForDb = {
    id: sanitized.id!, 
    userId: activity.userId || getGameState().player?.id || 'unknown', // Ensure userId exists for DB
    category: sanitized.category!, 
    totalWork: sanitized.totalWork || 0,
    appliedWork: sanitized.appliedWork || 0,
    targetId: sanitized.targetId, // Stored as is, can be undefined
    params: sanitized.params || {}, // Default to empty object if undefined
  };

  // Ensure params sub-arrays exist IF params itself exists
  if (dbActivity.params) { // Check if params exists before accessing sub-properties
      dbActivity.params.assignedStaffIds = dbActivity.params.assignedStaffIds || [];
      dbActivity.params.assignedToolIds = dbActivity.params.assignedToolIds || [];

      // Remove undefined values from params
      Object.keys(dbActivity.params).forEach(key => {
          if (dbActivity.params![key] === undefined) { 
              delete dbActivity.params![key];
          }
      });
  } else {
      // If params was initially null/undefined, ensure it's an empty object
      dbActivity.params = {}; 
  }

  console.log(`Sanitized activity for DB save/update: ${dbActivity.id}, appliedWork: ${dbActivity.appliedWork}`);
  // The returned object now matches ActivityForDb type
  return dbActivity;
}

// --- Load function --- 
export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;

    if (!companyName) {
      console.warn('No company name found when loading activities');
      return [];
    }

    const companyRef = doc(db, 'companies', companyName);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      console.warn('Company document not found when loading activities');
      return [];
    }

    const data = companyDoc.data();
    const activitiesFromDb: ActivityForDb[] = data.activities || [];

    // Map to Activity[] for runtime use
    const mappedActivities: Activity[] = activitiesFromDb.map((activityData) => {
      // The loaded data now matches ActivityForDb, which is compatible with Activity 
      // (minus callbacks, which are runtime only)
      return {
        ...activityData,
        // userId is already part of activityData
      } as Activity; 
    });

    console.log(`Loaded ${mappedActivities.length} activities from company document ${companyName}`);
    return mappedActivities;
  } catch (error) {
    console.error('Error loading activities from company doc:', error);
    return [];
  }
}

// --- Initialization --- 
export async function initializeActivitySystem(): Promise<void> {
  try {
    const loadedActivities = await loadAllActivitiesFromDb();
    const gameState = getGameState();

    const currentActivityIds = new Set((gameState.activities || []).map(a => a.id));
    const loadedActivityIds = new Set(loadedActivities.map(a => a.id));

    let needsUpdate = loadedActivities.length !== currentActivityIds.size || 
                      ![...loadedActivityIds].every(id => currentActivityIds.has(id));

    if (needsUpdate) {
       console.log(`Initializing/Updating gameState activities from DB: ${loadedActivities.length} activities loaded.`);
       // loadedActivities is Activity[], which extends ActivityProgress
       updateGameState({ activities: loadedActivities }); 
    } else {
       console.log(`Activity system already initialized or in sync with DB.`);
    }

    // Re-attach runtime callbacks for ongoing activities
    const activitiesInState = getGameState().activities || [];
    
    if (activitiesInState.length > 0) {
      console.log(`Re-attaching callbacks for ${activitiesInState.length} activities`);
      
      // Import necessary modules for callback reattachment
      const { setActivityCompletionCallback, getActivityById } = await import('../game/activityManager');
      const { 
        clearVineyard, 
        plantVineyard, 
        uprootVineyard,
        harvestVineyard
      } = await import('../../services/vineyardService');
      
      // Handle each activity based on its category
      for (const activity of activitiesInState) {
        if (!activity.id) continue;
        
        try {
          // Re-attach completion callbacks based on activity category
          switch (activity.category) {
            case 'clearing': {
              // For clearing tasks, we need to check which clearing task it is
              // and potentially reconstruct the completion logic
              const targetId = activity.targetId;
              if (!targetId) continue;
              
              // Get all clearing activities for the same target (vineyard)
              const relatedActivities = activitiesInState.filter(a => 
                a.category === 'clearing' && a.targetId === targetId);
              
              // Only run this for the first activity of each vineyard to avoid duplication
              if (relatedActivities[0]?.id === activity.id) {
                console.log(`Re-attaching clearing callbacks for vineyard ${targetId}`);
                
                // For each related activity, reattach the callback logic
                relatedActivities.forEach(clearingActivity => {
                  const taskId = clearingActivity.params?.taskId;
                  if (!taskId) return;
                  
                  // Re-attach the callback
                  setActivityCompletionCallback(clearingActivity.id, async () => {
                    console.log(`Clearing task ${taskId} completed for vineyard ${targetId}`);
                    
                    // Check if this was the last task
                    const remainingActivities = getGameState().activities
                      .filter(a => a.category === 'clearing' && a.targetId === targetId);
                    
                    // If this is the last activity or all have almost completed (applied work > 95% of total)
                    const allNearlyComplete = remainingActivities.every(a => 
                      a.appliedWork >= a.totalWork * 0.95);
                    
                    if (remainingActivities.length <= 1 || allNearlyComplete) {
                      console.log(`All clearing tasks complete for vineyard ${targetId}, updating status`);
                      
                      // Manually trigger a simulated completion by using specific behavior
                      // Get vineyard and check its status
                      const vineyard = getGameState().vineyards.find(v => v.id === targetId);
                      if (vineyard && vineyard.status === 'Clearing in Progress') {
                        // If the vineyard is still in clearing status, update its status to cleared
                        const { updateVineyard } = await import('../../services/vineyardService');
                        
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
                          // Default to 100% replanting intensity if not specified
                          const replantingIntensity = 100;
                          healthImprovement += (replantingIntensity / 100) * 0.20;
                        }
                        
                        // Calculate new health based on original health + improvements
                        const newHealth = Math.min(1.0, originalHealth + healthImprovement);
                        
                        console.log(`Applying health change from ${originalHealth} to ${newHealth} for vineyard ${targetId}`);
                        
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
              break;
            }
            
            case 'uprooting': {
              // Similar logic for uprooting activities
              const targetId = activity.targetId;
              if (!targetId) continue;
              
              console.log(`Re-attaching uprooting callback for vineyard ${targetId}`);
              setActivityCompletionCallback(activity.id, async () => {
                // Get vineyard - don't check status until we update it
                const vineyard = getGameState().vineyards.find(v => v.id === targetId);
                if (vineyard) {
                  // Log the current status
                  console.log(`Executing uprooting callback for vineyard ${targetId} with status: ${vineyard.status}`);
                  
                  // If the vineyard is still in uprooting status, update its status
                  const { updateVineyard } = await import('../../services/vineyardService');
                  const { DEFAULT_VINEYARD_HEALTH } = await import('../../lib/core/constants/gameConstants');
                  
                  await updateVineyard(targetId, {
                    grape: null,                // Remove grape
                    vineAge: 0,                 // Reset vine age
                    density: 0,                 // Reset density
                    vineyardHealth: DEFAULT_VINEYARD_HEALTH, // Reset health to default
                    status: 'Ready to be planted', // Set status
                    ripeness: 0,                // Reset ripeness
                    organicYears: 0,            // Reset organic years
                    remainingYield: null,       // Clear remaining yield
                    completedClearingTasks: [], // Reset completed clearing tasks as well
                    farmingMethod: 'Conventional' // Reset to conventional farming
                  });
                  
                  // Update display state
                  const displayManager = (await import('@/lib/game/displayManager')).default;
                  displayManager.updateDisplayState('vineyardView', {
                    currentActivityId: null,
                  });
                  
                  // Show notification
                  const { toast } = await import('@/lib/ui/toast');
                  toast({
                    title: "Uprooting Complete",
                    description: `The vineyard is now ready for planting with new grape varieties.`
                  });
                  
                  const { consoleService } = await import('@/components/layout/Console');
                  consoleService.success(`Uprooting of vineyard complete! The vineyard is now ready for planting.`);
                }
              });
              break;
            }
            
            case 'planting': {
              const targetId = activity.targetId;
              if (!targetId) continue;
              
              console.log(`Re-attaching planting callback for vineyard ${targetId}`);
              setActivityCompletionCallback(activity.id, async () => {
                // Get vineyard and check its status
                const vineyard = getGameState().vineyards.find(v => v.id === targetId);
                
                if (vineyard && vineyard.status.includes('Planting')) {
                  // If vineyard is still in planting status, finalize planting
                  const { updateVineyard } = await import('../../services/vineyardService');
                  const { season } = getGameState();
                  
                  // Get grape and density from activity parameters
                  const grape = activity.params?.grape || activity.params?.additionalParams?.grape;
                  const density = activity.params?.density || activity.params?.additionalParams?.density || 5000; // Default to 5000 if not specified
                  
                  // Determine initial status based on season
                  let initialStatus = 'Growing';
                  if (season === 'Winter') {
                    initialStatus = 'No yield in first season';
                  } else if (season === 'Summer') {
                    initialStatus = 'Ripening';
                  } else if (season === 'Fall') {
                    initialStatus = 'Ready for Harvest';
                  }
                  
                  // Update vineyard with new grape and density
                  await updateVineyard(targetId, {
                    grape,
                    density,
                    status: initialStatus,
                    ripeness: season === 'Summer' || season === 'Fall' ? 0.1 : 0, // Start with some ripeness if in growing season
                    vineyardHealth: 0.8, // Start with 80% health
                    vineAge: 0,
                  });
                }
              });
              break;
            }
            
            case 'harvesting': {
              const targetId = activity.targetId;
              if (!targetId) continue;
              
              console.log(`Re-attaching harvesting callback for vineyard ${targetId}`);
              setActivityCompletionCallback(activity.id, async () => {
                // Get vineyard and check its status
                const vineyard = getGameState().vineyards.find(v => v.id === targetId);
                const { season } = getGameState();
                
                if (vineyard && vineyard.status.includes('Harvesting')) {
                  // If vineyard is still in harvesting status, finalize harvesting
                  const { updateVineyard } = await import('../../services/vineyardService');
                  
                  // Calculate new remaining yield after harvest
                  const newRemainingYield = 0; // Assume fully harvested
                  
                  // Determine the new status based on season and remaining yield
                  let newStatus = 'Dormancy';
                  
                  if (season !== 'Winter' && newRemainingYield > 0) {
                    // If it's not winter and there's still yield, keep it ready for harvest
                    newStatus = 'Ready for Harvest';
                  } else if (season === 'Winter' || newRemainingYield <= 0) {
                    // If it's winter or no yield remains, go to dormancy
                    newStatus = 'Dormancy';
                  }
                  
                  // Update the vineyard with new status and remaining yield
                  await updateVineyard(targetId, {
                    remainingYield: newRemainingYield,
                    status: newStatus,
                    // Only reset ripeness if fully harvested or it's winter
                    ...(newRemainingYield <= 0 || season === 'Winter' ? { ripeness: 0 } : {})
                  });
                }
              });
              break;
            }
            
            case 'crushing':
            case 'fermentation': {
              // Handle winery-related activities
              console.log(`Re-attaching ${activity.category} callback`);
              setActivityCompletionCallback(activity.id, async () => {
                // Wine production callbacks would go here
                // In a more complete implementation, you'd call the appropriate completion methods
                // from wineProductionService or similar
              });
              break;
            }
            
            case 'staffSearch': {
              console.log(`Re-attaching staff search callback`);
              setActivityCompletionCallback(activity.id, async () => {
                // Import required staff service functions
                const { generateStaffCandidates } = await import('../../services/staffService');
                const { updatePlayerMoney } = await import('../../gameState');
                
                // Get the parameters needed to generate candidates
                const options = {
                  numberOfCandidates: activity.params?.numberOfCandidates || 5,
                  skillLevel: activity.params?.skillLevel || 0.3,
                  specializations: activity.params?.specializations || []
                };
                
                // Deduct the cost
                const cost = activity.params?.searchCost || 0;
                if (cost > 0) {
                  updatePlayerMoney(-cost);
                }
                
                // Generate candidates based on the options
                const candidates = generateStaffCandidates(options);
                
                // Update the display state
                const { default: displayManager } = await import('@/lib/game/displayManager');
                displayManager.updateDisplayState('staffSearchActivity', {
                  results: candidates,
                  activityId: null // Clear the activity ID when complete
                });
                
                // Show notification
                const { toast } = await import('@/lib/ui/toast');
                toast({ 
                  title: "Search Complete", 
                  description: `Found ${candidates.length} potential candidates.` 
                });
              });
              break;
            }
            
            case 'administration': {
              // Check if this is a hiring activity
              if (activity.params?.hiringProcess === true || activity.params?.staffToHire) {
                console.log(`Re-attaching staff hiring callback`);
                setActivityCompletionCallback(activity.id, async () => {
                  // Import required staff service functions
                  const { completeHiringProcess } = await import('../../services/staffService');
                  
                  // Complete the hiring process for this candidate
                  completeHiringProcess(activity.id);
                });
              } else {
                console.log(`Re-attaching generic administration callback`);
                setActivityCompletionCallback(activity.id, async () => {
                  // Generic completion for other administration activities
                });
              }
              break;
            }
            
            case 'building':
            case 'upgrading':
            case 'maintenance': {
              // Handle building-related activities
              console.log(`Re-attaching ${activity.category} callback`);
              setActivityCompletionCallback(activity.id, async () => {
                // Building callbacks would go here
                // In a more complete implementation, you'd call the appropriate building 
                // completion methods
              });
              break;
            }
            
            default:
              // Log unhandled activity type
              console.log(`No specific callback re-attached for activity type: ${activity.category}`);
          }
        } catch (error) {
          console.error(`Error re-attaching callbacks for activity ${activity.id}:`, error);
        }
      }
    }

  } catch (error) {
    console.error('Error initializing activity system:', error);
    if (!getGameState().activities) {
       updateGameState({ activities: [] });
    }
  }
}

// --- Refactored DB modification functions --- 

export async function saveActivityToDb(activity: Activity): Promise<boolean> {
  const gameState = getGameState();
  const companyName = gameState.player?.companyName;
  if (!companyName) {
    console.error('Cannot save activity: Company name not found.');
    return false;
  }
  const companyRef = doc(db, 'companies', companyName);

  try {
    const companyDoc = await getDoc(companyRef);
    if (!companyDoc.exists()) {
      console.error(`Cannot save activity: Company document '${companyName}' not found.`);
      return false;
    }

    const companyData = companyDoc.data();
    const currentActivitiesFromDb: ActivityForDb[] = companyData.activities || [];
    // Sanitize the runtime Activity to the DB format
    const sanitizedActivity = sanitizeActivityForDb(activity);

    const activityIndex = currentActivitiesFromDb.findIndex(a => a.id === sanitizedActivity.id);
    let updatedActivitiesForDb: ActivityForDb[];

    if (activityIndex > -1) {
      updatedActivitiesForDb = [...currentActivitiesFromDb];
      updatedActivitiesForDb[activityIndex] = sanitizedActivity;
      console.log(`Updating activity ${sanitizedActivity.id} in company doc ${companyName}`);
    } else {
      updatedActivitiesForDb = [...currentActivitiesFromDb, sanitizedActivity];
       console.log(`Adding new activity ${sanitizedActivity.id} to company doc ${companyName}`);
    }

    await updateDoc(companyRef, { activities: updatedActivitiesForDb });

    // Update local gameState using the original runtime activity object (with callbacks)
    const currentLocalActivities = gameState.activities || [];
    const localIndex = currentLocalActivities.findIndex(a => a.id === activity.id);
    let updatedLocalActivities;
    if (localIndex > -1) {
        updatedLocalActivities = [...currentLocalActivities];
        updatedLocalActivities[localIndex] = activity; 
    } else {
        updatedLocalActivities = [...currentLocalActivities, activity];
    }
    // gameState.activities is ActivityProgress[], and Activity extends ActivityProgress
    updateGameState({ activities: updatedLocalActivities }); 

    return true;
  } catch (error) {
    console.error(`Error saving activity ${activity.id} to company doc ${companyName}:`, error);
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  console.log(`Calling updateActivityInDb for ${activity.id} - redirecting to saveActivityToDb`);
  return saveActivityToDb(activity);
}

export async function removeActivityFromDb(activityId: string): Promise<boolean> {
  const gameState = getGameState();
  const companyName = gameState.player?.companyName;
  if (!companyName) {
    console.error('Cannot remove activity: Company name not found.');
    return false;
  }
  const companyRef = doc(db, 'companies', companyName);

  try {
    const companyDoc = await getDoc(companyRef);
    if (!companyDoc.exists()) {
      console.error(`Cannot remove activity: Company document '${companyName}' not found.`);
      return false;
    }

    const companyData = companyDoc.data();
    const currentActivitiesFromDb: ActivityForDb[] = companyData.activities || [];

    const updatedActivitiesForDb = currentActivitiesFromDb.filter(a => a.id !== activityId);

    if (updatedActivitiesForDb.length === currentActivitiesFromDb.length) {
      console.warn(`Activity ${activityId} not found in company doc ${companyName} for removal.`);
      const currentLocalActivities = gameState.activities || [];
      const updatedLocalActivities = currentLocalActivities.filter(a => a.id !== activityId);
      if (updatedLocalActivities.length !== currentLocalActivities.length) {
          // Update local state only if it was different
          updateGameState({ activities: updatedLocalActivities }); 
      }
      return false; 
    }

     console.log(`Removing activity ${activityId} from company doc ${companyName}`);
    await updateDoc(companyRef, { activities: updatedActivitiesForDb });

    // Update local gameState
    const updatedLocalActivities = (gameState.activities || []).filter(a => a.id !== activityId);
    updateGameState({ activities: updatedLocalActivities }); 

    return true;
  } catch (error) {
    console.error(`Error removing activity ${activityId} from company doc ${companyName}:`, error);
    return false;
  }
}

// --- Deprecated functions comment remains the same --- 

export default { initializeActivitySystem, saveActivityToDb, updateActivityInDb, loadAllActivitiesFromDb, removeActivityFromDb };