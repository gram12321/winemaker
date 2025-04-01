/**
 * Company Service
 * Handles company-related operations with Firebase
 */

import { db } from '../../firebase.config';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Player } from '../../gameState';
import { StorageKeys, saveToStorage } from './storageService';

/**
 * Check if a company exists in Firestore
 * @param companyName The name of the company to check
 * @returns True if the company exists, false otherwise
 */
export const checkCompanyExists = async (companyName: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking if company exists:', error);
    throw error;
  }
};

/**
 * Create a new company in Firestore
 * @param companyName The name of the company to create
 * @param player The player data
 */
export const createCompany = async (companyName: string, player: Player): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    await setDoc(docRef, {
      player,
      vineyards: [],
      buildings: [],
      staff: [],
      week: 1,
      season: 'Spring',
      currentYear: new Date().getFullYear(),
    });
    
    // Save to localStorage for quick access
    saveToStorage(StorageKeys.COMPANY_NAME, companyName);
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

/**
 * Load company data from Firestore
 * @param companyName The name of the company to load
 * @returns The company data or null if not found
 */
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
    throw error;
  }
};

/**
 * Delete a company from Firestore
 * @param companyName The name of the company to delete
 */
export const deleteCompany = async (companyName: string): Promise<void> => {
  try {
    const docRef = doc(db, 'companies', companyName);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

/**
 * Delete all companies from Firestore
 */
export const deleteAllCompanies = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, "companies"));
    const deletePromises = querySnapshot.docs.map(docSnapshot => {
      return deleteDoc(docSnapshot.ref);
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all companies:', error);
    throw error;
  }
}; 