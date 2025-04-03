import { v4 as uuidv4 } from 'uuid';
import { Vineyard, createVineyard } from '@/lib/game/vineyard';
import { getGameState } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { createWineBatchFromHarvest } from './wineBatchService';
import { 
  BASE_YIELD_PER_ACRE, 
  BASELINE_VINE_DENSITY,
  CONVENTIONAL_YIELD_BONUS 
} from '@/lib/core/constants';
import { 
  getVineyard, 
  saveVineyard, 
  removeVineyard, 
  convertToGameDate, 
  getAllVineyards 
} from '@/lib/database/vineyardDB';

/**
 * Adds a new vineyard to the game
 * @param vineyardData Partial vineyard data (id will be generated if not provided)
 * @returns The created vineyard or null if failed
 */
export async function addVineyard(vineyardData: Partial<Vineyard> = {}): Promise<Vineyard | null> {
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
    
    // Save to database
    return await saveVineyard(vineyard);
  } catch (error) {
    console.error('Error adding vineyard:', error);
    return null;
  }
}

/**
 * Updates an existing vineyard
 * @param id ID of the vineyard to update
 * @param updates Updates to apply to the vineyard
 * @returns The updated vineyard or null if not found
 */
export async function updateVineyard(id: string, updates: Partial<Vineyard>): Promise<Vineyard | null> {
  try {
    // Get the existing vineyard
    const vineyard = getVineyard(id);
    if (!vineyard) return null;
    
    // Get game state for potential ownedSince conversion
    const gameState = getGameState();
    
    // Convert ownedSince to GameDate format if needed
    if (updates.ownedSince) {
      updates.ownedSince = convertToGameDate(updates.ownedSince, gameState);
    }
    
    // Update and save the vineyard
    const updatedVineyard = { ...vineyard, ...updates };
    return await saveVineyard(updatedVineyard);
  } catch (error) {
    console.error('Error updating vineyard:', error);
    return null;
  }
}

/**
 * Gets a vineyard by ID
 * @param id ID of the vineyard to retrieve
 * @returns The vineyard or null if not found
 */
export function getVineyardById(id: string): Vineyard | null {
  return getVineyard(id);
}

/**
 * Gets all vineyards
 * @returns Array of all vineyards
 */
export function getVineyards(): Vineyard[] {
  return getAllVineyards();
}

/**
 * Removes a vineyard by ID
 * @param id ID of the vineyard to remove
 * @returns True if the vineyard was removed, false otherwise
 */
export async function deleteVineyard(id: string): Promise<boolean> {
  return await removeVineyard(id);
}

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

  return Math.round(expectedYield);
}

/**
 * Plants a vineyard with a specific grape variety
 * @param id ID of the vineyard to plant
 * @param grape Type of grape to plant
 * @param density Density of vines per acre (defaults to baseline density)
 * @returns The updated vineyard or null if not found
 */
export async function plantVineyard(id: string, grape: GrapeVariety, density: number = BASELINE_VINE_DENSITY): Promise<Vineyard | null> {
  try {
    // Update vineyard with new grape and density
    return await updateVineyard(id, {
      grape,
      density,
      status: 'Planted',
      ripeness: 0,
      vineyardHealth: 100,
      vineAge: 0,
    });
  } catch (error) {
    console.error('Error planting vineyard:', error);
    return null;
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

    // Calculate total available storage space
    const totalStorageQuantity = storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    
    // Calculate how much we can actually harvest based on storage constraints
    const harvestedAmount = Math.min(
      amount, // Requested amount
      remainingYield, // Available yield
      totalStorageQuantity // Available storage space
    );

    // If no storage is allocated, we can't harvest
    if (totalStorageQuantity <= 0) {
      throw new Error('No storage space allocated for harvest');
    }

    // Calculate new remaining yield after harvest
    const newRemainingYield = remainingYield - harvestedAmount;

    // Determine vineyard status based on remaining yield
    const newStatus = newRemainingYield <= 0 
      ? 'Dormancy' 
      : 'Partially Harvested';

    // Update the vineyard with new status and remaining yield
    const updatedVineyard = await updateVineyard(id, {
      remainingYield: newRemainingYield,
      status: newStatus,
      // Only reset ripeness if fully harvested
      ...(newRemainingYield <= 0 ? { ripeness: 0 } : {})
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

    if (!wineBatch) {
      throw new Error('Failed to create wine batch from harvest');
    }

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