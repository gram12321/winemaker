import { addConsoleMessage, getIconHtml } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names
import { allResources, inventoryInstance } from '/js/resource.js';
import { saveInventory } from '/js/database/adminFunctions.js';


class Farmland {
  constructor(id, name, country, region, acres, plantedResourceName = null) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
    this.plantedResourceName = plantedResourceName;
  }
}

function createFarmland(id, name, country, region, acres) {
  return new Farmland(id, name, country, region, acres);
}

function getLastId(farmlands) {
  if (farmlands.length === 0) return 0;
  return Math.max(...farmlands.map(farmland => farmland.id));
}

function getRandomName() {
  const allNames = italianMaleNames.concat(italianFemaleNames);
  return allNames[Math.floor(Math.random() * allNames.length)];
}

function buyLand() {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const newId = getLastId(farmlands) + 1;
  const newName = getRandomName();

  const newFarmland = createFarmland(newId, newName, "Italy", "Piedmont", 100);

  farmlands.push(newFarmland);
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  addConsoleMessage(`Purchased new farmland: "<strong>${newFarmland.name}"</Strong> in <strong>${newFarmland.country}, ${newFarmland.region}</strong>, with total <strong>${newFarmland.acres} </strong>Acres`);

  displayOwnedFarmland();
}

function displayOwnedFarmland() {
  const farmlandTableBody = document.querySelector('#farmland-table-body');
  farmlandTableBody.innerHTML = ''; // Clear existing rows
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

  // Create options for each available resource
  const resourceOptions = allResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');

  farmlands.forEach((farmland, index) => {
    const row = document.createElement('tr');
    const isPlanted = farmland.plantedResourceName != null;
    const harvestButtonState = isPlanted ? '' : 'disabled';
    row.innerHTML = `
      <td>${farmland.id}</td>
      <td>${farmland.name}</td>
      <td>${farmland.country}</td>
      <td>${farmland.region}</td>
      <td>${farmland.acres}</td>
      <td>${farmland.plantedResourceName || 'Empty'}</td>
      <td>
        <select class="resource-select">
          ${resourceOptions}
        </select>
        <button class="btn btn-warning plant-field-btn">Plant the Field</button>
        <button class="btn btn-success harvest-field-btn" ${harvestButtonState}>Harvest</button>
      </td>
    `;
    farmlandTableBody.appendChild(row);

    // Planted Resource Logic
    row.querySelector('.plant-field-btn').addEventListener('click', () => {
      const resourceSelect = row.querySelector('.resource-select');
      const selectedResource = resourceSelect.value;
      plantField(index, selectedResource);
    });

    // Harvest Logic
    const harvestButton = row.querySelector('.harvest-field-btn');
    harvestButton.addEventListener('click', () => {
      if (isPlanted) {
        harvestField(index);
      }
      
    });
  });
}

function plantField(index, resourceName) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  if (farmlands[index]) {
    farmlands[index].plantedResourceName = resourceName;
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    addConsoleMessage(`${getIconHtml('planting.png')}<strong>${farmlands[index].name}</strong> has been planted with <strong>${resourceName}</strong>, total of <strong>${farmlands[index].acres}</strong> acres has been planted.`);
    displayOwnedFarmland(); // Refresh the table display
  }
}

function harvestField(index) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  if (farmlands[index] && farmlands[index].plantedResourceName) {
    const resourceName = farmlands[index].plantedResourceName;
    const acres = farmlands[index].acres;
    const state = 'Grapes'; // Initial state of harvested resource
    // Use game year from localStorage for vintage
    const gameYear = parseInt(localStorage.getItem('year'), 10);
    // Add to the inventory using the inventory instance
    inventoryInstance.addResource(resourceName, acres, state, gameYear, 'High'); // Use arbitrary quality
    addConsoleMessage(`Harvested ${acres} of ${resourceName} in ${state} state from Field ID ${farmlands[index].id}, Vintage: ${gameYear}.`);
    // Save inventory to localStorage
    saveInventory();
    // Update farmland
    farmlands[index].plantedResourceName = null;
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    displayOwnedFarmland();
  }
}

export { buyLand, Farmland, displayOwnedFarmland, plantField };