/**
 * Game State Service
 * Handles saving and loading the full game state
 */

import { db } from '../../firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { getGameState, updateGameState } from '../../gameState';
import { loadCompany } from './companyService';
import { clearGameStorage } from './localStorageDB';

/**
 * Save the current game state to Firestore
 * @returns True if saved successfully, false otherwise
 */
export const saveGameState = async (): Promise<boolean> => {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;
    
    if (!companyName) {
      console.error('No company name found to save game state');
      return false;
    }
    
    const docRef = doc(db, "companies", companyName);
    await setDoc(docRef, {
      player: gameState.player,
      vineyards: gameState.vineyards,
      buildings: gameState.buildings,
      staff: gameState.staff,
      wineBatches: gameState.wineBatches,
      week: gameState.week,
      season: gameState.season,
      currentYear: gameState.currentYear
    });
    
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
};

/**
 * Load a game state from Firestore
 * @param companyName The company name to load
 * @returns True if loaded successfully, false otherwise
 */
export const loadGameState = async (companyName: string): Promise<boolean> => {
  try {
    const data = await loadCompany(companyName);
    
    if (!data) {
      console.error('No data found for company:', companyName);
      return false;
    }
    
    // Update game state with loaded data
    updateGameState({
      player: data.player || null,
      vineyards: data.vineyards || [],
      buildings: data.buildings || [],
      staff: data.staff || [],
      wineBatches: data.wineBatches || [],
      week: data.week || 1,
      season: data.season || 'Spring',
      currentYear: data.currentYear || new Date().getFullYear(),
      currentView: 'mainMenu',
    });
    
    return true;
  } catch (error) {
    console.error('Error loading game state:', error);
    return false;
  }
};

/**
 * Handles game state cleanup on logout
 * Saves current state to Firebase, clears localStorage, and resets game state
 */
export const handleLogout = async (): Promise<void> => {
  try {
    // Save current state to Firebase first
    await saveGameState();
    
    // Clear all game-related data from localStorage
    clearGameStorage();
    
    // Reset game state to initial values
    updateGameState({
      player: null,
      vineyards: [],
      buildings: [],
      staff: [],
      wineBatches: [],
      week: 1,
      season: 'Spring',
      currentYear: new Date().getFullYear(),
      currentView: 'login'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Save the game state periodically (auto-save)
 * @param intervalMinutes Minutes between auto-saves
 * @returns A function to stop the auto-save interval
 */
export const startAutoSave = (intervalMinutes: number = 5): () => void => {
  const intervalId = setInterval(async () => {
    console.log('Auto-saving game state...');
    await saveGameState();
  }, intervalMinutes * 60 * 1000);
  
  return () => clearInterval(intervalId);
}; 