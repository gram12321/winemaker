/**
 * Game State Service
 * Handles business logic related to game state management
 */

import { updateGameState } from '@/gameState';
import { saveGameState } from '@/lib/database/gameStateDB';
import { clearGameStorage } from '@/lib/database/localStorageDB';

/**
 * Handles game state cleanup on logout
 * Saves current state to Firebase, clears localStorage, and resets game state
 * @returns Promise resolving to true if logout handled successfully, false otherwise
 */
export const handleLogout = async (): Promise<boolean> => {
  try {
    // Save current state to Firebase first
    const saveResult = await saveGameState();
    
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
    
    return saveResult;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

/**
 * Save the game state periodically (auto-save)
 * @param intervalMinutes Minutes between auto-saves (default: 5)
 * @returns A function to stop the auto-save interval
 */
export const startAutoSave = (intervalMinutes: number = 5): () => void => {
  console.log(`Starting auto-save every ${intervalMinutes} minutes`);
  
  const intervalId = setInterval(async () => {
    console.log('Auto-saving game state...');
    const result = await saveGameState();
    if (result) {
      console.log('Auto-save completed successfully');
    } else {
      console.warn('Auto-save failed');
    }
  }, intervalMinutes * 60 * 1000);
  
  return () => {
    console.log('Stopping auto-save');
    clearInterval(intervalId);
  };
}; 