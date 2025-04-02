import { v4 as uuidv4 } from 'uuid';
import { Vineyard, createVineyard } from '@/lib/game/vineyard';
import { getGameState, updateGameState } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';

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
  const gameState = getGameState();
  
  // Convert ownedSince to GameDate format if needed
  if (vineyardData.ownedSince) {
    vineyardData.ownedSince = convertToGameDate(vineyardData.ownedSince, gameState);
  }
  
  // Create the vineyard
  const vineyard = createVineyard(id, vineyardData);
  
  // Update game state with the new vineyard
  updateGameState({
    vineyards: [...gameState.vineyards, vineyard]
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
  const gameState = getGameState();
  
  // Convert ownedSince to GameDate format if needed
  if (updates.ownedSince) {
    updates.ownedSince = convertToGameDate(updates.ownedSince, gameState);
  }
  
  const updatedVineyards = gameState.vineyards.map((vineyard: Vineyard) => {
    if (vineyard.id === id) {
      updatedVineyard = { ...vineyard, ...updates };
      return updatedVineyard;
    }
    return vineyard;
  });
  
  updateGameState({
    vineyards: updatedVineyards
  });
  
  return updatedVineyard;
}

/**
 * Gets a vineyard by ID
 * @param id ID of the vineyard to retrieve
 * @returns The vineyard or null if not found
 */
export function getVineyard(id: string): Vineyard | null {
  const gameState = getGameState();
  return gameState.vineyards.find((vineyard: Vineyard) => vineyard.id === id) || null;
}

/**
 * Removes a vineyard by ID
 * @param id ID of the vineyard to remove
 * @returns True if the vineyard was removed, false otherwise
 */
export function removeVineyard(id: string): boolean {
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
  
  return removed;
}

/**
 * Plants a vineyard with a specific grape variety
 * @param id ID of the vineyard to plant
 * @param grape Type of grape to plant
 * @param density Density of vines per acre
 * @returns The updated vineyard or null if not found
 */
export function plantVineyard(id: string, grape: GrapeVariety, density: number): Vineyard | null {
  const vineyard = getVineyard(id);
  if (!vineyard) return null;

  // Update vineyard with new grape and density
  return updateVineyard(id, {
    grape,
    density,
    status: 'Planted',
    ripeness: 0,
    vineyardHealth: 100,
  });
}

/**
 * Harvests grapes from a vineyard
 * @param id ID of the vineyard to harvest
 * @param amount Amount of grapes to harvest (kg). Use Infinity to harvest all.
 * @returns Object containing the updated vineyard and amount harvested, or null if failed
 */
export function harvestVineyard(id: string, amount: number): { vineyard: Vineyard; harvestedAmount: number } | null {
  const vineyard = getVineyard(id);
  if (!vineyard || !vineyard.grape || vineyard.ripeness < 0.8) return null;

  const availableYield = vineyard.acres * vineyard.density * vineyard.ripeness;
  const harvestedAmount = Math.min(availableYield, amount);

  const updatedVineyard = updateVineyard(id, {
    ripeness: 0,
    status: 'Harvested',
    remainingYield: 0
  });

  if (!updatedVineyard) return null;

  return {
    vineyard: updatedVineyard,
    harvestedAmount
  };
} 