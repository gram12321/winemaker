import { doc, setDoc, collection, getDoc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getGameState, updateGameState } from '../../gameState';
import { WorkCategory } from '../game/workCalculator';

// Define Activity type inline since the model doesn't exist
export interface Activity {
  id: string;
  category: WorkCategory;
  totalWork: number;
  appliedWork: number;
  targetId?: string;
  params?: Record<string, any>;
}

// Define activities collection name
const ACTIVITIES_COLLECTION = 'activities';

export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const querySnapshot = await getDocs(activitiesRef);
    
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure category is properly typed as WorkCategory
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
  console.log('[ActivityDB] Initializing activity system');
  try {
    // Load all activities from the database
    const activities = await loadAllActivitiesFromDb();
    
    if (activities.length > 0) {
      console.log(`[ActivityDB] Loaded ${activities.length} activities from database`);
      
      // Get current game state
      const gameState = getGameState();
      
      // Update game state with loaded activities
      updateGameState({
        ...gameState,
        activities: activities
      });
      
      console.log('[ActivityDB] Activities restored to game state');
    } else {
      console.log('[ActivityDB] No persisted activities found');
      // Initialize with empty activities array if none found
      updateGameState({
        activities: []
      });
    }
    
    console.log('[ActivityDB] Activity system initialized successfully');
  } catch (error) {
    console.error('[ActivityDB] Error initializing activity system:', error);
    // Initialize with empty activities array on error
    updateGameState({
      activities: []
    });
  }
}

// Helper function to sanitize activity data for Firebase
function sanitizeActivityForDb(activity: Activity) {
  // Start with required fields
  const sanitized: any = {
    id: activity.id,
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

export async function saveActivityToDb(activity: Activity): Promise<boolean> {
  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activity.id);
    const sanitizedActivity = sanitizeActivityForDb(activity);
    await setDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error saving activity to database:', error);
    return false;
  }
}

export async function updateActivityInDb(activity: Activity): Promise<boolean> {
  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activity.id);
    const sanitizedActivity = sanitizeActivityForDb(activity);
    await updateDoc(activityRef, sanitizedActivity);
    return true;
  } catch (error) {
    console.error('Error updating activity in database:', error);
    return false;
  }
}

export async function loadActivityFromDb(activityId: string): Promise<Activity | null> {
  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    const activitySnapshot = await getDoc(activityRef);
    
    if (activitySnapshot.exists()) {
      return activitySnapshot.data() as Activity;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading activity from database:', error);
    return null;
  }
}

export async function removeActivityFromDb(activityId: string): Promise<boolean> {
  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION), activityId);
    await deleteDoc(activityRef);
    return true;
  } catch (error) {
    console.error('Error removing activity from database:', error);
    return false;
  }
}

export default {
  initializeActivitySystem,
  saveActivityToDb,
  updateActivityInDb,
  loadActivityFromDb,
  loadAllActivitiesFromDb,
  removeActivityFromDb
};