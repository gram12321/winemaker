/**
 * Vineyard Service
 * Handles vineyard-related operations for the game
 */

import { getGameState, updateGameState } from '../../gameState';
import { Vineyard, createVineyard } from '../vineyard';
import { saveGameState } from './gameStateService';
import { 
  GameDate, 
  BASE_YIELD_PER_ACRE, 
  BASELINE_VINE_DENSITY,
  CONVENTIONAL_YIELD_BONUS 
} from '../constants';

/**
 * Convert legacy date formats to GameDate format
 * @param ownedSince Any date format (Date, string, timestamp, etc.)
 * @returns GameDate format
 */
const convertToGameDate = (ownedSince: any): GameDate => {
  const gameState = getGameState();
  
  // Default to current game date if conversion fails
  const defaultDate: GameDate = {
    week: gameState.week,
    season: gameState.season,
    year: gameState.currentYear
  };
  
  // If it's already a GameDate object
  if (ownedSince && typeof ownedSince === 'object' && 'week' in ownedSince && 'season' in ownedSince && 'year' in ownedSince) {
    return ownedSince as GameDate;
  }
  
  // For legacy data, just use current game date
  return defaultDate;
};

/**
 * Add a new vineyard to the game state
 * @param vineyard The vineyard to add, or partial data to create a new one
 * @param saveToDb Whether to also save to the database
 * @returns The newly created vineyard
 */
export const addVineyard = async (
  vineyard?: Partial<Vineyard>,
  saveToDb: boolean = false
): Promise<Vineyard> => {
  try {
    const gameState = getGameState();
    const newId = `vineyard-${Date.now()}`;
    
    // Create a new vineyard with the given data or defaults
    const newVineyard = createVineyard(newId, vineyard || {});
    
    // Update game state
    const updatedVineyards = [...gameState.vineyards, newVineyard];
    updateGameState({ vineyards: updatedVineyards });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return newVineyard;
  } catch (error) {
    console.error('Error adding vineyard:', error);
    throw error;
  }
};

/**
 * Update an existing vineyard in the game state
 * @param vineyardId The ID of the vineyard to update
 * @param updates The updates to apply
 * @param saveToDb Whether to also save to the database
 * @returns The updated vineyard or null if not found
 */
export const updateVineyard = async (
  vineyardId: string,
  updates: Partial<Vineyard>,
  saveToDb: boolean = false
): Promise<Vineyard | null> => {
  try {
    const gameState = getGameState();
    const vineyardIndex = gameState.vineyards.findIndex(v => v.id === vineyardId);
    
    if (vineyardIndex === -1) {
      console.error(`Vineyard with ID ${vineyardId} not found`);
      return null;
    }
    
    // Handle conversion of legacy ownedSince format if present in updates
    if (updates.ownedSince && typeof updates.ownedSince !== 'object') {
      updates.ownedSince = convertToGameDate(updates.ownedSince);
    }
    
    // Create updated vineyard
    const updatedVineyard = {
      ...gameState.vineyards[vineyardIndex],
      ...updates
    };
    
    // Update game state
    const updatedVineyards = [...gameState.vineyards];
    updatedVineyards[vineyardIndex] = updatedVineyard;
    
    updateGameState({ vineyards: updatedVineyards });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return updatedVineyard;
  } catch (error) {
    console.error('Error updating vineyard:', error);
    throw error;
  }
};

/**
 * Delete a vineyard from the game state
 * @param vineyardId The ID of the vineyard to delete
 * @param saveToDb Whether to also save to the database
 * @returns True if deleted successfully, false if not found
 */
export const deleteVineyard = async (
  vineyardId: string,
  saveToDb: boolean = false
): Promise<boolean> => {
  try {
    const gameState = getGameState();
    const vineyardIndex = gameState.vineyards.findIndex(v => v.id === vineyardId);
    
    if (vineyardIndex === -1) {
      console.error(`Vineyard with ID ${vineyardId} not found`);
      return false;
    }
    
    // Update game state
    const updatedVineyards = gameState.vineyards.filter(v => v.id !== vineyardId);
    updateGameState({ vineyards: updatedVineyards });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting vineyard:', error);
    throw error;
  }
};

/**
 * Get a vineyard by ID
 * @param vineyardId The ID of the vineyard to get
 * @returns The vineyard or null if not found
 */
export const getVineyardById = (vineyardId: string): Vineyard | null => {
  try {
    const gameState = getGameState();
    const vineyard = gameState.vineyards.find(v => v.id === vineyardId);
    
    return vineyard || null;
  } catch (error) {
    console.error('Error getting vineyard:', error);
    throw error;
  }
};

/**
 * Plant a grape in a vineyard
 * @param vineyardId The ID of the vineyard to plant
 * @param grape The grape variety to plant
 * @param density The planting density (vines per acre)
 * @param saveToDb Whether to also save to the database
 * @returns The updated vineyard or null if not found
 */
export const plantVineyard = async (
  vineyardId: string,
  grape: string,
  density: number = BASELINE_VINE_DENSITY,
  saveToDb: boolean = false
): Promise<Vineyard | null> => {
  try {
    const gameState = getGameState();
    const vineyard = gameState.vineyards.find(v => v.id === vineyardId);
    
    if (!vineyard) {
      console.error(`Vineyard with ID ${vineyardId} not found`);
      return null;
    }
    
    // Update the vineyard
    const updates: Partial<Vineyard> = {
      grape: grape as any, // Type assertion since we're passing a string
      density,
      status: 'Planted',
      vineAge: 0,
    };
    
    return await updateVineyard(vineyardId, updates, saveToDb);
  } catch (error) {
    console.error('Error planting vineyard:', error);
    throw error;
  }
};

/**
 * Harvest grapes from a vineyard
 * @param vineyardId The ID of the vineyard to harvest
 * @param amount The amount to harvest (kg)
 * @param saveToDb Whether to also save to the database
 * @returns The updated vineyard and the harvested amount, or null if not found
 */
export const harvestVineyard = async (
  vineyardId: string,
  amount: number,
  saveToDb: boolean = false
): Promise<{ vineyard: Vineyard; harvestedAmount: number } | null> => {
  try {
    const gameState = getGameState();
    const vineyard = gameState.vineyards.find(v => v.id === vineyardId);
    
    if (!vineyard) {
      console.error(`Vineyard with ID ${vineyardId} not found`);
      return null;
    }
    
    // Can't harvest if not planted or already harvested
    if (!vineyard.grape || vineyard.status === 'Harvested') {
      console.error(`Vineyard with ID ${vineyardId} cannot be harvested`);
      return null;
    }
    
    // Calculate remaining yield
    const remainingYield = vineyard.remainingYield === null
      ? calculateVineyardYield(vineyard)
      : vineyard.remainingYield;
    
    // Calculate actual harvest amount (can't harvest more than remaining)
    const harvestAmount = Math.min(amount, remainingYield);
    const newRemainingYield = remainingYield - harvestAmount;
    
    // Update the vineyard
    const updates: Partial<Vineyard> = {
      remainingYield: newRemainingYield,
      status: newRemainingYield <= 0 ? 'Harvested' : 'Partially Harvested',
    };
    
    const updatedVineyard = await updateVineyard(vineyardId, updates, saveToDb);
    
    if (!updatedVineyard) {
      return null;
    }
    
    return {
      vineyard: updatedVineyard,
      harvestedAmount: harvestAmount,
    };
  } catch (error) {
    console.error('Error harvesting vineyard:', error);
    throw error;
  }
};

/**
 * Calculate the yield for a vineyard (helper function)
 */
function calculateVineyardYield(vineyard: Vineyard): number {
  if (!vineyard.grape || vineyard.annualYieldFactor === 0 || vineyard.status === 'Harvested') {
    return 0;
  }

  const densityModifier = vineyard.density / BASELINE_VINE_DENSITY;
  const qualityMultiplier = (vineyard.ripeness + vineyard.vineyardHealth) / 2;
  let expectedYield = BASE_YIELD_PER_ACRE * vineyard.acres * qualityMultiplier * 
                      vineyard.annualYieldFactor * densityModifier;
  
  // Apply bonus multiplier if conventional
  if (vineyard.farmingMethod === 'Conventional') {
    expectedYield *= CONVENTIONAL_YIELD_BONUS;
  }

  return expectedYield;
} 