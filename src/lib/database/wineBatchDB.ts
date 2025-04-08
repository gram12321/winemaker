import { getGameState, updateGameState, WineBatch } from '@/gameState';
import { saveGameState } from './gameStateDB';

export async function saveWineBatch(
  batch: WineBatch,
  saveToDb: boolean = true
): Promise<WineBatch | null> {
  try {
    const gameState = getGameState();
    
    // Check if batch already exists and update it, or add as new
    let batchExists = false;
    const updatedWineBatches = gameState.wineBatches.map((b: WineBatch) => {
      if (b.id === batch.id) {
        batchExists = true;
        return batch;
      }
      return b;
    });
    
    // If batch doesn't exist yet, add it
    if (!batchExists) {
      updatedWineBatches.push(batch);
    }
    
    // Update game state
    updateGameState({ wineBatches: updatedWineBatches });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return batch;
  } catch (error) {
    console.error('Error saving wine batch:', error);
    return null;
  }
}

/**
 * Get a wine batch by ID
 * @param id The ID of the wine batch to retrieve
 * @returns The wine batch or null if not found
 */
export function getWineBatchFromDB(id: string): WineBatch | null {
  try {
    const gameState = getGameState();
    return gameState.wineBatches.find(batch => batch.id === id) || null;
  } catch (error) {
    console.error('Error getting wine batch:', error);
    return null;
  }
}

/**
 * Get all wine batches
 * @returns Array of all wine batches
 */
export function getAllWineBatches(): WineBatch[] {
  try {
    const gameState = getGameState();
    return gameState.wineBatches || [];
  } catch (error) {
    console.error('Error getting all wine batches:', error);
    return [];
  }
}

/**
 * Remove a wine batch by ID
 * @param id The ID of the wine batch to remove
 * @param saveToDb Whether to also save to the database
 * @returns True if removed, false if not found or failed
 */
export async function removeWineBatchFromDB(
  id: string,
  saveToDb: boolean = true
): Promise<boolean> {
  try {
    const gameState = getGameState();
    const batchIndex = gameState.wineBatches.findIndex(batch => batch.id === id);
    
    if (batchIndex === -1) {
      console.error(`Wine batch with ID ${id} not found`);
      return false;
    }
    
    // Update game state
    const updatedWineBatches = gameState.wineBatches.filter(batch => batch.id !== id);
    updateGameState({ wineBatches: updatedWineBatches });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return true;
  } catch (error) {
    console.error('Error removing wine batch:', error);
    return false;
  }
} 