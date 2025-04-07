import { v4 as uuidv4 } from 'uuid';
import { 
  BuildingType, 
  BUILDING_CONFIG,
  ToolCategory,
  UPGRADE_COST_FACTOR
} from '@/lib/core/constants';

/**
 * Interface for a tool slot within a building
 */
export interface ToolSlot {
  id: string;
  tools: Tool[];
  currentWeight: number;
}

/**
 * Interface for a tool that can be purchased and used in a building
 */
export interface Tool {
  id: string;
  name: string;
  buildingType: BuildingType;
  speedBonus: number;
  cost: number;
  capacity: number;
  supportedResources: string[];
  weight: number;
  validTasks: ToolCategory[];
  toolType: string;
  assignable: boolean;
  instanceNumber: number;
}

/**
 * Base tool definitions that can be created
 */
export const TOOLS: Record<string, Omit<Tool, 'id' | 'instanceNumber'>> = {
  'Basic Planting Tools': {
    name: 'Basic Planting Tools',
    buildingType: BuildingType.TOOL_SHED,
    speedBonus: 1.0,
    cost: 5000,
    capacity: 0,
    supportedResources: [],
    weight: 1,
    validTasks: [ToolCategory.PLANTING],
    toolType: 'manual',
    assignable: true
  },
  'Advanced Planting Tools': {
    name: 'Advanced Planting Tools',
    buildingType: BuildingType.TOOL_SHED,
    speedBonus: 1.5,
    cost: 15000,
    capacity: 0,
    supportedResources: [],
    weight: 2,
    validTasks: [ToolCategory.PLANTING],
    toolType: 'manual',
    assignable: true
  },
  'Basic Harvesting Tools': {
    name: 'Basic Harvesting Tools',
    buildingType: BuildingType.TOOL_SHED,
    speedBonus: 1.0,
    cost: 7500,
    capacity: 0,
    supportedResources: [],
    weight: 1,
    validTasks: [ToolCategory.HARVESTING],
    toolType: 'manual',
    assignable: true
  },
  'Advanced Harvesting Tools': {
    name: 'Advanced Harvesting Tools',
    buildingType: BuildingType.TOOL_SHED,
    speedBonus: 1.8,
    cost: 25000,
    capacity: 0,
    supportedResources: [],
    weight: 3,
    validTasks: [ToolCategory.HARVESTING],
    toolType: 'machine',
    assignable: true
  },
  'Small Crusher': {
    name: 'Small Crusher',
    buildingType: BuildingType.WINERY,
    speedBonus: 1.2,
    cost: 50000,
    capacity: 5000,
    supportedResources: ['grape'],
    weight: 4,
    validTasks: [ToolCategory.CRUSHING],
    toolType: 'machine',
    assignable: false
  },
  'Large Crusher': {
    name: 'Large Crusher',
    buildingType: BuildingType.WINERY,
    speedBonus: 2.0,
    cost: 150000,
    capacity: 20000,
    supportedResources: ['grape'],
    weight: 7,
    validTasks: [ToolCategory.CRUSHING],
    toolType: 'machine',
    assignable: false
  },
  'Fermentation Tank': {
    name: 'Fermentation Tank',
    buildingType: BuildingType.WINERY,
    speedBonus: 1.0,
    cost: 75000,
    capacity: 10000,
    supportedResources: ['must'],
    weight: 5,
    validTasks: [ToolCategory.FERMENTATION],
    toolType: 'storage',
    assignable: false
  },
  'Temperature-Controlled Tank': {
    name: 'Temperature-Controlled Tank',
    buildingType: BuildingType.WINERY,
    speedBonus: 1.5,
    cost: 150000,
    capacity: 15000,
    supportedResources: ['must'],
    weight: 6,
    validTasks: [ToolCategory.FERMENTATION],
    toolType: 'storage',
    assignable: false
  },
  'Oak Barrel': {
    name: 'Oak Barrel',
    buildingType: BuildingType.WINE_CELLAR,
    speedBonus: 1.2,
    cost: 15000,
    capacity: 225,
    supportedResources: ['wine'],
    weight: 2,
    validTasks: [ToolCategory.FERMENTATION],
    toolType: 'storage',
    assignable: false
  },
  'Storage Rack': {
    name: 'Storage Rack',
    buildingType: BuildingType.WAREHOUSE,
    speedBonus: 1.0,
    cost: 10000,
    capacity: 5000,
    supportedResources: ['grape'],
    weight: 3,
    validTasks: [ToolCategory.GENERAL],
    toolType: 'storage',
    assignable: false
  },
  'Refrigerated Storage': {
    name: 'Refrigerated Storage',
    buildingType: BuildingType.WAREHOUSE,
    speedBonus: 1.0,
    cost: 35000,
    capacity: 10000,
    supportedResources: ['grape'],
    weight: 5,
    validTasks: [ToolCategory.GENERAL],
    toolType: 'storage',
    assignable: false
  },
  'Bottle Rack': {
    name: 'Bottle Rack',
    buildingType: BuildingType.WINE_CELLAR,
    speedBonus: 1.0,
    cost: 20000,
    capacity: 1000,
    supportedResources: ['bottle'],
    weight: 4,
    validTasks: [ToolCategory.GENERAL],
    toolType: 'storage',
    assignable: false
  }
};

// Keep track of tool instance counts
const toolInstanceCounts: Record<string, number> = {};

/**
 * Initialize tool instance counts from existing buildings
 * @param buildings Array of buildings to scan for existing tools
 */
export const initializeToolInstanceCounts = (buildings: Building[]) => {
  // Reset counts
  Object.keys(toolInstanceCounts).forEach(key => delete toolInstanceCounts[key]);
  
  // Scan all buildings and their tools to find highest instance numbers
  for (const building of buildings) {
    for (const slot of building.slots) {
      for (const tool of slot.tools) {
        if (!toolInstanceCounts[tool.name] || tool.instanceNumber > toolInstanceCounts[tool.name]) {
          toolInstanceCounts[tool.name] = tool.instanceNumber;
        }
      }
    }
  }
};

/**
 * Create a new tool instance
 * @param toolName Name of the tool to create
 * @returns A new tool instance with unique ID
 */
export const createTool = (toolName: string): Tool | null => {
  const toolTemplate = TOOLS[toolName];
  if (!toolTemplate) {
    console.error(`Tool template not found: ${toolName}`);
    return null;
  }

  // Initialize counter if not exists
  if (!toolInstanceCounts[toolName]) {
    toolInstanceCounts[toolName] = 0;
  }
  
  // Increment counter
  toolInstanceCounts[toolName]++;

  return {
    ...toolTemplate,
    id: uuidv4(),
    instanceNumber: toolInstanceCounts[toolName]
  };
};

/**
 * Building class representing a building in the winery
 */
export class Building {
  id: string;
  name: BuildingType;
  level: number;
  slots: ToolSlot[];
  
  constructor(name: BuildingType, level: number = 1, tools: Tool[] = []) {
    this.id = uuidv4();
    this.name = name;
    this.level = level;
    this.slots = [];
    
    // Initialize empty slots based on capacity
    this.initializeSlots();
    
    // Add initial tools if provided
    tools.forEach(tool => this.addTool(tool));
  }
  
  /**
   * Get the configuration for this building
   */
  private getConfig() {
    return BUILDING_CONFIG[this.name];
  }
  
  /**
   * Initialize empty slots based on capacity
   */
  private initializeSlots() {
    const capacity = this.calculateCapacity();
    this.slots = Array(capacity).fill(null).map(() => ({
      id: uuidv4(),
      tools: [],
      currentWeight: 0
    }));
  }
  
  /**
   * Calculate the capacity of the building based on level
   */
  calculateCapacity(): number {
    return Math.floor(this.getConfig().weightCapacity * Math.sqrt(this.level));
  }
  
  /**
   * Get the weight capacity of each slot
   */
  get slotWeightCapacity(): number {
    return this.getConfig().slotWeightCapacity;
  }
  
  /**
   * Get the base cost of the building
   */
  get baseCost(): number {
    return this.getConfig().baseCost;
  }
  
  /**
   * Calculate the cost to upgrade the building
   */
  getUpgradeCost(): number {
    // Each level costs more than the previous
    return Math.floor(this.baseCost * Math.pow(UPGRADE_COST_FACTOR, this.level));
  }
  
  /**
   * Upgrade the building to the next level
   */
  upgrade(): boolean {
    this.level++;
    
    // Add new slots based on new capacity
    const newCapacity = this.calculateCapacity();
    const slotsToAdd = newCapacity - this.slots.length;
    
    for (let i = 0; i < slotsToAdd; i++) {
      this.slots.push({
        id: uuidv4(),
        tools: [],
        currentWeight: 0
      });
    }
    
    return true;
  }
  
  /**
   * Add a tool to the building
   * @param tool The tool to add
   * @returns Whether the tool was added successfully
   */
  addTool(tool: Tool): boolean {
    // Check if tool is compatible with this building
    if (tool.buildingType !== this.name) {
      console.error(`Tool ${tool.name} is not compatible with ${this.name}`);
      return false;
    }
    
    // Find a slot with enough space
    const slotIndex = this.slots.findIndex(slot => 
      slot.currentWeight + tool.weight <= this.slotWeightCapacity
    );
    
    if (slotIndex === -1) {
      console.error(`No slot available in ${this.name} for ${tool.name}`);
      return false;
    }
    
    // Add tool to the slot
    this.slots[slotIndex].tools.push(tool);
    this.slots[slotIndex].currentWeight += tool.weight;
    
    return true;
  }
  
  /**
   * Remove a tool from a slot
   * @param slotIndex The index of the slot
   * @returns The tool that was removed and the refund amount
   */
  sellToolFromSlot(slotIndex: number): { tool: Tool, refundAmount: number } | null {
    const slot = this.slots[slotIndex];
    if (!slot || slot.tools.length === 0) {
      return null;
    }
    
    // Remove the last tool added to the slot
    const tool = slot.tools.pop()!;
    slot.currentWeight -= tool.weight;
    
    // Calculate refund amount (50% of original cost)
    const refundAmount = Math.floor(tool.cost * 0.5);
    
    return { tool, refundAmount };
  }
  
  /**
   * Get a list of all tools in the building
   */
  listContents(): string {
    const toolCounts: Record<string, number> = {};
    
    this.slots.forEach(slot => {
      slot.tools.forEach(tool => {
        if (!toolCounts[tool.name]) {
          toolCounts[tool.name] = 0;
        }
        toolCounts[tool.name]++;
      });
    });
    
    if (Object.keys(toolCounts).length === 0) {
      return "Empty";
    }
    
    return Object.entries(toolCounts)
      .map(([name, count]) => `${name}: ${count}`)
      .join(', ');
  }
  
  /**
   * Get a list of tools by category
   */
  getToolsByCategory(): Record<ToolCategory, Tool[]> {
    const result: Record<ToolCategory, Tool[]> = {} as Record<ToolCategory, Tool[]>;
    
    // Initialize all categories
    Object.values(ToolCategory).forEach(category => {
      result[category] = [];
    });
    
    // Sort tools into categories
    this.slots.forEach(slot => {
      slot.tools.forEach(tool => {
        // Put tool in each category it belongs to
        tool.validTasks.forEach(category => {
          result[category].push(tool);
        });
      });
    });
    
    return result;
  }
  
  /**
   * Get all tools of a specific type
   * @param toolType The type of tool to find
   */
  getToolsByType(toolType: string): Tool[] {
    return this.slots
      .flatMap(slot => slot.tools)
      .filter(tool => tool.toolType === toolType);
  }
  
  /**
   * Calculate the total speed bonus for a particular task
   * @param taskCategory The category of task
   */
  getSpeedBonusForTask(taskCategory: ToolCategory): number {
    const tools = this.getToolsByCategory()[taskCategory] || [];
    
    if (tools.length === 0) {
      return 1.0; // No bonus
    }
    
    // Sum up all speed bonuses
    const totalBonus = tools.reduce((sum, tool) => sum + (tool.speedBonus - 1.0), 0);
    
    // Return the bonus (minimum 1.0)
    return Math.max(1.0, 1.0 + totalBonus);
  }
  
  /**
   * Calculate the total storage capacity for a resource type
   * @param resourceType The type of resource
   */
  getStorageCapacityForResource(resourceType: string): number {
    return this.slots
      .flatMap(slot => slot.tools)
      .filter(tool => tool.supportedResources.includes(resourceType))
      .reduce((sum, tool) => sum + tool.capacity, 0);
  }
}

/**
 * Get a list of available tools for a building type
 * @param buildingType The type of building
 */
export const getToolsForBuilding = (buildingType: BuildingType): Array<Omit<Tool, 'id' | 'instanceNumber'>> => {
  return Object.values(TOOLS).filter(tool => tool.buildingType === buildingType);
}; 