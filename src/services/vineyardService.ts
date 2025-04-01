import { v4 as uuidv4 } from 'uuid';
import { Vineyard, createVineyard } from '../lib/vineyard';
import { updateGameState } from './gameStateService';
import { GameDate } from '../lib/constants';

/**
 * Convert a date to a GameDate object
 * This function handles legacy date formats and converts them to GameDate
 * @param date Date or GameDate object to convert
 * @param gameState Current game state
 * @returns GameDate object
 */
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
 * Adds a new vineyard to the game
 * @param vineyardData Partial vineyard data (id will be generated)
 * @returns The created vineyard
 */
export function addVineyard(vineyardData: Partial<Vineyard> = {}): Vineyard {
  // Generate a new UUID if none provided
  const id = vineyardData.id || uuidv4();
  
  // Get current game state for use in creating the vineyard
  const gameState = require('../gameState').getGameState();
  
  // Convert ownedSince to GameDate format if needed
  if (vineyardData.ownedSince) {
    vineyardData.ownedSince = convertToGameDate(vineyardData.ownedSince, gameState);
  }
  
  // Create the vineyard
  const vineyard = createVineyard(id, vineyardData);
  
  // Update game state with the new vineyard
  updateGameState((prevState) => {
    const ownedVineyards = [...prevState.ownedVineyards, vineyard];
    return { ...prevState, ownedVineyards };
  });
  
  return vineyard;
}

/**
 * Updates an existing vineyard
 * @param id ID of the vineyard to update
 * @param updates Updates to apply to the vineyard
 * @returns The updated vineyard or null if not found
 */
export function updateVineyard(id: string, updates: Partial<Vineyard>): Vineyard | null {
  let updatedVineyard: Vineyard | null = null;
  
  // Get game state for potential ownedSince conversion
  const gameState = require('../gameState').getGameState();
  
  // Convert ownedSince to GameDate format if needed
  if (updates.ownedSince) {
    updates.ownedSince = convertToGameDate(updates.ownedSince, gameState);
  }
  
  updateGameState((prevState) => {
    const ownedVineyards = prevState.ownedVineyards.map((vineyard: Vineyard) => {
      if (vineyard.id === id) {
        updatedVineyard = { ...vineyard, ...updates };
        return updatedVineyard;
      }
      return vineyard;
    });
    
    return { ...prevState, ownedVineyards };
  });
  
  return updatedVineyard;
}

/**
 * Gets a vineyard by ID
 * @param id ID of the vineyard to retrieve
 * @returns The vineyard or null if not found
 */
export function getVineyard(id: string): Vineyard | null {
  const gameState = require('../gameState').getGameState();
  return gameState.ownedVineyards.find((vineyard: Vineyard) => vineyard.id === id) || null;
}

/**
 * Removes a vineyard by ID
 * @param id ID of the vineyard to remove
 * @returns True if the vineyard was removed, false otherwise
 */
export function removeVineyard(id: string): boolean {
  let removed = false;
  
  updateGameState((prevState) => {
    const ownedVineyards = prevState.ownedVineyards.filter((vineyard: Vineyard) => {
      if (vineyard.id === id) {
        removed = true;
        return false;
      }
      return true;
    });
    
    return { ...prevState, ownedVineyards };
  });
  
  return removed;
} 