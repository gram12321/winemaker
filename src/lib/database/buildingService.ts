/**
 * Building Service
 * Manages storing and retrieving building data
 */

import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState } from '@/gameState';
import { consoleService } from '@/components/layout/Console';
import { Building, BuildingType, Tool, initializeToolInstanceCounts } from '@/lib/game/building';
import { StorageKeys, saveToStorage, loadFromStorage } from './storageService';
import { saveGameState } from './gameStateService';
import { CONSTRUCTION_WORK_FACTOR } from '@/lib/core/constants';

// Store serialized building data
export interface SerializedBuilding {
  id: string;
  name: BuildingType;
  level: number;
  slots: {
    id: string;
    tools: Tool[];
    currentWeight: number;
  }[];
}

/**
 * Load buildings from storage
 */
export const loadBuildings = (): SerializedBuilding[] => {
  try {
    // Try loading from storage first
    const storedBuildings = loadFromStorage<SerializedBuilding[]>(StorageKeys.BUILDINGS);
    if (storedBuildings) {
      // Convert to Building instances to validate structure
      const validatedBuildings = storedBuildings.map(b => deserializeBuilding(b));
      
      // Initialize tool instance counts from loaded buildings
      initializeToolInstanceCounts(validatedBuildings);
      
      // Convert back to serialized form
      return validatedBuildings.map(b => serializeBuilding(b));
    }
    
    // If not in storage, get from game state
    const gameState = getGameState();
    return gameState.buildings || [];
  } catch (error) {
    console.error('Error loading buildings:', error);
    return [];
  }
};

/**
 * Save buildings to game state
 * @param buildings Array of buildings to save
 */
export const saveBuildings = async (buildings: SerializedBuilding[]): Promise<void> => {
  // Update game state
  updateGameState({
    buildings
  });
  
  // Save to persistent storage
  saveToStorage(StorageKeys.BUILDINGS, buildings);
  
  // Save game state to persistent storage
  await saveGameState();
};

/**
 * Get a building by name
 * @param name Name of the building to find
 */
export const getBuildingByName = (name: BuildingType): SerializedBuilding | undefined => {
  return loadBuildings().find(b => b.name === name);
};

/**
 * Convert a serialized building to a Building instance
 * @param serializedBuilding Serialized building data
 */
export const deserializeBuilding = (serializedBuilding: SerializedBuilding): Building => {
  const building = new Building(
    serializedBuilding.name,
    serializedBuilding.level
  );
  
  // Replace the auto-generated slots with the stored ones
  building.slots = serializedBuilding.slots;
  
  return building;
};

/**
 * Convert a Building instance to serialized format
 * @param building Building instance
 */
export const serializeBuilding = (building: Building): SerializedBuilding => {
  return {
    id: building.id,
    name: building.name,
    level: building.level,
    slots: building.slots
  };
};

/**
 * Start building construction
 * @param buildingType The type of building to construct
 */
export const startBuildingConstruction = async (
  buildingType: BuildingType
): Promise<boolean> => {
  const buildings = loadBuildings();
  const player = getGameState().player;
  
  // Check if building already exists
  if (buildings.some(b => b.name === buildingType)) {
    consoleService.error(`${buildingType} already exists.`);
    return false;
  }
  
  // Get building cost
  const buildingInfo = BUILDINGS.find(b => b.type === buildingType);
  if (!buildingInfo) {
    consoleService.error(`Unknown building type: ${buildingType}`);
    return false;
  }
  
  // Check if player has enough money
  if (!player || player.money < buildingInfo.buildCost) {
    consoleService.error(`Not enough money to build ${buildingType}. Cost: €${buildingInfo.buildCost.toLocaleString()}`);
    return false;
  }
  
  // Create building instance
  const { Building } = await import('@/lib/game/building');
  const building = new Building(buildingType, 1, buildingInfo.slots);
  
  // Add to buildings list
  const updatedBuildings = [...buildings, serializeBuilding(building)];
  
  // Deduct money from player
  updateGameState({
    player: {
      ...player,
      money: player.money - buildingInfo.buildCost
    }
  });
  
  // Save buildings
  await saveBuildings(updatedBuildings);
  
  // Log success message
  consoleService.success(
    `Construction of ${buildingType} has been completed. Cost: €${buildingInfo.buildCost.toLocaleString()}. Capacity: ${buildingInfo.slots} slots.`
  );
  
  return true;
};

/**
 * Upgrade a building
 * @param buildingName Name of the building to upgrade
 */
export const upgradeBuilding = async (buildingName: BuildingType): Promise<boolean> => {
  const buildings = loadBuildings();
  const player = getGameState().player;
  
  // Find building
  const buildingIndex = buildings.findIndex(b => b.name === buildingName);
  if (buildingIndex === -1) {
    consoleService.error(`${buildingName} does not exist and cannot be upgraded.`);
    return false;
  }
  
  // Convert to Building instance
  const building = deserializeBuilding(buildings[buildingIndex]);
  
  // Check if player has enough money
  const cost = building.getUpgradeCost();
  
  if (!player || player.money < cost) {
    consoleService.error(`Not enough money to upgrade ${buildingName}. Cost: €${cost.toLocaleString()}`);
    return false;
  }
  
  // Deduct money from player
  updateGameState({
    player: {
      ...player,
      money: player.money - cost
    }
  });
  
  // Add to task queue (will be implemented later)
  // For now, upgrade the building immediately
  building.upgrade();
  
  // Update buildings list
  const updatedBuildings = [...buildings];
  updatedBuildings[buildingIndex] = serializeBuilding(building);
  
  // Save to game state
  await saveBuildings(updatedBuildings);
  
  // Log message
  consoleService.success(
    `Upgrade of ${buildingName} to level ${building.level} has been completed. ` +
    `Cost: €${cost.toLocaleString()}. New capacity: ${building.calculateCapacity()} slots.`
  );
  
  return true;
};

/**
 * Add a tool to a building
 * @param buildingName Name of the building
 * @param toolName Name of the tool to add
 */
export const addToolToBuilding = async (
  buildingName: BuildingType,
  toolName: string
): Promise<boolean> => {
  const buildings = loadBuildings();
  const player = getGameState().player;
  
  // Find building
  const buildingIndex = buildings.findIndex(b => b.name === buildingName);
  if (buildingIndex === -1) {
    consoleService.error(`${buildingName} does not exist.`);
    return false;
  }
  
  // Convert to Building instance
  const building = deserializeBuilding(buildings[buildingIndex]);
  
  // Create new tool
  const { createTool } = await import('@/lib/game/building');
  const newTool = createTool(toolName);
  
  if (!newTool) {
    consoleService.error(`Tool ${toolName} does not exist.`);
    return false;
  }
  
  // Check if player has enough money
  if (!player || player.money < newTool.cost) {
    consoleService.error(`Not enough money to purchase ${toolName}. Cost: €${newTool.cost.toLocaleString()}`);
    return false;
  }
  
  // Try to add the tool
  const success = building.addTool(newTool);
  
  if (!success) {
    consoleService.error(`Cannot add ${toolName} to ${buildingName}. No suitable slot available.`);
    return false;
  }
  
  // Deduct money from player
  updateGameState({
    player: {
      ...player,
      money: player.money - newTool.cost
    }
  });
  
  // Update buildings list
  const updatedBuildings = [...buildings];
  updatedBuildings[buildingIndex] = serializeBuilding(building);
  
  // Save to game state
  await saveBuildings(updatedBuildings);
  
  // Log message
  consoleService.success(
    `${toolName} #${newTool.instanceNumber} added to ${buildingName}. ` +
    `Cost: €${newTool.cost.toLocaleString()}.`
  );
  
  return true;
};

/**
 * Sell a tool from a building
 * @param buildingName Name of the building
 * @param slotIndex Index of the slot containing the tool
 */
export const sellToolFromBuilding = async (
  buildingName: BuildingType,
  slotIndex: number
): Promise<boolean> => {
  const buildings = loadBuildings();
  const player = getGameState().player;
  
  // Find building
  const buildingIndex = buildings.findIndex(b => b.name === buildingName);
  if (buildingIndex === -1) {
    consoleService.error(`${buildingName} does not exist.`);
    return false;
  }
  
  // Convert to Building instance
  const building = deserializeBuilding(buildings[buildingIndex]);
  
  // Try to sell the tool
  const result = building.sellToolFromSlot(slotIndex);
  
  if (!result) {
    consoleService.error(`No tool found in slot ${slotIndex + 1} of ${buildingName}.`);
    return false;
  }
  
  // Add refund to player's money
  if (player) {
    updateGameState({
      player: {
        ...player,
        money: player.money + result.refundAmount
      }
    });
  }
  
  // Update buildings list
  const updatedBuildings = [...buildings];
  updatedBuildings[buildingIndex] = serializeBuilding(building);
  
  // Save to game state
  await saveBuildings(updatedBuildings);
  
  // Log message
  consoleService.success(
    `Sold ${result.tool.name} #${result.tool.instanceNumber} from ${buildingName}. ` +
    `Refund: €${result.refundAmount.toLocaleString()} (50% of original price).`
  );
  
  return true;
};

/**
 * Initializes the tool instance counts from all buildings
 * Should be called during application startup
 */
export const initializeToolInstanceCountsFromStorage = async (): Promise<void> => {
  try {
    const buildings = loadBuildings();
    
    // Convert to Building instances
    const validatedBuildings = buildings.map(b => deserializeBuilding(b));
    
    // Import and initialize tool instance counts
    const { initializeToolInstanceCounts } = await import('@/lib/game/building');
    initializeToolInstanceCounts(validatedBuildings);
    
    console.log('Tool instance counts initialized from storage');
  } catch (error) {
    console.error('Error initializing tool instance counts:', error);
  }
}; 