import taskManager, { TaskType } from './taskManager.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { getMoney } from './company.js';
import { getFarmlands, updateAllFarmlands, storeUpgrades } from './database/adminFunctions.js';
import { updateUpgradesList } from './overlays/mainpages/financeoverlay.js';

// Predefined upgrades and research items
export const upgrades = [
  {
    id: 1,
    name: "Advanced Irrigation",
    upgradeType: "Upgrade",
    description: "Improves water usage efficiency in vineyards.",
    requirements: { 
      money: 10000,
      farmland: 1 // Require at least 1 available farmland
    },
    benefits: { farmlandHealth: 0.1 }, // Example benefits
    taskParameters: { totalWork: 100, taskType: TaskType.field },
    completed: false // Track completion status
  },
  {
    id: 2,
    name: "Soil Analysis",
    upgradeType: "Upgrade",
    description: "Provides detailed soil composition analysis.",
    requirements: { 
      money: 5000000
    },
    benefits: { soilQuality: 0.2 },
    taskParameters: { totalWork: 50, taskType: TaskType.field },
    completed: false // Track completion status
  },
  {
    id: 2,
    name: "Ecological Certification",
    upgradeType: "Projects",
    description: "Provides certification of ecological farming.",
    requirements: { 
      money: 5000000
    },
    benefits: { soilQuality: 0.2 },
    taskParameters: { totalWork: 1500, taskType: TaskType.field },
    completed: false // Track completion status
  }
  // Add more upgrades/research items as needed
];

// Function to check if the requirements for an upgrade are met
function checkRequirements(upgrade) {
  const money = getMoney();
  if (money < upgrade.requirements.money) {
    addConsoleMessage(`Not enough money to start ${upgrade.name}. Required: €${upgrade.requirements.money}`, false, true);
    return false;
  }

  if (upgrade.requirements.farmland) {
    const farmlands = getFarmlands();
    if (farmlands.length < upgrade.requirements.farmland) {
      addConsoleMessage(`Not enough available farmlands for ${upgrade.name}. Required: ${upgrade.requirements.farmland}`, false, true);
      return false;
    }
  }

  return true;
}

// Function to start an upgrade/research task
export function startUpgradeTask(upgradeId) {
  const upgrade = upgrades.find(p => p.id === upgradeId);
  if (!upgrade) {
    addConsoleMessage(`Upgrade with ID ${upgradeId} not found.`, false, true);
    return;
  }

  if (!checkRequirements(upgrade)) {
    return;
  }

  // Deduct the required money
  addTransaction('Expense', `Started upgrade on ${upgrade.name}`, -upgrade.requirements.money);

  // Start the task using taskManager
  taskManager.addCompletionTask(
    'Upgrade',
    upgrade.taskParameters.taskType,
    upgrade.taskParameters.totalWork,
    (target, params) => {
      // Apply benefits upon completion
      applyUpgradeBenefits(upgrade);
      upgrade.completed = true; // Mark as completed
      addConsoleMessage(`Upgrade on ${upgrade.name} completed. Benefits applied.`);
      updateUpgradesList(); // Refresh the upgrades list
      storeUpgrades(upgrades); // Save upgrades to localStorage
    },
    upgrade.name // Pass the upgrade name as the target
  );
}

// Function to check if an upgrade is available
export function isUpgradeAvailable(upgrade) {
  return checkRequirements(upgrade);
}

// Function to apply benefits of a completed upgrade
export function applyUpgradeBenefits(upgrade) {
  // Apply the benefits to the relevant game entities
  // Example: Increase farmland health
  if (upgrade.benefits.farmlandHealth) {
    const farmlands = getFarmlands();
    farmlands.forEach(field => {
      const beforeHealth = field.farmlandHealth;
      field.farmlandHealth = Math.min(1.0, field.farmlandHealth + upgrade.benefits.farmlandHealth);
      const afterHealth = field.farmlandHealth;
      addConsoleMessage(`Farmland health for ${field.name} improved from ${beforeHealth} to ${afterHealth}.`);
    });
    updateAllFarmlands(farmlands);
  }

  // Add more benefit applications as needed
}

// Function to get the benefits description
export function getBenefitsDescription(benefits) {
  const descriptions = [];
  if (benefits.farmlandHealth) {
    descriptions.push(`Farmland Health: +${benefits.farmlandHealth * 100}%`);
  }
  if (benefits.soilQuality) {
    descriptions.push(`Soil Quality: +${benefits.soilQuality * 100}%`);
  }
  // Add more benefit descriptions as needed
  return descriptions.join(', ');
}

// Function to categorize upgrades
export function categorizeUpgrades() {
  const research = [];
  const projects = [];
  const upgradesList = [];

  upgrades.forEach(upgrade => {
    switch (upgrade.upgradeType) {
      case 'Research':
        research.push(upgrade);
        break;
      case 'Projects':
        projects.push(upgrade);
        break;
      case 'Upgrade':
        upgradesList.push(upgrade);
        break;
      default:
        upgradesList.push(upgrade);
    }
  });

  return { research, projects, upgradesList };
}



