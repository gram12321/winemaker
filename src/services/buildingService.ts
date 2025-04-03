/**
 * Building Service
 * Handles building-related business logic
 */

import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState } from '@/gameState';
import { consoleService } from '@/components/layout/Console';
import { Building } from '@/lib/game/building';
import { BuildingType, BUILDING_CONFIG } from '@/lib/core/constants';
import { 
  loadBuildings, 
  saveBuildings, 
  deserializeBuilding, 
  serializeBuilding, 
  SerializedBuilding 
} from '@/lib/database/buildingDB';

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