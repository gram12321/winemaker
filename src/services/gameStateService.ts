/**
 * Game State Service
 * Handles business logic related to game state management
 */

import { updateGameState } from '@/gameState';
import { saveGameState, loadGameState } from '@/lib/database/gameStateDB';
import { clearGameStorage } from '@/lib/database/localStorageDB';

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