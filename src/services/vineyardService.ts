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
import { consoleService } from '@/components/layout/Console';

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
    const vineyard = getVineyard(id);
    if (!vineyard) {
      console.error(`Vineyard with ID ${id} not found`);
      return null;
    }

    // Initialize the vineyard for planting
    await updateVineyard(id, {
      status: 'Planting in progress',
    });

    // Import the activity manager and work calculator
    const { createActivityProgress } = await import('@/lib/game/workCalculator');
    const { addActivity } = await import('@/lib/game/activityManager');
    const { WorkCategory } = await import('@/lib/game/workCalculator');

    // Create and add the planting activity
    const plantingActivity = createActivityProgress(
      WorkCategory.PLANTING,
      vineyard.acres,
      {
        density: density,
        targetId: id,
        additionalParams: { grape, density },
        // Callback when planting is complete
        completionCallback: async () => {
          const gameState = getGameState();
          const { season } = gameState;
          
          // Determine initial status based on season
          let initialStatus = 'Growing';
          if (season === 'Winter') {
            initialStatus = 'No yield in first season';
          } else if (season === 'Summer') {
            initialStatus = 'Ripening';
          } else if (season === 'Fall') {
            initialStatus = 'Ready for Harvest';
          }
          
          // Update vineyard with new grape and density
          await updateVineyard(id, {
            grape,
            density,
            status: initialStatus,
            ripeness: season === 'Summer' || season === 'Fall' ? 0.1 : 0, // Start with some ripeness if in growing season
            vineyardHealth: 0.8, // Start with 80% health
            vineAge: 0,
          });
          consoleService.success(`${grape} planted in ${vineyard.name} with a density of ${density} vines per acre.`);
        },
        // Progress callback for partial updates
        progressCallback: async (progress) => {
          // Optional: Update the vineyard status with progress indication
          if (progress > 0 && progress < 1) {
            await updateVineyard(id, {
              status: `Planting: ${Math.round(progress * 100)}%`,
            });
          }
        }
      }
    );

    // Add the activity to the game state
    addActivity(plantingActivity);

    // For now, since we don't have staff, let's initialize with 0% progress
    const { updateActivity } = await import('@/lib/game/activityManager');
    updateActivity(plantingActivity.id, {
      appliedWork: 0 // Start with 0% progress
    });

    consoleService.info(`Started planting ${grape} in ${vineyard.name}.`);
    return vineyard;
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
    const harvestableAmount = Math.min(
      amount, // Requested amount
      remainingYield, // Available yield
      totalStorageQuantity // Available storage space
    );

    // If no storage is allocated, we can't harvest
    if (totalStorageQuantity <= 0) {
      throw new Error('No storage space allocated for harvest');
    }

    // Initialize the vineyard for harvesting
    await updateVineyard(id, {
      status: 'Harvesting in progress',
      remainingYield // Set the initial remaining yield
    });

    // Import the activity manager and work calculator
    const { createActivityProgress } = await import('@/lib/game/workCalculator');
    const { addActivity } = await import('@/lib/game/activityManager');
    const { WorkCategory } = await import('@/lib/game/workCalculator');

    // Format storage locations for display
    const storageNames = storageLocations.map(loc => {
      // In a real implementation, you would look up the storage location name
      return `Storage #${loc.locationId.slice(0, 4)}`;
    }).join(', ');

    // Create and add the harvesting activity
    const harvestingActivity = createActivityProgress(
      WorkCategory.HARVESTING,
      vineyard.acres, // Base work on vineyard size
      {
        targetId: id,
        additionalParams: { 
          totalAmount: harvestableAmount,
          harvestedSoFar: 0,
          storageLocations,
          grape: vineyard.grape,
          quality: vineyard.annualQualityFactor * vineyard.ripeness
        },
        // Callback when harvesting is complete
        completionCallback: async () => {
          // Calculate new remaining yield after harvest
          const newRemainingYield = remainingYield - harvestableAmount;

          // Update the vineyard with new status and remaining yield
          await updateVineyard(id, {
            remainingYield: newRemainingYield,
            status: newRemainingYield <= 0 ? 'Dormancy' : 'Partially Harvested',
            // Only reset ripeness if fully harvested
            ...(newRemainingYield <= 0 ? { ripeness: 0 } : {})
          });

          consoleService.success(`Completed harvesting ${Math.round(harvestableAmount).toLocaleString()} kg of ${vineyard.grape} from ${vineyard.name}.`);
        },
        // Progress callback for partial updates
        progressCallback: async (progress) => {
          if (progress > 0 && progress < 1) {
            const params = harvestingActivity.params;
            if (!params) return;
            
            // Calculate how much was harvested in this update
            const previousHarvested = params.harvestedSoFar || 0;
            const totalHarvestable = params.totalAmount;
            const currentProgress = progress;
            const previousProgress = previousHarvested / totalHarvestable;
            
            // Only create a new batch if there's meaningful progress
            if (currentProgress > previousProgress) {
              // Calculate amount harvested in this tick
              const harvestedThisTick = totalHarvestable * (currentProgress - previousProgress);
              
              if (harvestedThisTick > 10) { // Only process if at least 10kg
                // Create wine batch for this harvest increment
                const wineBatch = await createWineBatchFromHarvest(
                  id,
                  vineyard.grape as GrapeVariety,
                  harvestedThisTick,
                  vineyard.annualQualityFactor * vineyard.ripeness,
                  storageLocations,
                );
                
                if (wineBatch) {
                  // Update the total harvested so far
                  params.harvestedSoFar = previousHarvested + harvestedThisTick;
                  
                  consoleService.info(`Harvested ${Math.round(harvestedThisTick).toLocaleString()} kg of ${vineyard.grape} (${Math.round(progress * 100)}% complete).`);
                }
              }
            }
            
            // Update vineyard status
            await updateVineyard(id, {
              status: `Harvesting: ${Math.round(progress * 100)}%`,
            });
          }
        }
      }
    );

    // Add the activity to the game state
    addActivity(harvestingActivity);

    // For now, since we don't have staff, initialize with 0% progress
    const { updateActivity } = await import('@/lib/game/activityManager');
    updateActivity(harvestingActivity.id, {
      appliedWork: 0 // Start with 0% progress
    });

    consoleService.info(`Started harvesting ${vineyard.grape} from ${vineyard.name}. Grapes will be stored in ${storageNames}.`);
    return {
      vineyard,
      harvestedAmount: 0 // Initial harvested amount is 0
    };
  } catch (error) {
    console.error('Error harvesting vineyard:', error);
    throw error;
  }
} 