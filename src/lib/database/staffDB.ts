import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Staff } from '../../gameState';
import { StaffTeam } from '../../services/staffService';

const STAFF_COLLECTION = 'staff';
const TEAMS_COLLECTION = 'staffTeams';
const STAFF_ASSIGNMENTS_COLLECTION = 'staffAssignments';

/**
 * Save staff member to Firebase
 */
export const saveStaffToDb = async (staff: Staff): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staff.id);
    await setDoc(staffRef, staff);
    return true;
  } catch (error) {
    console.error('Error saving staff to database:', error);
    return false;
  }
};

/**
 * Load all staff from Firebase
 */
export const loadAllStaffFromDb = async (): Promise<Staff[]> => {
  try {
    const staffSnapshot = await getDocs(collection(db, STAFF_COLLECTION));
    return staffSnapshot.docs.map(doc => doc.data() as Staff);
  } catch (error) {
    console.error('Error loading staff from database:', error);
    return [];
  }
};

/**
 * Remove staff member from Firebase
 */
export const removeStaffFromDb = async (staffId: string): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staffId);
    await setDoc(staffRef, { deleted: true }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error removing staff from database:', error);
    return false;
  }
};

/**
 * Update staff member in Firebase
 */
export const updateStaffInDb = async (staff: Staff): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staff.id);
    await updateDoc(staffRef, { ...staff });
    return true;
  } catch (error) {
    console.error('Error updating staff in database:', error);
    return false;
  }
};

/**
 * Save team to Firebase and localStorage
 */
export const saveTeamToDb = async (team: StaffTeam): Promise<boolean> => {
  try {
    // Save to Firebase
    const teamRef = doc(db, TEAMS_COLLECTION, team.id);
    await setDoc(teamRef, team);
    
    // Save to localStorage for quick access
    const teamsJSON = localStorage.getItem('staffTeams');
    const teams: StaffTeam[] = teamsJSON ? JSON.parse(teamsJSON) : [];
    const existingIndex = teams.findIndex(t => t.id === team.id);
    
    if (existingIndex >= 0) {
      teams[existingIndex] = team;
    } else {
      teams.push(team);
    }
    
    localStorage.setItem('staffTeams', JSON.stringify(teams));
    return true;
  } catch (error) {
    console.error('Error saving team to database:', error);
    return false;
  }
};

/**
 * Load teams from Firebase and update localStorage
 */
export const loadTeamsFromDb = async (): Promise<StaffTeam[]> => {
  try {
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    const teams = teamsSnapshot.docs.map(doc => doc.data() as StaffTeam);
    
    // Update localStorage
    localStorage.setItem('staffTeams', JSON.stringify(teams));
    return teams;
  } catch (error) {
    console.error('Error loading teams from database:', error);
    // Fallback to localStorage if Firebase fails
    const teamsJSON = localStorage.getItem('staffTeams');
    return teamsJSON ? JSON.parse(teamsJSON) : [];
  }
};

/**
 * Save staff assignments to Firebase
 */
export const saveStaffAssignmentsToDb = async (
  activityId: string,
  staffIds: string[]
): Promise<boolean> => {
  try {
    const assignmentRef = doc(db, STAFF_ASSIGNMENTS_COLLECTION, activityId);
    await setDoc(assignmentRef, { staffIds });
    return true;
  } catch (error) {
    console.error('Error saving staff assignments to database:', error);
    return false;
  }
};

/**
 * Load staff assignments from Firebase
 */
export const loadStaffAssignmentsFromDb = async (
  activityId: string
): Promise<string[]> => {
  try {
    const assignmentRef = doc(db, STAFF_ASSIGNMENTS_COLLECTION, activityId);
    const assignmentDoc = await getDoc(assignmentRef);
    return assignmentDoc.exists() ? assignmentDoc.data().staffIds : [];
  } catch (error) {
    console.error('Error loading staff assignments from database:', error);
    return [];
  }
};

/**
 * Clear all staff data from localStorage
 */
export const clearStaffLocalStorage = (): void => {
  localStorage.removeItem('staffTeams');
};

export default {
  saveStaffToDb,
  loadAllStaffFromDb,
  removeStaffFromDb,
  updateStaffInDb,
  saveTeamToDb,
  loadTeamsFromDb,
  saveStaffAssignmentsToDb,
  loadStaffAssignmentsFromDb,
  clearStaffLocalStorage
}; 