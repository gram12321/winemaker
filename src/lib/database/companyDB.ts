import { db } from '../../firebase.config';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Player } from '../../gameState';
import { StorageKeys, saveToStorage } from './localStorageDB';

/**
 * Check if a company exists in Firestore
 */
export const checkCompanyExists = async (companyName: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking if company exists:', error);
    return false;
  }
};

/**
 * Create a new company in Firestore
 */
export const createCompany = async (companyName: string, player: Player, initialStaff: any[] = []): Promise<boolean> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    await setDoc(docRef, {
      player,
      vineyards: [],
      buildings: [],
      staff: initialStaff,
      wineBatches: [],
      week: 1,
      season: 'Spring',
      currentYear: new Date().getFullYear(),
    });
    
    // Save to localStorage for quick access
    saveToStorage(StorageKeys.COMPANY_NAME, companyName);
    return true;
  } catch (error) {
    console.error('Error creating company:', error);
    return false;
  }
};

export const loadCompany = async (companyName: string): Promise<any | null> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Save to localStorage for quick access
      saveToStorage(StorageKeys.COMPANY_NAME, companyName);
      return docSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error loading company:', error);
    return null;
  }
};

/**
 * Delete a company from Firestore
 */
export const deleteCompany = async (companyName: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    return false;
  }
};

/**
 * Delete all companies from Firestore
 * @returns Promise resolving to true if successful, false otherwise
 */
export const deleteAllCompanies = async (): Promise<boolean> => {
  try {
    const querySnapshot = await getDocs(collection(db, "companies"));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting all companies:', error);
    return false;
  }
}; 