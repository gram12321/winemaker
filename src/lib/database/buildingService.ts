/**
 * Building Service
 * Manages storing and retrieving building data
 */

import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState, Building as GameStateBuilding } from '@/gameState';
import { consoleService } from '@/components/layout/Console';
import { Building, Tool, initializeToolInstanceCounts } from '@/lib/game/building';
import { BuildingType, BUILDING_CONFIG } from '@/lib/core/constants';
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
 * Load buildings from game state
 */
export const loadBuildings = (): SerializedBuilding[] => {
  try {
    // Get from game state
    const gameState = getGameState();
    // Force cast to SerializedBuilding[] since the actual structure may differ
    const buildings = gameState.buildings as unknown as SerializedBuilding[];
    
    // Ensure tool instance counts are initialized
    if (buildings && buildings.length > 0) {
      // Convert to Building instances temporarily to initialize tool counts
      const buildingInstances = buildings.map(b => deserializeBuilding(b));
      initializeToolInstanceCounts(buildingInstances);
    }
    
    return buildings;
  } catch (error) {
    console.error('Error loading buildings:', error);
    return [];
  }
};

/**
 * Save buildings to game state and Firebase
 */
export const saveBuildings = async (buildings: SerializedBuilding[]): Promise<void> => {
  try {
    // Update game state with the buildings (force cast to match gameState types)
    updateGameState({
      buildings: buildings as unknown as GameStateBuilding[]
    });
    
    // Save game state to Firebase
    await saveGameState();
  } catch (error) {
    console.error('Error saving buildings:', error);
  }
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
  // Create new building instance with name and level
  const building = new Building(
    serializedBuilding.name,
    serializedBuilding.level
  );
  
  // Store the ID from the serialized building
  building.id = serializedBuilding.id;
  
  // Now that the building is fully initialized, set its slots
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
  
  // Get building config
  const buildingConfig = BUILDING_CONFIG[buildingType];
  if (!buildingConfig) {
    consoleService.error(`Unknown building type: ${buildingType}`);
    return false;
  }
  
  // Check if player has enough money
  if (!player || player.money < buildingConfig.baseCost) {
    consoleService.error(`Not enough money to build ${buildingType}. Cost: €${buildingConfig.baseCost.toLocaleString()}`);
    return false;
  }
  
  try {
    // Create building instance
    const building = new Building(buildingType, 1);
    
    // Add to buildings list
    const serializedBuilding = serializeBuilding(building);
    const updatedBuildings = [...buildings, serializedBuilding];
    
    // Deduct money from player
    updateGameState({
      player: {
        ...player,
        money: player.money - buildingConfig.baseCost
      }
    });
    
    // Save buildings
    await saveBuildings(updatedBuildings);
    
    // Log success message
    consoleService.success(
      `Construction of ${buildingType} has been completed. Cost: €${buildingConfig.baseCost.toLocaleString()}. Capacity: ${building.calculateCapacity()} slots.`
    );
    
    return true;
  } catch (error) {
    console.error(`Error constructing ${buildingType}:`, error);
    consoleService.error(`Failed to construct ${buildingType}. ${error}`);
    return false;
  }
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