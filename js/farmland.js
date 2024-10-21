import { addConsoleMessage } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names
import { allResources, Resource, Inventory } from '/js/resource.js';

class Farmland {
  constructor(id, name, country, region, acres, plantedResource = null) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
    this.plantedResource = plantedResource;
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

  addConsoleMessage(`Successfully purchased new farmland: ID = ${newFarmland.id}, Name = ${newFarmland.name}, Country = ${newFarmland.country}, Region = ${newFarmland.region}, Acres = ${newFarmland.acres}`);

  displayOwnedFarmland();
}

function displayOwnedFarmland() {
  const farmlandTableBody = document.querySelector('#farmland-table-body');
  farmlandTableBody.innerHTML = ''; // Clear existing rows
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

  // Ensure allResources is populated
  const grapeResources = allResources.filter(resource => resource.state === 'Grapes'); // Only list resources that are in Grapes state
  const resourceOptions = grapeResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');

  farmlands.forEach((farmland, index) => {
    const row = document.createElement('tr');
    const isPlanted = farmland.plantedResource != null;
    const harvestButtonState = isPlanted ? '' : 'disabled';
    row.innerHTML = `
      <td>${farmland.id}</td>
      <td>${farmland.name}</td>
      <td>${farmland.country}</td>
      <td>${farmland.region}</td>
      <td>${farmland.acres}</td>
      <td>${farmland.plantedResource || 'Empty'}</td>
      <td>
        <select class="resource-select">${resourceOptions}</select>
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
    farmlands[index].plantedResource = resourceName;
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    addConsoleMessage(`Field ID ${farmlands[index].id} has been planted with ${resourceName}.`);
    displayOwnedFarmland(); // Refresh the table display
  }
}
function harvestField(index) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  if (farmlands[index] && farmlands[index].plantedResource) {
    const resourceName = farmlands[index].plantedResource;
    const acres = farmlands[index].acres;
    const state = 'Grapes'; // Initial state of harvested resource
    const category = 'warehouse'; // Initial category of harvested resource
    const harvestedResource = new Resource(resourceName, category, state);
    Inventory.addResource(harvestedResource, acres); // Use static method
    addConsoleMessage(`Harvested ${acres} of ${resourceName} in ${state} state from Field ID ${farmlands[index].id}.`);
    localStorage.setItem('playerInventory', JSON.stringify(Inventory.resources)); // Use static property
    farmlands[index].plantedResource = null;
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    displayOwnedFarmland();
  }
}

export { buyLand, Farmland, displayOwnedFarmland, plantField };