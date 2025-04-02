import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState, WineBatch } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { saveGameState } from '@/lib/database/gameStateService';

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
      stage: batch.stage || 'grape',
      ageingStartGameDate: batch.ageingStartGameDate || null,
      ageingDuration: batch.ageingDuration || null,
      storageLocation: batch.storageLocation || 'Default Storage',
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
 * @param storageLocation Where the grapes are stored
 * @param saveToDb Whether to also save to the database
 * @returns The newly created wine batch
 */
export async function createWineBatchFromHarvest(
  vineyardId: string,
  grapeType: GrapeVariety,
  quantity: number,
  quality: number,
  storageLocation: string = 'Default Storage',
  saveToDb: boolean = false
): Promise<WineBatch> {
  try {
    const gameState = getGameState();
    
    // Create basic characteristics based on grape type and quality
    const characteristics = generateInitialCharacteristics(grapeType, quality);
    
    // Create new wine batch
    return await addWineBatch({
      vineyardId,
      grapeType,
      quantity,
      quality,
      storageLocation,
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