import { doc, setDoc, collection, getDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getGameState, updateGameState } from '../../gameState';
import { WorkCategory } from '../game/workCalculator';

// Define Activity type
export interface Activity {
  id: string;
  category: WorkCategory;
  totalWork: number;
  appliedWork: number;
  targetId?: string;
  params?: Record<string, any>;
}

const ACTIVITIES_COLLECTION = 'activities';

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

export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const querySnapshot = await getDocs(activitiesRef);
    
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
    
    if (activities.length > 0) {
      const gameState = getGameState();
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
    console.error('[ActivityDB] Error initializing activity system:', error);
    updateGameState({
      activities: []
    });
  }
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

export default { initializeActivitySystem, saveActivityToDb, updateActivityInDb, loadActivityFromDb, loadAllActivitiesFromDb, removeActivityFromDb };