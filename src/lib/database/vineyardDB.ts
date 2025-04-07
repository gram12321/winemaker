import { getGameState, updateGameState } from '@/gameState';
import { Vineyard } from '@/lib/game/vineyard';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { saveGameState } from './gameStateDB';

export function convertToGameDate(date: Date | GameDate | string | undefined, gameState: any): GameDate {
  // If it's already a GameDate object with week, season and year
  if (date && typeof date === 'object' && 'week' in date && 'season' in date && 'year' in date) {
    return date as GameDate;
  }
  
  // For legacy dates (string, Date or undefined), use current game state
  return {
    week: gameState.week,
    season: gameState.season,
    year: gameState.currentYear
  };
}

/**
 * Adds a new vineyard to the game and saves to Firebase
 * @param vineyard Vineyard object to save
 * @returns The saved vineyard or null if failed
 */
export async function saveVineyard(vineyard: Vineyard): Promise<Vineyard | null> {
  try {
    // Get current game state
    const gameState = getGameState();
    
    // Check if vineyard already exists and update it, or add as new
    let vineyardExists = false;
    const updatedVineyards = gameState.vineyards.map((v: Vineyard) => {
      if (v.id === vineyard.id) {
        vineyardExists = true;
        return vineyard;
      }
      return v;
    });
    
    // If vineyard doesn't exist yet, add it
    if (!vineyardExists) {
      updatedVineyards.push(vineyard);
    }
    
    // Update game state with the vineyard
    updateGameState({
      vineyards: updatedVineyards
    });

    // Save to Firebase
    await saveGameState();
    
    return vineyard;
  } catch (error) {
    console.error('Error saving vineyard:', error);
    return null;
  }
}

/**
 * Gets a vineyard by ID
 * @param id ID of the vineyard to retrieve
 * @returns The vineyard or null if not found
 */
export function getVineyard(id: string): Vineyard | null {
  try {
    const gameState = getGameState();
    return gameState.vineyards.find((vineyard: Vineyard) => vineyard.id === id) || null;
  } catch (error) {
    console.error('Error getting vineyard:', error);
    return null;
  }
}

/**
 * Gets all vineyards
 * @returns Array of all vineyards
 */
export function getAllVineyards(): Vineyard[] {
  try {
    const gameState = getGameState();
    return gameState.vineyards || [];
  } catch (error) {
    console.error('Error getting all vineyards:', error);
    return [];
  }
}

/**
 * Removes a vineyard by ID
 * @param id ID of the vineyard to remove
 * @returns True if the vineyard was removed, false otherwise
 */
export async function removeVineyard(id: string): Promise<boolean> {
  try {
    let removed = false;
    const gameState = getGameState();
    
    const updatedVineyards = gameState.vineyards.filter((vineyard: Vineyard) => {
      if (vineyard.id === id) {
        removed = true;
        return false;
      }
      return true;
    });
    
    updateGameState({
      vineyards: updatedVineyards
    });

    // Save to Firebase
    await saveGameState();
    
    return removed;
  } catch (error) {
    console.error('Error removing vineyard:', error);
    return false;
  }
} 