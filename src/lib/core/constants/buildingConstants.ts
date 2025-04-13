export enum BuildingType {
  TOOL_SHED = 'Tool Shed',
  WAREHOUSE = 'Warehouse',
  OFFICE = 'Office',
  WINE_CELLAR = 'Wine Cellar',
  WINERY = 'Winery'
}

// Building configuration
export const BUILDING_CONFIG = {
  [BuildingType.TOOL_SHED]: {
    baseCost: 500000,
    weightCapacity: 10,
    slotWeightCapacity: 5,
    description: 'Store tools for vineyard maintenance and harvesting',
    icon: '/assets/icon/menu/toolshed.webp'
  },
  [BuildingType.WAREHOUSE]: {
    baseCost: 1000000,
    weightCapacity: 15,
    slotWeightCapacity: 8,
    description: 'Store harvested grapes before processing',
    icon: '/assets/icon/menu/warehouse.webp'
  },
  [BuildingType.OFFICE]: {
    baseCost: 750000,
    weightCapacity: 5,
    slotWeightCapacity: 3,
    description: 'Manage administrative tasks and employees',
    icon: '/assets/icon/menu/office.webp'
  },
  [BuildingType.WINE_CELLAR]: {
    baseCost: 2000000,
    weightCapacity: 20,
    slotWeightCapacity: 10,
    description: 'Age and store bottled wine',
    icon: '/assets/icon/menu/winecellar.webp'
  },
  [BuildingType.WINERY]: {
    baseCost: 1500000,
    weightCapacity: 15,
    slotWeightCapacity: 8,
    description: 'Process grapes into wine',
    icon: '/assets/icon/menu/winery.webp'
  }
};

// Tool categories
export enum ToolCategory {
  GENERAL = 'general',
  PLANTING = 'planting',
  HARVESTING = 'harvesting',
  CRUSHING = 'crushing',
  PRESSING = 'pressing',
  FERMENTATION = 'fermentation',
  ADMINISTRATION = 'administration'
}

// Map of tool categories to display names
export const TOOL_CATEGORY_NAMES = {
  [ToolCategory.GENERAL]: 'General Tools',
  [ToolCategory.PLANTING]: 'Planting Tools',
  [ToolCategory.HARVESTING]: 'Harvesting Tools',
  [ToolCategory.CRUSHING]: 'Crushing Tools',
  [ToolCategory.PRESSING]: 'Pressing Tools',
  [ToolCategory.FERMENTATION]: 'Fermentation Tools',
  [ToolCategory.ADMINISTRATION]: 'Administration Tools'
};

// Constants for maintenance
export const MAINTENANCE_COST_FACTOR = 0.1; // 10% of base cost
export const UPGRADE_COST_FACTOR = 1.5; // 150% of previous level cost

// Work required for construction (used by task system)
export const CONSTRUCTION_WORK_FACTOR = 0.001; // Work units per cost unit 