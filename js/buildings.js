import { loadBuildings } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings } from '/js/database/adminFunctions.js';
import { addTransaction} from '/js/finance.js';
import { formatNumber } from '/js/utils.js';
import taskManager from '/js/taskManager.js';
import { updateBuildingCards, updateBuildButtonStates } from '/js/overlays/mainpages/buildingsoverlay.js';
import { Building } from '/js/classes/buildingClasses.js';

export function buildBuilding(buildingName) {
  const buildings = loadBuildings();
  const existingBuilding = buildings.find(b => b.name === buildingName);

  if (existingBuilding) {
    addConsoleMessage(`${buildingName} already exists and cannot be built again.`);
    return;
  }

  const buildingCost = Building.BUILDINGS[buildingName]?.baseCost || 500000;

  // Initial state changes
  const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

  if (buildButton && upgradeButton) {
    buildButton.disabled = true;
    buildButton.textContent = "Building...";
  }

  // Add to transaction history
  addTransaction('Expense', `Construction of ${buildingName}`, -buildingCost);

  // Add initial message
  addConsoleMessage(`Construction of ${buildingName} has begun. <span style="color: red">€${formatNumber(buildingCost)}</span> has been deducted from your account. When complete, capacity will be ${new Building(buildingName).calculateCapacity()} spaces.`);

  // Create building task
  taskManager.addCompletionTask(
    'Building & Maintenance',
    'maintenance',
    buildingCost / 1000, // Total work required based on building cost
    (target, params) => {
      // Completion callback
      const newBuilding = new Building(buildingName);
      const buildings = loadBuildings();
      buildings.push(newBuilding);
      storeBuildings(buildings);

      if (buildButton && upgradeButton) {
        buildButton.textContent = "Built";
        upgradeButton.disabled = false;
      }

      addConsoleMessage(`${buildingName} has been built successfully. <span style="color: red">Cost: €${formatNumber(buildingCost)}</span>. Capacity: ${newBuilding.capacity} (${newBuilding.capacity} spaces available)`);
      updateBuildingCards();
      updateBuildButtonStates();
    },
    { name: buildingName }, // Change: Pass building name as an object with name property
    { buildingCost }
  );
}

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const buildingData = buildings.find(b => b.name === buildingName);

  if (!buildingData) {
    addConsoleMessage(`Building ${buildingName} not found.`);
    return;
  }

  const building = new Building(buildingData.name, buildingData.level, buildingData.tools || []);
  const upgradeCost = building.getUpgradeCost();

  // Add to transaction history
  addTransaction('Expense', `Upgrade of ${buildingName}`, -upgradeCost);

  // Add initial message
  addConsoleMessage(`Upgrade of ${buildingName} has begun. <span style="color: red">€${formatNumber(upgradeCost)}</span> has been deducted from your account.`);

  // Create upgrade task
  taskManager.addCompletionTask(
    'Building & Maintenance',
    'maintenance',
    upgradeCost / 1000, // Total work required based on upgrade cost
    (target, params) => {
      // Completion callback
      const buildings = loadBuildings();
      const buildingToUpgrade = buildings.find(b => b.name === params.buildingName);

      if (buildingToUpgrade) {
        const building = new Building(buildingToUpgrade.name, buildingToUpgrade.level, buildingToUpgrade.slots?.flatMap(slot => slot.tools) || []);
        building.upgrade();
        // Remove this line as it's incorrect:
        // building.tools = buildingToUpgrade.tools || []; 
        
        // The tools are already preserved through the constructor and slots

        const updatedBuildings = buildings.map(b => 
          b.name === params.buildingName ? building : b
        );
        storeBuildings(updatedBuildings);

        addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}. <span style="color: red">Cost: €${formatNumber(upgradeCost)}</span>. New Capacity: ${building.capacity} (${building.capacity - (building.tools ? building.tools.length : 0)} spaces available)`);
        updateBuildingCards();
        updateBuildButtonStates();
      }
    },
    { name: buildingName }, // Change: Pass building name as an object with name property
    { buildingName, upgradeCost } // Ensure buildingName is passed in params
  );
}