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
          // Calculate the applied work amount
          const totalWork = plantingActivity.totalWork;
          const appliedWork = Math.round(totalWork * progress);
          
          // Update the activity's appliedWork field
          plantingActivity.appliedWork = appliedWork;
          
          // Update the vineyard status with raw work values
          if (progress > 0 && progress < 1) {
            console.log(`[VineyardService] Updating activity ${plantingActivity.id} progress: ${appliedWork}/${totalWork} (${Math.round(progress * 100)}%)`);
            await updateVineyard(id, {
              status: `Planting: ${appliedWork}/${totalWork}`,
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
    const gameState = getGameState();
    const vineyard = gameState.vineyards.find(v => v.id === id);
    
    if (!vineyard) {
      throw new Error(`Vineyard ${id} not found`);
    }
    
    // Check if it's winter - don't allow harvest to start
    if (gameState.season === 'Winter') {
      consoleService.error(`Cannot harvest during Winter - vines are dormant`);
      return null;
    }
    
    // Check if status is dormancy
    if (vineyard.status === 'Dormancy') {
      consoleService.error(`Cannot harvest during dormancy period`);
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

    // Use a different name for the imported function to avoid redeclaration
    const { updateActivity: updateActivityFn } = await import('@/lib/game/activityManager');

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
          // Get the current game state to check the season
          const currentGameState = getGameState();
          const { season } = currentGameState;
          
          // Calculate new remaining yield after harvest
          const newRemainingYield = remainingYield - harvestableAmount;

          // Determine the new status based on season and remaining yield
          let newStatus = 'Dormancy';
          
          if (season !== 'Winter' && newRemainingYield > 0) {
            // If it's not winter and there's still yield, keep it ready for harvest
            newStatus = 'Ready for Harvest';
          } else if (season === 'Winter' || newRemainingYield <= 0) {
            // If it's winter or no yield remains, go to dormancy
            newStatus = 'Dormancy';
          }
          
          // Update the vineyard with new status and remaining yield
          await updateVineyard(id, {
            remainingYield: newRemainingYield,
            status: newStatus,
            // Only reset ripeness if fully harvested or it's winter
            ...(newRemainingYield <= 0 || season === 'Winter' ? { ripeness: 0 } : {})
          });

          consoleService.success(`Completed harvesting ${Math.round(harvestableAmount).toLocaleString()} kg of ${vineyard.grape} from ${vineyard.name}.`);
        },
        // Progress callback for partial updates
        progressCallback: async (progress) => {
          try {
            // Get current game state and vineyard
            const currentGameState = getGameState();
            const currentVineyard = currentGameState.vineyards.find(v => v.id === id);
            
            // Stop harvesting if it's now winter or vineyard is dormant
            if (currentGameState.season === 'Winter' || currentVineyard?.status === 'Dormancy') {
              // Mark activity as complete instead of using isComplete property
              await updateActivityFn(harvestingActivity.id, { 
                appliedWork: harvestingActivity.totalWork  // Set applied work to total work to mark as complete
              });
              consoleService.info(`Harvesting of ${vineyard.grape} stopped: vineyard is now dormant`);
              return;
            }
            
            // Only process if we harvested at least 10kg
            const partialHarvestAmount = (harvestingActivity.params?.totalAmount || 0) * progress * 0.1; // 10% of work = 10% of grapes
            if (partialHarvestAmount < 10) return;
            
            // Calculate how much was harvested in this update
            const previousHarvested = harvestingActivity.params?.harvestedSoFar || 0;
            const totalHarvestable = harvestingActivity.params?.totalAmount || 0;
            const currentProgress = progress;
            const previousProgress = previousHarvested / totalHarvestable;
            
            // Calculate amount harvested in this tick
            const harvestedThisTick = totalHarvestable * (currentProgress - previousProgress);
            
            if (harvestedThisTick > 10) { // Only process if at least 10kg
              // Get current vineyard ripeness (may have increased during harvest)
              const currentRipeness = currentVineyard?.ripeness || vineyard.ripeness;
              
              // Create wine batch for this harvest increment
              const wineBatch = await createWineBatchFromHarvest(
                id,
                vineyard.grape as GrapeVariety,
                harvestedThisTick,
                vineyard.annualQualityFactor * currentRipeness,
                storageLocations,
                false, // Don't save to DB yet
                currentRipeness // Pass current ripeness value
              );
              
              if (wineBatch) {
                // Update the total harvested so far
                harvestingActivity.params!.harvestedSoFar = previousHarvested + harvestedThisTick;
                
                consoleService.info(`Harvested ${Math.round(harvestedThisTick).toLocaleString()} kg of ${vineyard.grape} (${Math.round(progress * 100)}% complete).`);
              }
            }
            
            // Calculate the applied work amount for status
            const appliedWork = Math.round(harvestingActivity.totalWork * progress);
            const totalWork = harvestingActivity.totalWork;
            
            // Update the activity's appliedWork field
            harvestingActivity.appliedWork = appliedWork;

            console.log(`[VineyardService] Updating activity ${harvestingActivity.id} progress: ${appliedWork}/${totalWork} (${Math.round(progress * 100)}%)`);

            // Update vineyard status with raw work values
            await updateVineyard(id, {
              status: `Harvesting: ${appliedWork}/${totalWork}`,
              // Don't update ripeness here - let the game tick system handle that
            });
          } catch (error) {
            console.error('Error in harvest progress callback:', error);
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