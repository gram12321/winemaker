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

    // TODO: Re-attach runtime callbacks here if necessary
    const activitiesInState = getGameState().activities || [];
    activitiesInState.forEach(activity => {
        // Logic to re-attach callbacks based on activity.category/params
    });

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