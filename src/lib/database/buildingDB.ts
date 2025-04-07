import { getGameState, updateGameState, Building as GameStateBuilding } from '@/gameState';
import { Building, initializeToolInstanceCounts } from '@/lib/game/building';
import { saveGameState } from './gameStateDB';

// Interface for serialized building data for storage
export interface SerializedBuilding {
  id: string;
  name: string;
  level: number;
  slots: {
    id: string;
    tools: any[]; // Tool objects with name, capacity, etc.
    currentWeight: number;
  }[];
}

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

export const getBuildingByName = (name: string): SerializedBuilding | undefined => {
  return loadBuildings().find(b => b.name === name);
};

export const deserializeBuilding = (serializedBuilding: SerializedBuilding): Building => {
  // Create new building instance with name and level
  const building = new Building(
    serializedBuilding.name as any,
    serializedBuilding.level
  );
  
  // Store the ID from the serialized building
  building.id = serializedBuilding.id;
  
  // Now that the building is fully initialized, set its slots
  building.slots = serializedBuilding.slots;
  
  return building;
};

export const serializeBuilding = (building: Building): SerializedBuilding => {
  return {
    id: building.id,
    name: building.name,
    level: building.level,
    slots: building.slots
  };
};

export const initializeToolInstanceCountsFromStorage = async (): Promise<void> => {
  try {
    const buildings = loadBuildings();
    
    // Convert to Building instances
    const validatedBuildings = buildings.map(b => deserializeBuilding(b));
    
    // Initialize tool instance counts
    initializeToolInstanceCounts(validatedBuildings);
  } catch (error) {
    console.error('Error initializing tool instance counts:', error);
  }
}; 