import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Staff } from '../../gameState';
import { StaffTeam } from '../../services/staffService';

const STAFF_COLLECTION = 'staff';
const TEAMS_COLLECTION = 'staffTeams';
const STAFF_ASSIGNMENTS_COLLECTION = 'staffAssignments';

export const saveStaffToDb = async (staff: Staff): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staff.id);
    await setDoc(staffRef, staff);
    return true;
  } catch (error) {
    return false;
  }
};

export const loadAllStaffFromDb = async (): Promise<Staff[]> => {
  try {
    const staffSnapshot = await getDocs(collection(db, STAFF_COLLECTION));
    return staffSnapshot.docs.map(doc => doc.data() as Staff);
  } catch (error) {
    return [];
  }
};

export const removeStaffFromDb = async (staffId: string): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staffId);
    await setDoc(staffRef, { deleted: true }, { merge: true });
    return true;
  } catch (error) {
    return false;
  }
};

export const updateStaffInDb = async (staff: Staff): Promise<boolean> => {
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staff.id);
    // Convert undefined values to null for Firebase compatibility
    const sanitizedStaff = JSON.parse(JSON.stringify(staff));
    await updateDoc(staffRef, sanitizedStaff);
    return true;
  } catch (error) {
    return false;
  }
};

export const saveTeamToDb = async (team: StaffTeam): Promise<boolean> => {
  try {
    // Convert undefined values to null for Firebase compatibility
    const sanitizedTeam = JSON.parse(JSON.stringify(team));
    
    // Save to Firebase
    const teamRef = doc(db, TEAMS_COLLECTION, team.id);
    await setDoc(teamRef, sanitizedTeam);
    
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
    return false;
  }
};

export const loadTeamsFromDb = async (): Promise<StaffTeam[]> => {
  try {
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    const teams = teamsSnapshot.docs.map(doc => doc.data() as StaffTeam);
    
    // Update localStorage
    localStorage.setItem('staffTeams', JSON.stringify(teams));
    return teams;
  } catch (error) {
    // Fallback to localStorage if Firebase fails
    const teamsJSON = localStorage.getItem('staffTeams');
    return teamsJSON ? JSON.parse(teamsJSON) : [];
  }
};

export const saveStaffAssignmentsToDb = async (
  activityId: string,
  staffIds: string[]
): Promise<boolean> => {
  try {
    const assignmentRef = doc(db, STAFF_ASSIGNMENTS_COLLECTION, activityId);
    await setDoc(assignmentRef, { staffIds });
    return true;
  } catch (error) {
    return false;
  }
};

export const loadStaffAssignmentsFromDb = async (
  activityId: string
): Promise<string[]> => {
  try {
    const assignmentRef = doc(db, STAFF_ASSIGNMENTS_COLLECTION, activityId);
    const assignmentDoc = await getDoc(assignmentRef);
    return assignmentDoc.exists() ? assignmentDoc.data().staffIds : [];
  } catch (error) {
    return [];
  }
};

export const clearStaffLocalStorage = (): void => {
  localStorage.removeItem('staffTeams');
};


export const deleteAllStaff = async (): Promise<boolean> => {
  try {
    const querySnapshot = await getDocs(collection(db, STAFF_COLLECTION));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    return false;
  }
};


export const deleteAllTeams = async (): Promise<boolean> => {
  try {
    const querySnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    return false;
  }
};


export const deleteAllStaffAssignments = async (): Promise<boolean> => {
  try {
    const querySnapshot = await getDocs(collection(db, STAFF_ASSIGNMENTS_COLLECTION));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    return false;
  }
};

export default { saveStaffToDb, loadAllStaffFromDb, removeStaffFromDb, updateStaffInDb, saveTeamToDb, loadTeamsFromDb, saveStaffAssignmentsToDb, loadStaffAssignmentsFromDb, clearStaffLocalStorage, deleteAllStaff, deleteAllTeams, deleteAllStaffAssignments };