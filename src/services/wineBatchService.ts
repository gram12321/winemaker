import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState, WineBatch } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { saveGameState } from '@/lib/database/gameStateService';
import { loadBuildings, deserializeBuilding } from '@/lib/database/buildingService';
import { consoleService } from '@/components/layout/Console';

/**
 * Check if a storage location is valid for a given resource type and quantity
 * @param storageLocation Storage location ID
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
            // TODO: Calculate used capacity by checking existing batches
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
 * Check if storage locations are valid for a given resource type and quantities
 * @param storageLocations Array of storage locations and their quantities
 * @param resourceType Type of resource to store
 * @returns Whether all storage locations are valid
 */
export function areStorageLocationsValid(
  storageLocations: { locationId: string; quantity: number }[],
  resourceType: string
): boolean {
  try {
    // Check if there are any storage locations
    if (!storageLocations || storageLocations.length === 0) return false;
    
    // Check if total quantity is greater than 0
    const totalQuantity = storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    if (totalQuantity <= 0) return false;

    // Check each storage location
    for (const { locationId, quantity } of storageLocations) {
      if (!isValidStorage(locationId, resourceType, quantity)) {
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
 * @returns The newly created wine batch
 */
export async function addWineBatch(
  batch: Partial<WineBatch>,
  saveToDb: boolean = false
): Promise<WineBatch> {
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
        throw new Error(`Invalid storage locations for ${batch.quantity} kg of ${resourceType}`);
      }

      // Verify total quantity matches batch quantity
      const totalStoredQuantity = batch.storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
      if (totalStoredQuantity < batch.quantity) {
        throw new Error(`Insufficient storage allocated. Need at least ${Math.ceil(batch.quantity)} kg but only ${Math.ceil(totalStoredQuantity)} kg allocated.`);
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
      quantity: batch.quantity || 0,
      quality: batch.quality || 0,
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
    
    // Update game state
    const updatedWineBatches = [...gameState.wineBatches, newBatch];
    updateGameState({ wineBatches: updatedWineBatches });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return newBatch;
  } catch (error) {
    console.error('Error adding wine batch:', error);
    throw error;
  }
}

/**
 * Get a wine batch by ID
 * @param id The ID of the wine batch to retrieve
 * @returns The wine batch or null if not found
 */
export function getWineBatch(id: string): WineBatch | null {
  try {
    const gameState = getGameState();
    return gameState.wineBatches.find(batch => batch.id === id) || null;
  } catch (error) {
    console.error('Error getting wine batch:', error);
    throw error;
  }
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
    const gameState = getGameState();
    const batchIndex = gameState.wineBatches.findIndex(batch => batch.id === id);
    
    if (batchIndex === -1) {
      console.error(`Wine batch with ID ${id} not found`);
      return null;
    }
    
    // Create updated wine batch
    const updatedBatch = {
      ...gameState.wineBatches[batchIndex],
      ...updates
    };
    
    // Update game state
    const updatedWineBatches = [...gameState.wineBatches];
    updatedWineBatches[batchIndex] = updatedBatch;
    
    updateGameState({ wineBatches: updatedWineBatches });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return updatedBatch;
  } catch (error) {
    console.error('Error updating wine batch:', error);
    throw error;
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
  try {
    const gameState = getGameState();
    const batchIndex = gameState.wineBatches.findIndex(batch => batch.id === id);
    
    if (batchIndex === -1) {
      console.error(`Wine batch with ID ${id} not found`);
      return false;
    }
    
    // Update game state
    const updatedWineBatches = gameState.wineBatches.filter(batch => batch.id !== id);
    updateGameState({ wineBatches: updatedWineBatches });
    
    // Save to database if requested
    if (saveToDb) {
      await saveGameState();
    }
    
    return true;
  } catch (error) {
    console.error('Error removing wine batch:', error);
    throw error;
  }
}

/**
 * Creates a new wine batch from a harvested vineyard
 * @param vineyardId The ID of the harvested vineyard
 * @param grapeType The type of grape harvested
 * @param quantity The quantity of grapes harvested in kg
 * @param quality The quality of the harvested grapes (0-1)
 * @param storageLocations Array of storage locations and their quantities
 * @param saveToDb Whether to also save to the database
 * @returns The newly created wine batch
 * @throws Error if storage locations are invalid
 */
export async function createWineBatchFromHarvest(
  vineyardId: string,
  grapeType: GrapeVariety,
  quantity: number,
  quality: number,
  storageLocations: { locationId: string; quantity: number }[],
  saveToDb: boolean = false
): Promise<WineBatch> {
  try {
    // Validate storage locations
    if (!areStorageLocationsValid(storageLocations, 'grape')) {
      const error = new Error(`Invalid storage locations for harvest`);
      consoleService.error(`Cannot harvest: Invalid or insufficient storage for ${quantity} kg of grapes.`);
      throw error;
    }

    // Verify total quantity matches harvested quantity
    const totalStoredQuantity = storageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    if (totalStoredQuantity < quantity) {
      throw new Error(`Insufficient storage allocated. Need at least ${Math.ceil(quantity)} kg but only ${Math.ceil(totalStoredQuantity)} kg allocated.`);
    }
    
    const gameState = getGameState();
    
    // Create basic characteristics based on grape type and quality
    const characteristics = generateInitialCharacteristics(grapeType, quality);
    
    // Create new wine batch
    return await addWineBatch({
      vineyardId,
      grapeType,
      quantity,
      quality,
      storageLocations,
      stage: 'grape',
      harvestGameDate: {
        week: gameState.week,
        season: gameState.season,
        year: gameState.currentYear
      },
      characteristics
    }, saveToDb);
  } catch (error) {
    console.error('Error creating wine batch from harvest:', error);
    throw error;
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
        characteristics[key] = 0.3 + (quality * 0.5);
      });
  }
  
  // Ensure values are in valid range (0-1)
  Object.keys(characteristics).forEach(key => {
    characteristics[key] = Math.max(0, Math.min(1, characteristics[key]));
  });
  
  return characteristics;
} 