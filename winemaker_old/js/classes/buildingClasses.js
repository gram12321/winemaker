export class Building {
  static BUILDINGS = {
    'Tool Shed': {
      baseCost: 500000,
      weightCapacity: 10,
      slotWeightCapacity: 5
    },
    'Warehouse': {
      baseCost: 1000000,
      weightCapacity: 15,
      slotWeightCapacity: 8
    },
    'Office': {
      baseCost: 750000,
      weightCapacity: 5,
      slotWeightCapacity: 3
    },
    'Wine Cellar': {
      baseCost: 2000000,
      weightCapacity: 20,
      slotWeightCapacity: 10
    },
    'Winery': {
      baseCost: 1500000,
      weightCapacity: 15,
      slotWeightCapacity: 8
    }
  };

  getConfig(name) {
    return Building.BUILDINGS[name] || Building.BUILDINGS['Tool Shed'];
  }

  constructor(name, level = 1, tools = []) {
    this.name = name;
    this.level = level;
    this.baseCost = this.getConfig(name).baseCost;
    this.capacity = this.calculateCapacity();
    this.slotWeightCapacity = this.getConfig(name).slotWeightCapacity;
    this.slots = Array(this.capacity).fill().map(() => ({ tools: [], currentWeight: 0 }));

    // Initialize slots with existing tools
    if (tools && tools.length > 0) {
      tools.forEach(tool => {
        // Create proper Tool instance if it's a plain object
        const toolInstance = tool instanceof Tool ? tool : 
          new Tool(tool.name, tool.buildingType, tool.speedBonus, tool.cost, 
                  tool.capacity, tool.supportedResources, tool.weight, tool.validTasks, tool.toolType);
        toolInstance.instanceNumber = tool.instanceNumber;
        this.addTool(toolInstance);
      });
    }
  }

  calculateCapacity() {
    return this.level * 3;
  }

  getCurrentWeight() {
    return this.slots.reduce((total, slot) => total + slot.currentWeight, 0);
  }

  getRemainingWeight() {
    return this.totalWeightCapacity - this.getCurrentWeight();
  }

  findAvailableSlot(tool) {
    const adjustedWeight = tool.getAdjustedWeight();
    
    // First, try to find a slot that already has the same type of tool
    let slot = this.slots.find(slot => 
      slot.tools.length > 0 && 
      slot.tools[0].name === tool.name && 
      slot.currentWeight + adjustedWeight <= this.slotWeightCapacity
    );

    // If no matching slot found, try to find an empty slot
    if (!slot) {
      slot = this.slots.find(slot => 
        slot.tools.length === 0 && 
        adjustedWeight <= this.slotWeightCapacity
      );
    }

    return slot;
  }

  addTool(tool) {
    const slot = this.findAvailableSlot(tool);
    if (slot) {
      slot.tools.push(tool);
      // Use adjusted weight instead of base weight
      slot.currentWeight += tool.getAdjustedWeight();
      return true;
    }
    return false;
  }

  upgrade() {
    this.level += 1;
    const newCapacity = this.calculateCapacity();
    // Add new empty slots for the increased capacity
    const additionalSlots = newCapacity - this.capacity;
    this.slots = [
      ...this.slots,
      ...Array(additionalSlots).fill().map(() => ({ tools: [], currentWeight: 0 }))
    ];
    this.capacity = newCapacity;
    return true;
  }

  getUpgradeCost() {
    return Math.floor(this.baseCost * Math.pow(1.5, this.level));
  }

  listContents() {
    const allTools = this.getAllTools();
    if (allTools.length === 0) {
      return "No tools stored.";
    }

    const toolCounts = allTools.reduce((acc, tool) => {
      acc[tool.name] = (acc[tool.name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(toolCounts)
      .map(([name, count]) => {
        const iconPath = `/assets/icon/buildings/${name.toLowerCase()}.png`;
        return `<div>
                  <img src="${iconPath}" alt="${name}" style="width: 24px; height: 24px; vertical-align: middle;" />
                  ${count}x ${name}
                </div>`;
      })
      .join('<br>');
  }

  getAllTools() {
    return this.slots.flatMap(slot => slot.tools);
  }

  sellToolFromSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (slot && slot.tools.length > 0) {
      const tool = slot.tools.pop(); // Remove last tool from slot
      // Use adjusted weight for removal too
      slot.currentWeight -= tool.getAdjustedWeight();
      
      // Add this check to clear slot if empty
      if (slot.tools.length === 0) {
        // Reset slot to empty state
        slot.currentWeight = 0;
      }
      
      return {
        tool,
        refundAmount: Math.floor(tool.cost / 2) // 50% refund
      };
    }
    return null;
  }
}

export class Tool {
  static instanceCount = {};

  constructor(name, buildingType, speedBonus = 1.0, cost = 0, capacity = 0, supportedResources = [], weight = 1, validTasks = [], toolType = 'individual', assignable = true) {
    this.name = name;
    this.buildingType = buildingType;
    this.speedBonus = speedBonus;
    this.cost = cost;
    this.capacity = capacity; // capacity in kg or liters
    this.supportedResources = supportedResources;
    this.instanceNumber = 1; // Default value, will be overridden by ToolManager
    this.weight = weight; // Default weight of 1 if not specified
    this.validTasks = validTasks; // Now this will contain task names like 'harvest', 'planting' instead of types
    this.toolType = toolType;  // Add new property
    this.assignedTaskId = null; // Add this property to track which task the tool is assigned to
    this.assignable = assignable;  // Add this new property
  }

  getStorageId() {
    return `${this.name} #${this.instanceNumber}`;
  }

  canStore(resourceName) {
    return this.supportedResources.length === 0 || this.supportedResources.includes(resourceName);
  }

  getCurrentAmount(inventory) {
    const contents = inventory.getStorageContents(this.getStorageId());
    return contents.reduce((sum, item) => sum + item.amount, 0);
  }

  getAvailableSpace(inventory) {
    return this.capacity - this.getCurrentAmount(inventory);
  }

  isValidForTask(taskName) {
    return this.validTasks.some(task => 
      task.toLowerCase() === taskName.toLowerCase()
    );
  }

  isAvailable() {
    return this.assignedTaskId === null;
  }

  assignToTask(taskId) {
    if (this.isAvailable()) {
      this.assignedTaskId = taskId;
      return true;
    }
    return false;
  }

  releaseFromTask() {
    this.assignedTaskId = null;
  }

  getAdjustedWeight() {
    // Get completed upgrades that affect weight
    const completedUpgrades = JSON.parse(localStorage.getItem('upgrades') || '[]');
    const weightReduction = completedUpgrades
        .filter(u => u.completed && u.benefits.toolWeightReduction)
        .reduce((total, upgrade) => total + upgrade.benefits.toolWeightReduction, 0);

    // Apply weight reduction
    return this.weight * (1 - weightReduction);
  }
}

const ToolManager = (() => {
  let toolsInitialized = false;
  let tools = [];
  let toolInstanceCounts = {};


  function initializeTools() {
    if (!toolsInitialized) {
      // Reset tool instance counts
      toolInstanceCounts = {};

      tools = [
        // Tool params: name, buildingType, speedBonus, cost, capacity, supportedResources[], weight, validTasks[], toolType, assignable
        // Tool Shed Tools - all assignable 
        new Tool('Tractor', 'Tool Shed', 1.2, 45000, 0, [], 5, ['planting', 'harvesting', 'clearing', 'uprooting'], 'task', true),  // Small vineyard tractor
        new Tool('Trimmer', 'Tool Shed', 1.1, 3500, 0, [], 1, ['planting', 'clearing'], 'task', true),  // Professional trimmer
        new Tool('Harvest Bins', 'Tool Shed', 1.1, 1200, 0, ['Grapes'], 1, ['harvesting'], 'individual', true),  // Commercial harvest bin
        new Tool('Lug Box', 'Tool Shed', 1.05, 800, 0, ['Grapes'], 1, ['harvesting'], 'individual', true),  // Commercial lug box

        // Warehouse Tools
        new Tool('Forklift', 'Warehouse', 1.2, 25000, 0, [], 6, ['crushing', 'fermentation', 'Building & Maintenance'], 'task', true),  // Used forklift
        new Tool('Pallet Jack', 'Warehouse', 1.1, 3500, 0, [], 3, ['crushing', 'fermentation', 'Building & Maintenance'], 'individual', true),
        new Tool('Macro Bin', 'Warehouse', 1.0, 2500, 1000, ['Grapes'], 2, ['harvesting'], 'individual', false),
        new Tool('Grape Gondola', 'Warehouse', 1.0, 15000, 8000, ['Grapes'], 8, ['harvesting'], 'task', false),

        // Winery Tools - some not assignable
        new Tool('Fermentation Tank', 'Winery', 1.0, 600000, 20000, ['Must'], 8, ['fermentation'], 'task', false),  // Large stainless steel tank
        new Tool('Manual Crusher', 'Winery', 1.5, 8000, 0, ['Grapes'], 2, ['crushing'], 'task', false),
        new Tool('Mechanical Crusher', 'Winery', 3.0, 25000, 0, ['Grapes'], 3, ['crushing'], 'task', false),
        new Tool('Crusher-Destemmer', 'Winery', 3.0, 45000, 0, ['Grapes'], 4, ['crushing'], 'task', false),
        new Tool('Pneumatic Press', 'Winery', 1.4, 85000, 0, ['Grapes'], 5, ['pressing'], 'task', false),
        new Tool('Advanced Press', 'Winery', 1.5, 175000, 0, ['Grapes'], 6, ['pressing'], 'task', false),
        new Tool('Plastic Fermentation Bin', 'Winery', 0.9, 12000, 1000, ['Must'], 3, ['fermentation'], 'task', false),
        new Tool('Stainless Steel Tank', 'Winery', 1.2, 35000, 2000, ['Must'], 5, ['fermentation'], 'task', false),
        new Tool('Concrete Tank', 'Winery', 1.3, 65000, 3000, ['Must'], 8, ['fermentation'], 'task', false),
        new Tool('Oak Fermentation Barrel', 'Winery', 1.5, 95000, 500, ['Must'], 2, ['fermentation'], 'task', false),

        // Office Tools
        new Tool('Desk', 'Office', 1.1, 1200, 0, [], 1, ['administration'], 'individual', true),  // Commercial office desk
        new Tool('Computer', 'Office', 1.3, 3500, 0, [], 1, ['administration'], 'individual', true),  // Business computer setup

      ];
      toolsInitialized = true;
    }
    return tools;
  }

  function createToolInstance(toolName) {
    const toolTemplate = tools.find(tool => tool.name === toolName);
    if (toolTemplate) {
      // Initialize counter if not exists
      if (!toolInstanceCounts[toolName]) {
        toolInstanceCounts[toolName] = 0;
      }
      // Increment counter
      toolInstanceCounts[toolName]++;

      const newTool = new Tool(
        toolTemplate.name,
        toolTemplate.buildingType,
        toolTemplate.speedBonus,
        toolTemplate.cost,
        toolTemplate.capacity,
        toolTemplate.supportedResources || [],
        toolTemplate.weight,
        toolTemplate.validTasks,
        toolTemplate.toolType,
        toolTemplate.assignable
      );
      // Override the instance number with our managed count
      newTool.instanceNumber = toolInstanceCounts[toolName];
      return newTool;
    }
    console.log('Tool template not found');
    return null;
  }

  return {
    getTools: initializeTools,
    createToolInstance
  };
})();

export const getBuildingTools = () => ToolManager.getTools();
export const createTool = (toolName) => ToolManager.createToolInstance(toolName);