import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState, WineBatch } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { loadBuildings, deserializeBuilding } from '@/lib/database/buildingDB';
import { consoleService } from '@/components/layout/Console';
import { saveGameState } from '@/lib/database/gameStateDB';
import { getWineBatchFromDB, removeWineBatchFromDB } from '@/lib/database/wineBatchDB';
import { Season } from '@/lib/core/constants';

/**
 * Check if a storage location is valid for a given resource type and quantity
 * @param storageLocation Storage location ID (format: "ToolName#InstanceNumber")
 * @param resourceType Type of resource to store
 * @param quantity Quantity to store
 * @returns Whether the storage location is valid
 */
export function isValidStorage(
  storageLocation: string,
  resourceType: string,
  quantity: number
): boolean {
  // Empty storage location is invalid
  if (!storageLocation || storageLocation === 'Default Storage') {
    return false;
  }
  
  try {
    // Parse the storage location to get tool name and instance number
    const [toolName, instanceStr] = storageLocation.split('#');
    if (!toolName || !instanceStr) {
      return false;
    }
    
    const instanceNumber = parseInt(instanceStr);
    if (isNaN(instanceNumber)) {
      return false;
    }
    
    // Check all buildings for the storage tool
    const buildings = loadBuildings();
    
    for (const building of buildings) {
      const buildingInstance = deserializeBuilding(building);
      
      // Check all slots and tools
      for (const slot of buildingInstance.slots) {
        for (const tool of slot.tools) {
          // Check if this is the requested tool
          if (tool.name === toolName && tool.instanceNumber === instanceNumber) {
            // Check if the tool supports the resource type
            if (!tool.supportedResources.includes(resourceType)) {
              return false;
            }
            
            // Check if the tool has enough capacity
            return tool.capacity >= quantity;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error validating storage:', error);
    return false;
  }
}

/**
 * Checks if an array of storage locations is valid
 * @param storageLocations Array of storage locations and quantities
 * @param resourceType Type of resource to store
 * @returns True if all storage locations are valid and total quantity is positive
 */
export function areStorageLocationsValid(
  storageLocations: { locationId: string; quantity: number }[],
  resourceType: string
): boolean {
  try {
    // Empty storage locations array is invalid
    if (!storageLocations || storageLocations.length === 0) {
      return false;
    }
    
    // Calculate total quantity
    const totalQuantity = storageLocations.reduce((sum, location) => sum + location.quantity, 0);
    
    // Total quantity must be positive
    if (totalQuantity <= 0) {
      return false;
    }
    
    // Check each storage location
    for (const location of storageLocations) {
      if (!isValidStorage(location.locationId, resourceType, location.quantity)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating storage locations:', error);
    return false;
  }
}

/**
 * Add a new wine batch to the game state
 * @param batch The wine batch to add, or partial data to create a new one
 * @param saveToDb Whether to also save to the database
 * @returns The newly created wine batch or null if failed
 */
export async function addWineBatch(
  batch: Partial<WineBatch>,
  saveToDb: boolean = false
): Promise<WineBatch | null> {
  try {
    const gameState = getGameState();
    const id = batch.id || uuidv4();
    
    // Default to 'grape' stage if not specified
    const stage = batch.stage || 'grape';
    
    // Validate storage if quantity is provided
    if (batch.quantity && batch.quantity > 0 && batch.storageLocations) {
      // Determine resource type based on stage
      let resourceType = 'grape';
      if (stage === 'must' || stage === 'fermentation') {
        resourceType = 'must';
      } else if (stage === 'aging' || stage === 'bottled') {
        resourceType = 'wine';
      }
      
      // Check if storage locations are valid
      if (!areStorageLocationsValid(batch.storageLocations, resourceType)) {
        console.error(`Invalid storage locations for ${batch.quantity} kg of ${resourceType}`);
        return null;
      }

      // Verify total quantity matches batch quantity
      const totalStoredQuantity = batch.storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
      if (totalStoredQuantity < batch.quantity) {
        console.error(`Insufficient storage allocated. Need at least ${Math.ceil(batch.quantity)} kg but only ${Math.ceil(totalStoredQuantity)} kg allocated.`);
        return null;
      }
    }
    
    // Create a new wine batch with the given data and defaults
    const newBatch: WineBatch = {
      id,
      vineyardId: batch.vineyardId || '',
      grapeType: batch.grapeType || 'Chardonnay',
      harvestGameDate: batch.harvestGameDate || {
        week: gameState.week,
        season: gameState.season,
        year: gameState.currentYear
      },
      harvestDateRange: batch.harvestDateRange,
      quantity: batch.quantity || 0,
      quality: batch.quality || 0,
      ripeness: batch.ripeness || 0.5,
      stage,
      ageingStartGameDate: batch.ageingStartGameDate || null,
      ageingDuration: batch.ageingDuration || null,
      storageLocations: batch.storageLocations || [],
      characteristics: batch.characteristics || {
        sweetness: 0.5,
        acidity: 0.5,
        tannins: 0.5,
        body: 0.5,
        spice: 0.5,
        aroma: 0.5
      }
    };
    
    // Save to database
    return await saveWineBatch(newBatch, saveToDb);
  } catch (error) {
    console.error('Error adding wine batch:', error);
    return null;
  }
}

/**
 * Save an existing wine batch
 * @param batch The wine batch to save
 * @param saveToDb Whether to also save to the database
 * @returns The saved wine batch or null if failed
 */
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
export function getWineBatch(id: string): WineBatch | null {
  return getWineBatchFromDB(id);
}

/**
 * Update an existing wine batch
 * @param id The ID of the wine batch to update
 * @param updates The updates to apply
 * @param saveToDb Whether to also save to the database
 * @returns The updated wine batch or null if not found
 */
export async function updateWineBatch(
  id: string,
  updates: Partial<WineBatch>,
  saveToDb: boolean = false
): Promise<WineBatch | null> {
  try {
    // Get the existing wine batch
    const batch = getWineBatchFromDB(id);
    
    if (!batch) {
      console.error(`Wine batch with ID ${id} not found`);
      return null;
    }
    
    // Create updated wine batch
    const updatedBatch = {
      ...batch,
      ...updates
    };
    
    // Save to database
    return await saveWineBatch(updatedBatch, saveToDb);
  } catch (error) {
    console.error('Error updating wine batch:', error);
    return null;
  }
}

/**
 * Remove a wine batch by ID
 * @param id The ID of the wine batch to remove
 * @param saveToDb Whether to also save to the database
 * @returns True if removed, false if not found
 */
export async function removeWineBatch(
  id: string,
  saveToDb: boolean = false
): Promise<boolean> {
  return await removeWineBatchFromDB(id, saveToDb);
}

/**
 * Creates a new wine batch from a harvested vineyard
 * @param vineyardId The ID of the harvested vineyard
 * @param grapeType The type of grape harvested
 * @param quantity The quantity of grapes harvested in kg
 * @param quality The quality of the harvested grapes (0-1)
 * @param storageLocations Array of storage locations and their quantities
 * @param saveToDb Whether to also save to the database
 * @param ripeness The ripeness of the grapes (0-1)
 * @returns The newly created wine batch or null if failed
 */
export async function createWineBatchFromHarvest(
  vineyardId: string,
  grapeType: GrapeVariety,
  quantity: number,
  quality: number,
  storageLocations: { locationId: string; quantity: number }[],
  saveToDb: boolean = false,
  ripeness: number = 0.5
): Promise<WineBatch | null> {
  try {
    // Validate storage locations
    if (!areStorageLocationsValid(storageLocations, 'grape')) {
      consoleService.error(`Cannot harvest: Invalid or insufficient storage for ${quantity} kg of grapes.`);
      return null;
    }

    // Get total storage space available
    const totalStoredQuantity = storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    
    // Adjust quantity to fit available storage if needed
    const adjustedQuantity = Math.min(quantity, totalStoredQuantity);
    
    const gameState = getGameState();
    const currentDate = {
      week: gameState.week,
      season: gameState.season,
      year: gameState.currentYear
    };
    
    // Create basic characteristics based on grape type and quality
    const characteristics = generateInitialCharacteristics(grapeType, quality);
    
    // Check for existing batches from the same vineyard and grape type in the same storage locations
    let existingBatchesPerStorage: Record<string, WineBatch[]> = {};
    
    // Group existing batches by storage location
    for (const storage of storageLocations) {
      const locationId = storage.locationId;
      existingBatchesPerStorage[locationId] = [];
      
      // Find existing batches that match our criteria for this storage location
      for (const batch of gameState.wineBatches) {
        if (batch.vineyardId === vineyardId && 
            batch.grapeType === grapeType && 
            batch.stage === 'grape' &&
            batch.storageLocations.some(loc => loc.locationId === locationId)) {
          existingBatchesPerStorage[locationId].push(batch);
        }
      }
    }
    
    // Keep track of which batches were updated
    const updatedBatchIds = new Set<string>();
    // Handle each storage location separately
    for (const storage of storageLocations) {
      const locationId = storage.locationId;
      const existingBatches = existingBatchesPerStorage[locationId] || [];
      
      // Calculate proportion of total quantity for this storage location
      const storageQuantity = Math.min(
        storage.quantity,
        (adjustedQuantity * storage.quantity) / totalStoredQuantity
      );
      
      if (existingBatches.length > 0) {
        // Use the first batch as our update target
        const batchToUpdate = existingBatches[0];
        
        // Fix the weighted average calculation when combining batches
        const totalQuantity = batchToUpdate.quantity + storageQuantity;
        const existingWeight = batchToUpdate.quantity / totalQuantity;
        const newWeight = storageQuantity / totalQuantity;

        // Calculate weighted average for quality
        const weightedQuality = (batchToUpdate.quality * existingWeight) + (quality * newWeight);

        // Calculate weighted average for ripeness
        const weightedRipeness = (batchToUpdate.ripeness || 0.5) * existingWeight + (ripeness * newWeight);
        
        // Update characteristics with weighted averages too
        const updatedCharacteristics = { ...batchToUpdate.characteristics };
        if (updatedCharacteristics) {
          Object.keys(updatedCharacteristics).forEach(key => {
            const charKey = key as keyof typeof updatedCharacteristics;
            const newCharValue = characteristics[charKey];
            const existingCharValue = updatedCharacteristics[charKey] || 0.5;
            
            updatedCharacteristics[charKey] = 
              (existingCharValue * existingWeight + newCharValue * newWeight);
          });
        }
        
        // Update harvest date - convert to array if it's not already
        let harvestDates: GameDate[] = [];
        if (Array.isArray(batchToUpdate.harvestGameDate)) {
          harvestDates = [...batchToUpdate.harvestGameDate];
        } else {
          harvestDates = [batchToUpdate.harvestGameDate];
        }
        
        // Add current date if it's not already included
        const alreadyHasDate = harvestDates.some(date => 
          date.week === currentDate.week && 
          date.season === currentDate.season && 
          date.year === currentDate.year
        );
        
        if (!alreadyHasDate) {
          harvestDates.push(currentDate);
        }
        
        // Sort dates chronologically (assuming year, season, week order)
        harvestDates.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.season !== b.season) {
            const seasonOrder: Record<Season, number> = { 
              'Spring': 0, 
              'Summer': 1, 
              'Fall': 2, 
              'Winter': 3 
            };
            return seasonOrder[a.season as Season] - seasonOrder[b.season as Season];
          }
          return a.week - b.week;
        });
        
        // Calculate date range for display
        const harvestDateRange = {
          first: harvestDates[0],
          last: harvestDates[harvestDates.length - 1]
        };
        
        // Update storage location quantity
        const updatedStorageLocations = [...batchToUpdate.storageLocations];
        const locationIndex = updatedStorageLocations.findIndex(loc => loc.locationId === locationId);
        
        if (locationIndex >= 0) {
          updatedStorageLocations[locationIndex].quantity += storageQuantity;
        } else {
          updatedStorageLocations.push({
            locationId,
            quantity: storageQuantity
          });
        }
        
        // Update the batch
        await updateWineBatch(batchToUpdate.id, {
          quantity: totalQuantity,
          quality: weightedQuality,
          ripeness: weightedRipeness,
          harvestGameDate: harvestDates,
          harvestDateRange,
          characteristics: updatedCharacteristics as WineBatch['characteristics'],
          storageLocations: updatedStorageLocations
        }, saveToDb);
        
        updatedBatchIds.add(batchToUpdate.id);
        
        // Remove other batches if they exist in the same storage (should be consolidated into one)
        if (existingBatches.length > 1) {
          for (let i = 1; i < existingBatches.length; i++) {
            if (!updatedBatchIds.has(existingBatches[i].id)) {
              await removeWineBatch(existingBatches[i].id, saveToDb);
            }
          }
        }
      } else {
        // No existing batch - create a new one for this storage location
        const newBatch = await addWineBatch({
          vineyardId,
          grapeType,
          quantity: storageQuantity,
          quality,
          ripeness,
          storageLocations: [{
            locationId: storage.locationId,
            quantity: storageQuantity
          }],
          stage: 'grape',
          harvestGameDate: [currentDate],
          harvestDateRange: {
            first: currentDate,
            last: currentDate
          },
          characteristics
        } as WineBatch, saveToDb);
        
        if (newBatch) {
          updatedBatchIds.add(newBatch.id);
        }
      }
    }
    
    // Get the first updated batch for return value
    const firstBatchId = Array.from(updatedBatchIds)[0];
    if (firstBatchId) {
      return getWineBatch(firstBatchId);
    }
    
    return null;
  } catch (error) {
    console.error('Error creating wine batch from harvest:', error);
    consoleService.error('Failed to create wine batch from harvest');
    return null;
  }
}

/**
 * Helper function to generate initial wine characteristics based on grape type and quality
 * @param grapeType The type of grape
 * @param quality The quality of the grapes (0-1)
 * @returns Wine characteristics
 */
function generateInitialCharacteristics(grapeType: GrapeVariety, quality: number) {
  // These values are placeholders and should be adjusted based on grape variety
  let characteristics = {
    sweetness: 0.5,
    acidity: 0.5,
    tannins: 0.3,
    body: 0.5,
    spice: 0.3,
    aroma: 0.5
  };
  
  // Adjust characteristics based on grape type
  switch (grapeType) {
    case 'Chardonnay':
      characteristics.sweetness = 0.4 + (quality * 0.2);
      characteristics.acidity = 0.6 + (quality * 0.2);
      characteristics.body = 0.5 + (quality * 0.3);
      characteristics.aroma = 0.6 + (quality * 0.3);
      characteristics.tannins = 0.1 + (quality * 0.1);
      characteristics.spice = 0.2 + (quality * 0.2);
      break;
    case 'Cabernet Sauvignon':
      characteristics.sweetness = 0.2 + (quality * 0.1);
      characteristics.acidity = 0.6 + (quality * 0.2);
      characteristics.tannins = 0.7 + (quality * 0.2);
      characteristics.body = 0.7 + (quality * 0.2);
      characteristics.spice = 0.5 + (quality * 0.3);
      characteristics.aroma = 0.5 + (quality * 0.3);
      break;
    case 'Merlot':
      characteristics.sweetness = 0.3 + (quality * 0.2);
      characteristics.acidity = 0.5 + (quality * 0.1);
      characteristics.tannins = 0.6 + (quality * 0.2);
      characteristics.body = 0.6 + (quality * 0.2);
      characteristics.spice = 0.4 + (quality * 0.2);
      characteristics.aroma = 0.5 + (quality * 0.3);
      break;
    case 'Sauvignon Blanc':
      characteristics.sweetness = 0.3 + (quality * 0.1);
      characteristics.acidity = 0.7 + (quality * 0.2);
      characteristics.body = 0.4 + (quality * 0.2);
      characteristics.aroma = 0.7 + (quality * 0.2);
      characteristics.tannins = 0.1 + (quality * 0.1);
      characteristics.spice = 0.3 + (quality * 0.2);
      break;
    // Add more grape varieties as needed
    default:
      // Scale all characteristics with quality
      Object.keys(characteristics).forEach(key => {
        characteristics[key as keyof typeof characteristics] = 0.3 + (quality * 0.5);
      });
  }
  
  // Ensure values are in valid range (0-1)
  Object.keys(characteristics).forEach(key => {
    characteristics[key as keyof typeof characteristics] = Math.max(0, Math.min(1, characteristics[key as keyof typeof characteristics]));
  });
  
  return characteristics;
} 