/**
 * Game State Database Operations
 * Handles saving and loading the full game state
 */

import { db } from '../../firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { getGameState } from '../../gameState';
import { loadCompany } from './companyDB';

/**
 * Save the current game state to Firestore
 * @returns Promise resolving to true if saved successfully, false otherwise
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
 * @returns Promise resolving to true if loaded successfully, false otherwise
 */
export const loadGameState = async (companyName: string): Promise<boolean> => {
  try {
    const data = await loadCompany(companyName);
    
    if (!data) {
      console.error('No data found for company:', companyName);
      return false;
    }
    
    // Import updateGameState function here to avoid circular dependencies
    const { updateGameState } = await import('../../gameState');
    
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