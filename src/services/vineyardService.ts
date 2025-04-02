import { v4 as uuidv4 } from 'uuid';
import { Vineyard, createVineyard } from '@/lib/game/vineyard';
import { getGameState, updateGameState } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { saveGameState } from '@/lib/database/gameStateService';
import { createWineBatchFromHarvest } from './wineBatchService';
import { 
  BASE_YIELD_PER_ACRE, 
  BASELINE_VINE_DENSITY,
  CONVENTIONAL_YIELD_BONUS 
} from '@/lib/core/constants';

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
 * Adds a new vineyard to the game and saves to Firebase
 * @param vineyardData Partial vineyard data (id will be generated)
 * @returns The created vineyard
 */
export async function addVineyard(vineyardData: Partial<Vineyard> = {}): Promise<Vineyard> {
  try {
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

    // Save to Firebase
    await saveGameState();
    
    return vineyard;
  } catch (error) {
    console.error('Error adding vineyard:', error);
    throw error;
  }
}

/**
 * Updates an existing vineyard and saves to Firebase
 * @param id ID of the vineyard to update
 * @param updates Updates to apply to the vineyard
 * @returns The updated vineyard or null if not found
 */
export async function updateVineyard(id: string, updates: Partial<Vineyard>): Promise<Vineyard | null> {
  try {
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

    // Save to Firebase
    await saveGameState();
    
    return updatedVineyard;
  } catch (error) {
    console.error('Error updating vineyard:', error);
    throw error;
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
    throw error;
  }
}

/**
 * Alias for getVineyard for compatibility
 */
export const getVineyardById = getVineyard;

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
    throw error;
  }
}

/**
 * Alias for removeVineyard for compatibility
 */
export const deleteVineyard = removeVineyard;

/**
 * Calculate the yield for a vineyard
 * @param vineyard The vineyard to calculate yield for
 * @returns The expected yield in kg
 */
export function calculateVineyardYield(vineyard: Vineyard): number {
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

/**
 * Plants a vineyard with a specific grape variety
 * @param id ID of the vineyard to plant
 * @param grape Type of grape to plant
 * @param density Density of vines per acre
 * @returns The updated vineyard or null if not found
 */
export async function plantVineyard(id: string, grape: GrapeVariety | string, density: number = BASELINE_VINE_DENSITY): Promise<Vineyard | null> {
  try {
    const vineyard = getVineyard(id);
    if (!vineyard) return null;

    // Update vineyard with new grape and density
    return await updateVineyard(id, {
      grape: grape as any,
      density,
      status: 'Planted',
      ripeness: 0,
      vineyardHealth: 100,
      vineAge: 0,
    });
  } catch (error) {
    console.error('Error planting vineyard:', error);
    throw error;
  }
}

/**
 * Harvests grapes from a vineyard
 * @param id ID of the vineyard to harvest
 * @param amount Amount of grapes to harvest (kg). Use Infinity to harvest all.
 * @param storageLocations Array of storage locations and their quantities
 * @returns Object containing the updated vineyard and amount harvested, or null if failed
 */
export async function harvestVineyard(
  id: string, 
  amount: number, 
  storageLocations: { locationId: string; quantity: number }[] = []
): Promise<{ vineyard: Vineyard; harvestedAmount: number } | null> {
  try {
    const vineyard = getVineyard(id);
    if (!vineyard || !vineyard.grape || vineyard.status === 'Harvested' || vineyard.status === 'Dormancy') {
      console.error(`Vineyard with ID ${id} cannot be harvested`);
      return null;
    }

    // Calculate remaining yield
    const remainingYield = vineyard.remainingYield === null
      ? calculateVineyardYield(vineyard)
      : vineyard.remainingYield;

    // Calculate actual harvest amount
    const harvestedAmount = Math.min(amount, remainingYield);
    
    // Verify storage locations total is sufficient for harvest
    const totalStorageQuantity = storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    if (totalStorageQuantity < harvestedAmount) {
      throw new Error(`Insufficient storage allocated. Need at least ${Math.ceil(harvestedAmount)} kg but only ${Math.ceil(totalStorageQuantity)} kg allocated.`);
    }

    // Update the vineyard
    const updatedVineyard = await updateVineyard(id, {
      remainingYield: 0,
      status: 'Dormancy', // Set to Dormancy instead of Harvested
      ripeness: 0
    });

    if (!updatedVineyard) return null;

    // Create a wine batch from the harvested grapes
    const wineBatch = await createWineBatchFromHarvest(
      id,
      vineyard.grape as GrapeVariety,
      harvestedAmount,
      vineyard.annualQualityFactor * vineyard.ripeness,
      storageLocations,
    );

    console.log(`Created wine batch ${wineBatch.id} with ${harvestedAmount} kg of ${vineyard.grape}`);

    return {
      vineyard: updatedVineyard,
      harvestedAmount
    };
  } catch (error) {
    console.error('Error harvesting vineyard:', error);
    throw error;
  }
} 