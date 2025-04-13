import { getGameState, updateGameState } from '@/gameState';
import { Vineyard } from '@/lib/game/vineyard';
import { addTransaction } from './financeService';
import { consoleService } from '@/components/layout/Console';
import { startActivityWithDisplayState } from '@/lib/game/activityManager';
import { WorkCategory } from '@/lib/game/workCalculator';

export interface UpgradeBenefits {
  farmlandHealth?: number;
  soilQuality?: number;
  toolWeightReduction?: number;
  vineyardYield?: number;
  qualityImprovement?: number;
}

export interface UpgradeRequirements {
  money: number;
  farmland?: number;
  buildings?: number;
}

export interface Upgrade {
  id: number;
  name: string;
  description: string;
  type: 'Research' | 'Projects' | 'Upgrade';
  benefits: UpgradeBenefits;
  benefitsDescription: string;
  requirements: UpgradeRequirements;
  applicableTo: 'farmland' | 'buildings' | 'company';
  completed: boolean;
  workRequired: number;
}

// All available upgrades in the game (from the original implementation)
const upgrades: Upgrade[] = [
  {
    id: 1,
    name: "Advanced Irrigation",
    description: "Improves water usage efficiency in vineyards.",
    type: "Upgrade",
    benefits: { 
      farmlandHealth: 0.1 
    },
    benefitsDescription: "Farmland Health: +10%",
    requirements: { 
      money: 10000,
      farmland: 1 
    },
    applicableTo: 'farmland',
    completed: false,
    workRequired: 100
  },
  {
    id: 2,
    name: "Soil Analysis",
    description: "Provides detailed soil composition analysis.",
    type: "Upgrade",
    benefits: { 
      soilQuality: 0.2 
    },
    benefitsDescription: "Soil Quality: +20%",
    requirements: { 
      money: 5000000
    },
    applicableTo: 'farmland',
    completed: false,
    workRequired: 50
  },
  {
    id: 3,
    name: "Ecological Certification",
    description: "Provides certification of ecological farming.",
    type: "Projects",
    benefits: { 
      soilQuality: 0.2 
    },
    benefitsDescription: "Soil Quality: +20%",
    requirements: { 
      money: 5000000
    },
    applicableTo: 'farmland',
    completed: false,
    workRequired: 1500
  },
  {
    id: 4,
    name: "Efficient Building Organization",
    description: "Optimizes tool placement and storage efficiency in buildings, reducing tool weight by 20%.",
    type: "Upgrade",
    benefits: { 
      toolWeightReduction: 0.2 
    },
    benefitsDescription: "Tool Weight Reduction: 20%",
    requirements: { 
      money: 2500000,
      buildings: 1
    },
    applicableTo: 'buildings',
    completed: false,
    workRequired: 800
  }
];

/**
 * Get all available upgrades
 * @returns Array of upgrade objects
 */
export const getUpgrades = (): Upgrade[] => {
  return [...upgrades];
};

/**
 * Get a specific upgrade by ID
 * @param id The upgrade ID
 * @returns The upgrade object or undefined if not found
 */
export const getUpgradeById = (id: number): Upgrade | undefined => {
  return upgrades.find(upgrade => upgrade.id === id);
};

/**
 * Categorize upgrades into research, projects, and upgrades
 * @param allUpgrades Optional array of upgrades to categorize (defaults to all upgrades)
 * @returns Object with categorized upgrades
 */
export const categorizeUpgrades = (allUpgrades: Upgrade[] = upgrades) => {
  const research = allUpgrades.filter(upgrade => upgrade.type === 'Research');
  const projects = allUpgrades.filter(upgrade => upgrade.type === 'Projects');
  const upgradesList = allUpgrades.filter(upgrade => upgrade.type === 'Upgrade');
  
  return {
    research,
    projects,
    upgrades: upgradesList
  };
};

/**
 * Generate the benefits description for an upgrade
 * @param benefits The benefits object
 * @returns A string describing the benefits
 */
export const getBenefitsDescription = (benefits: UpgradeBenefits): string => {
  const descriptions = [];
  if (benefits.farmlandHealth) {
    descriptions.push(`Farmland Health: +${benefits.farmlandHealth * 100}%`);
  }
  if (benefits.soilQuality) {
    descriptions.push(`Soil Quality: +${benefits.soilQuality * 100}%`);
  }
  if (benefits.toolWeightReduction) {
    descriptions.push(`Tool Weight Reduction: ${benefits.toolWeightReduction * 100}%`);
  }
  if (benefits.vineyardYield) {
    descriptions.push(`Vineyard Yield: +${benefits.vineyardYield * 100}%`);
  }
  if (benefits.qualityImprovement) {
    descriptions.push(`Quality Improvement: +${benefits.qualityImprovement * 100}%`);
  }
  return descriptions.join(', ');
};

/**
 * Start an upgrade process
 * @param upgradeId The ID of the upgrade to start
 * @param vineyard Optional vineyard to apply the upgrade to (for farmland upgrades)
 * @returns Success status
 */
export const startUpgrade = async (upgradeId: number, vineyard?: Vineyard): Promise<boolean> => {
  const gameState = getGameState();
  const upgrade = getUpgradeById(upgradeId);
  
  if (!upgrade) {
    consoleService.error("Upgrade not found.");
    return false;
  }
  
  if (!gameState.player) {
    consoleService.error("Player not found.");
    return false;
  }
  
  // Check if player has enough money
  if (gameState.player.money < upgrade.requirements.money) {
    consoleService.error(`Not enough money. Required: ${upgrade.requirements.money}, Available: ${gameState.player.money}`);
    return false;
  }
  
  // Check farmland requirement
  if (upgrade.requirements.farmland && upgrade.requirements.farmland > 0) {
    if (upgrade.applicableTo === 'farmland' && !vineyard) {
      consoleService.error("No vineyard selected for farmland upgrade.");
      return false;
    }
    
    // Check if vineyard already has this upgrade
    if (vineyard && vineyard.upgrades && vineyard.upgrades.includes(upgradeId.toString())) {
      consoleService.error(`Vineyard ${vineyard.name} already has this upgrade.`);
      return false;
    }
  }
  
  // Check building requirement
  if (upgrade.requirements.buildings && upgrade.requirements.buildings > 0) {
    if (gameState.buildings.length < upgrade.requirements.buildings) {
      consoleService.error(`Not enough buildings. Required: ${upgrade.requirements.buildings}`);
      return false;
    }
  }
  
  // Create transaction for the upgrade cost
  addTransaction(
    -upgrade.requirements.money,
    `Upgrade: ${upgrade.name}`,
    'Upgrades'
  ).catch(error => {
    console.error("Error adding transaction:", error);
  });
  
  // Create an activity for the upgrade work
  const activityId = startActivityWithDisplayState('upgradeActivity', {
    category: WorkCategory.UPGRADING,
    amount: upgrade.workRequired,
    title: upgrade.name,
    targetId: vineyard?.id ?? 'winery',
    additionalParams: {
      upgradeType: upgrade.type,
      cost: upgrade.requirements.money
    }
  });
  
  if (!activityId) {
    consoleService.error("Failed to create upgrade activity.");
    return false;
  }
  
  consoleService.info(`Started upgrade: ${upgrade.name}`);
  return true;
};

/**
 * Complete an upgrade after work is finished
 * @param upgradeId The ID of the upgrade to complete
 * @param vineyard Optional vineyard the upgrade was applied to
 * @returns Success status
 */
export const completeUpgrade = (upgradeId: number, vineyard?: Vineyard): boolean => {
  const gameState = getGameState();
  const upgrade = getUpgradeById(upgradeId);
  
  if (!upgrade) {
    consoleService.error("Upgrade not found for completion.");
    return false;
  }
  
  // Apply upgrade benefits based on type
  if (upgrade.applicableTo === 'farmland' && vineyard) {
    const vineyardIndex = gameState.vineyards.findIndex(v => v.id === vineyard.id);
    
    if (vineyardIndex >= 0) {
      const updatedVineyard = { ...gameState.vineyards[vineyardIndex] };
      
      // Apply farmland health benefit
      if (upgrade.benefits.farmlandHealth) {
        const beforeHealth = updatedVineyard.vineyardHealth || 0.5;
        updatedVineyard.vineyardHealth = Math.min(1.0, beforeHealth + upgrade.benefits.farmlandHealth);
        consoleService.info(`Farmland health for ${updatedVineyard.name} improved from ${beforeHealth.toFixed(2)} to ${updatedVineyard.vineyardHealth.toFixed(2)}.`);
      }
      
      // Track applied upgrades
      if (!updatedVineyard.upgrades) {
        updatedVineyard.upgrades = [];
      }
      updatedVineyard.upgrades.push(upgradeId.toString());
      
      // Update game state with the modified vineyard
      const updatedVineyards = [...gameState.vineyards];
      updatedVineyards[vineyardIndex] = updatedVineyard;
      
      updateGameState({ vineyards: updatedVineyards });
    }
    
    // Check if this upgrade is now applied to all farmlands
    const farmlands = gameState.vineyards;
    const allFarmlandsUpgraded = farmlands.every(f => f.upgrades && f.upgrades.includes(upgradeId.toString()));
    
    // Only mark as completed if all farmlands have it
    if (upgrade.applicableTo === 'farmland' && allFarmlandsUpgraded) {
      const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
      if (upgradeIndex >= 0) {
        upgrades[upgradeIndex].completed = true;
      }
    }
  } else {
    // For non-farmland upgrades, mark as completed
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    if (upgradeIndex >= 0) {
      upgrades[upgradeIndex].completed = true;
    }
    
    // Apply building-specific benefits
    if (upgrade.applicableTo === 'buildings' && upgrade.benefits.toolWeightReduction) {
      // In the original version, this would reduce tool weights
      // Since we don't have the equivalent system yet, just log it
      consoleService.info(`Building storage efficiency improved. Tool weights would be reduced by ${upgrade.benefits.toolWeightReduction * 100}%.`);
    }
  }
  
  consoleService.info(`Upgrade completed: ${upgrade.name}`);
  return true;
}; 