import { v4 as uuidv4 } from 'uuid';
import { Vineyard, createVineyard } from '@/lib/game/vineyard';
import { getGameState } from '@/gameState';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { addWineBatch } from './wineBatchService';
import { BASE_YIELD_PER_ACRE, BASELINE_VINE_DENSITY, CONVENTIONAL_YIELD_BONUS } from '@/lib/core/constants';
import { getVineyard, saveVineyard, removeVineyard, getAllVineyards } from '@/lib/database/vineyardDB';
import { consoleService } from '@/components/layout/Console';

export async function addVineyard(vineyardData: Partial<Vineyard> = {}): Promise<Vineyard | null> {
    const id = vineyardData.id || uuidv4();
    const vineyard = createVineyard(id, vineyardData);
    return await saveVineyard(vineyard);
}
export async function updateVineyard(id: string, updates: Partial<Vineyard>): Promise<Vineyard | null> {
    // Get the existing vineyard
    const vineyard = getVineyard(id);
    if (!vineyard) return null;
    
    // Update and save the vineyard
    const updatedVineyard = { ...vineyard, ...updates };
    return await saveVineyard(updatedVineyard);
}

export function getVineyardById(id: string): Vineyard | null {
  return getVineyard(id);
}

export function getVineyards(): Vineyard[] {
  return getAllVineyards();
}

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
    const { addActivity, updateActivity } = await import('@/lib/game/activityManager');
    const { WorkCategory } = await import('@/lib/game/workCalculator');

    // Create and add the planting activity
    const plantingActivity = createActivityProgress(
      WorkCategory.PLANTING,
      vineyard.acres,
      {
        density: density,
        targetId: id,
        additionalParams: { 
          grape, 
          density,
          altitude: vineyard.altitude,
          country: vineyard.country,
          region: vineyard.region,
          resourceName: grape,
        },
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
          // consoleService.success(`${grape} planted in ${vineyard.name} with a density of ${density} vines per acre.`);
        },
        // Progress callback for partial updates
        progressCallback: async (progress) => {
          // Calculate the applied work amount
          const totalWork = plantingActivity.totalWork;
          const appliedWork = Math.round(totalWork * progress);
          
          // Update the activity object in the global state
          updateActivity(plantingActivity.id, { appliedWork });
          
          // Update the vineyard status with raw work values
          if (progress > 0 && progress < 1) {
            await updateVineyard(id, {
              status: `Planting: ${appliedWork}/${totalWork}`,
            });
          }
        }
      }
    );

    // Add the activity to the game state
    addActivity(plantingActivity);

    // No need to call updateActivity here again, just add it
    /*
    const { updateActivity: initialUpdate } = await import('@/lib/game/activityManager');
    initialUpdate(plantingActivity.id, {
      appliedWork: 0 // Start with 0% progress
    });
    */

    // consoleService.info(`Started planting ${grape} in ${vineyard.name}.`);
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
      console.error(`Cannot harvest during Winter - vines are dormant`);
      return null;
    }
    
    // Check if status is dormancy
    if (vineyard.status === 'Dormancy') {
      console.error(`Cannot harvest during dormancy period`);
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

          // --- Process the final harvest amount --- 
          const harvestedSoFar = harvestingActivity.params?.harvestedSoFar || 0;
          const totalHarvestable = harvestingActivity.params?.totalAmount || 0;
          const finalHarvestAmount = totalHarvestable - harvestedSoFar;

          if (finalHarvestAmount > 0) {
            // Get the latest vineyard state for ripeness calculation
            const finalVineyardState = getVineyardById(id);
            const finalRipeness = finalVineyardState?.ripeness || vineyard.ripeness;

            await addWineBatch(
              id,
              vineyard.grape as GrapeVariety,
              finalHarvestAmount,
              vineyard.annualQualityFactor * finalRipeness, // Use final ripeness
              storageLocations,
              false, // Don't save game state yet
              finalRipeness // Pass final ripeness
            );
            // consoleService.info(`Harvested final ${Math.round(finalHarvestAmount).toLocaleString()} kg of ${vineyard.grape}.`);
          }
          // --- End final harvest processing ---
          
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

          // consoleService.success(`Completed harvesting ${Math.round(harvestableAmount).toLocaleString()} kg of ${vineyard.grape} from ${vineyard.name}.`);
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
              // consoleService.info(`Harvesting of ${vineyard.grape} stopped: vineyard is now dormant`);
              return;
            }
            
            // Only process if we harvested at least 10kg
            const partialHarvestAmount = (harvestingActivity.params?.totalAmount || 0) * progress * 0.1; // 10% of work = 10% of grapes
            if (partialHarvestAmount < 10) return;
            
            // Calculate how much was harvested in this update
            const previousHarvested = harvestingActivity.params?.harvestedSoFar || 0;
            const totalHarvestable = harvestingActivity.params?.totalAmount || 0;
            const currentProgress = progress;
            // Ensure previousProgress is calculated correctly even if harvestedSoFar is 0
            const previousProgress = totalHarvestable > 0 ? (previousHarvested / totalHarvestable) : 0;
            
            // Calculate amount harvested in this tick
            const harvestedThisTick = totalHarvestable * (currentProgress - previousProgress);
            
            if (harvestedThisTick > 10) { // Only process if at least 10kg
              // Get current vineyard ripeness (may have increased during harvest)
              const currentRipeness = currentVineyard?.ripeness || vineyard.ripeness;
              
              // Create wine batch for this harvest increment
              const wineBatch = await addWineBatch(
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
                
                // consoleService.info(`Harvested ${Math.round(harvestedThisTick).toLocaleString()} kg of ${vineyard.grape} (${Math.round(progress * 100)}% complete).`);
              }
            }
            
            // Calculate the applied work amount for status
            const appliedWork = Math.round(harvestingActivity.totalWork * progress);
            const totalWork = harvestingActivity.totalWork;
            
            // Update the activity's appliedWork field
            harvestingActivity.appliedWork = appliedWork;

            // console.log(`[VineyardService] Updating activity ${harvestingActivity.id} progress: ${appliedWork}/${totalWork} (${Math.round(progress * 100)}%)`);

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

    // consoleService.info(`Started harvesting ${vineyard.grape} from ${vineyard.name}. Grapes will be stored in ${storageNames}.`);
    return {
      vineyard,
      harvestedAmount: 0 // Initial harvested amount is 0
    };
  } catch (error) {
    console.error('Error harvesting vineyard:', error);
    throw error;
  }
}

/**
 * Clear a vineyard to improve its health
 * @param id Vineyard ID to clear
 * @param options Clearing options including tasks, replanting intensity, and amendment method
 * @returns Updated vineyard or null if failed
 */
export async function clearVineyard(
  id: string, 
  options: { 
    tasks: { [key: string]: boolean };
    replantingIntensity: number;
    isOrganicAmendment: boolean;
  }
): Promise<Vineyard | null> {
  try {
    const vineyard = getVineyardById(id);
    if (!vineyard) {
      throw new Error(`Vineyard with ID ${id} not found`);
    }

    // Get the activity manager and necessary helpers
    const { startActivityWithDisplayState } = await import('../lib/game/activityManager');
    const { WorkCategory, calculateTotalWork } = await import('../lib/game/workCalculator');

    // --- Calculate Total Work based on selected tasks --- 
    let totalWork = 0;
    const TASK_ID_TO_CATEGORY: Record<string, WorkCategory> = {
      'remove-vines': WorkCategory.UPROOTING,
      'clear-vegetation': WorkCategory.CLEARING,
      'remove-debris': WorkCategory.CLEARING,
      'soil-amendment': WorkCategory.CLEARING
    };
    
    Object.entries(options.tasks).forEach(([taskId, isSelected]) => {
      if (!isSelected) return;
      
      const category = TASK_ID_TO_CATEGORY[taskId];
      if (!category) return;

      let taskAmount = vineyard.acres;
      let taskSpecificFactors: any = {
        category: category,
        density: vineyard.density || 0,
        altitude: vineyard.altitude,
        country: vineyard.country,
        region: vineyard.region,
        workModifiers: [],
      };

      if (taskId === 'remove-vines') {
        // Work is proportional to intensity, skip if 0
        taskAmount *= (options.replantingIntensity / 100);
        if (taskAmount <= 0) return; 
      }
      
      if (taskId === 'soil-amendment' && options.isOrganicAmendment) {
         taskSpecificFactors.workModifiers.push(0.2); // Add 20% modifier for organic
      }
      
      totalWork += calculateTotalWork(taskAmount, taskSpecificFactors);
    });
    // Ensure total work is at least 1 if any task was selected
    if (totalWork <= 0 && Object.values(options.tasks).some(v => v)) {
        totalWork = 1; 
    }
    // --- End Work Calculation --- 

    // Create a title based on the selected tasks
    const selectedTaskLabels = Object.entries(options.tasks)
      .filter(([_, isSelected]) => isSelected)
      .map(([taskId, _]) => taskId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const tasksString = selectedTaskLabels.length > 1 
      ? `${selectedTaskLabels.length} tasks` 
      : selectedTaskLabels[0] || 'Clearing';
    const title = `Clearing ${vineyard.name} (${tasksString})`;
    
    // Create the activity - amount is now the calculated totalWork
    const activityId = startActivityWithDisplayState('vineyardView', {
      category: WorkCategory.CLEARING,
      amount: Math.max(1, Math.round(totalWork)), // Use calculated work, ensure at least 1
      title,
      targetId: id,
      additionalParams: {
        clearingOptions: options, // Store the specific options used
      }
    });

    if (!activityId) {
      throw new Error('Failed to start clearing activity');
    }

    // Update display state to track the activity ID
    const displayManager = (await import('../lib/game/displayManager')).default;
    displayManager.updateDisplayState('vineyardView', {
      currentActivityId: activityId, 
    });

    // Set up completion callback
    const { setActivityCompletionCallback } = await import('../lib/game/activityManager');
    setActivityCompletionCallback(activityId, async () => {
      try {
        // Get the latest vineyard state before applying updates
        const currentVineyard = getVineyardById(id);
        if (!currentVineyard) {
          throw new Error('Vineyard not found for completion callback');
        }

        // Calculate health improvement based on completed tasks
        let healthImprovement = 0;
        if (options.tasks['clear-vegetation']) healthImprovement += 0.10;
        if (options.tasks['remove-debris']) healthImprovement += 0.05;
        if (options.tasks['soil-amendment']) healthImprovement += 0.15;
        if (options.tasks['remove-vines']) {
          healthImprovement += (options.replantingIntensity / 100) * 0.20;
        }
        
        const newHealth = Math.min(1.0, currentVineyard.vineyardHealth + healthImprovement);
        
        // Prepare updates object
        const updates: Partial<Vineyard> = {
          vineyardHealth: newHealth,
          status: vineyard.grape ? vineyard.status : 'Not Planted', // Keep status or set to Not Planted
          canBeCleared: false, // Mark as cleared for now, adjust later based on game logic
        };
        
        if (options.tasks['remove-vines']) {
          updates.vineAge = Math.max(0, currentVineyard.vineAge * (1 - options.replantingIntensity / 100));
        }
        
        if (options.tasks['soil-amendment']) {
          updates.farmingMethod = options.isOrganicAmendment ? 'Ecological' : 'Conventional';
          if (!options.isOrganicAmendment) {
            updates.organicYears = 0;
          }
        }
        
        // Apply updates to the vineyard
        await updateVineyard(id, updates);
        
        // Console and Toast messages
        const { consoleService } = await import('../components/layout/Console');
        const { toast } = await import('../lib/ui/toast');
        let message = `Clearing of ${currentVineyard.name} complete! Health improved to ${Math.round(newHealth * 100)}%.`;
        if (updates.vineAge !== undefined) message += ` Vine age adjusted to ${updates.vineAge.toFixed(1)} years.`;
        if (updates.farmingMethod) message += ` Farming method set to ${updates.farmingMethod}.`;
        consoleService.success(message);
        toast({ title: "Clearing Complete", description: message, variant: "success" });
        
        // Clear activity from display state
        displayManager.updateDisplayState('vineyardView', { currentActivityId: null });
      } catch (error) {
        console.error('Error in clearing completion callback:', error);
      }
    });

    return getVineyardById(id); // Return potentially updated vineyard state
  } catch (error) {
    console.error('Error clearing vineyard:', error);
    return null;
  }
}

/**
 * Uproot a vineyard, removing all planted grapes and resetting health
 * @param id Vineyard ID to uproot
 * @returns Updated vineyard or null if failed
 */
export async function uprootVineyard(
  id: string
): Promise<Vineyard | null> {
  try {
    const vineyard = getVineyardById(id);
    if (!vineyard) {
      throw new Error(`Vineyard with ID ${id} not found`);
    }

    // Get the activity manager and start an activity
    const { 
      startActivityWithDisplayState, 
      createActivityWithoutDisplayState 
    } = await import('../lib/game/activityManager');
    
    // Create an activity for the uprooting process
    const title = `Uprooting ${vineyard.name}`;
    const activityId = startActivityWithDisplayState('vineyardView', {
      category: 'uprooting',
      amount: vineyard.acres,
      title,
      targetId: id,
      density: vineyard.density || 0,
      additionalParams: {
        altitude: vineyard.altitude,
        country: vineyard.country,
        region: vineyard.region,
      }
    });

    if (!activityId) {
      throw new Error('Failed to start uprooting activity');
    }

    // Update display state to track the activity
    const displayManager = (await import('../lib/game/displayManager')).default;
    displayManager.updateDisplayState('vineyardView', {
      currentActivityId: activityId,
    });

    // Set up completion callback to handle vineyard updates
    const { setActivityCompletionCallback } = await import('../lib/game/activityManager');
    setActivityCompletionCallback(activityId, async () => {
      try {
        // Get constants for default health
        const { DEFAULT_FARMLAND_HEALTH } = await import('../lib/core/constants/gameConstants');
        
        // Update the vineyard with reset values
        await updateVineyard(id, {
          grape: null,
          vineAge: 0,
          density: 0,
          vineyardHealth: DEFAULT_FARMLAND_HEALTH,
          status: 'Not Planted',
          ripeness: 0,
          remainingYield: null,
        });
        
        // Create success message 
        const { consoleService } = await import('../components/layout/Console');
        consoleService.success(`Uprooting of ${vineyard.name} complete! The vineyard is now ready for planting.`);
        
        // Update display state
        displayManager.updateDisplayState('vineyardView', {
          currentActivityId: null,
        });
        
        // Also show a toast notification
        const { toast } = await import('../lib/ui/toast');
        toast({
          title: "Uprooting Complete",
          description: `The vineyard is now ready for planting with new grape varieties.`,
          variant: "success",
        });
      } catch (error) {
        console.error('Error in uprooting completion callback:', error);
      }
    });

    return vineyard;
  } catch (error) {
    console.error('Error uprooting vineyard:', error);
    return null;
  }
} 