import { addConsoleMessage } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names
import { allResources } from '/js/resource.js';

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
// script for land.html

function getLastId(farmlands) {
  if (farmlands.length === 0) return 0;
  return Math.max(...farmlands.map(farmland => farmland.id));
}

function getRandomName() {
  const allNames = italianMaleNames.concat(italianFemaleNames); // Combine male and female names
  return allNames[Math.floor(Math.random() * allNames.length)];
}

function buyLand() {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const newId = getLastId(farmlands) + 1;
  const newName = getRandomName();

  const newFarmland = createFarmland(newId, newName, "Italy", "Piedmont", 100);

  // Save to localStorage
  farmlands.push(newFarmland);
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

  // Add console message using addConsoleMessage function
  addConsoleMessage(`Successfully purchased new farmland: ID = ${newFarmland.id}, Name = ${newFarmland.name}, Country = ${newFarmland.country}, Region = ${newFarmland.region}, Acres = ${newFarmland.acres}`);

  // Refresh the display of owned farmlands
  displayOwnedFarmland();
}

function displayOwnedFarmland() {
  const farmlandTableBody = document.querySelector('#farmland-table-body');
  farmlandTableBody.innerHTML = ''; // Clear existing rows
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const resourceOptions = allResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');
  farmlands.forEach((farmland, index) => {
    const row = document.createElement('tr');
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
      </td>
    `;
    farmlandTableBody.appendChild(row);
    // Add event listener for the "Plant the Field" button
    row.querySelector('.plant-field-btn').addEventListener('click', () => {
      const resourceSelect = row.querySelector('.resource-select');
      const selectedResource = resourceSelect.value;
      plantField(index, selectedResource);
    });
  });
}
function plantField(index, resourceName) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  if (farmlands[index]) {
    farmlands[index].plantedResource = resourceName; // Update plantedResource
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    addConsoleMessage(`Field ID ${farmlands[index].id} has been planted with ${resourceName}.`);
    displayOwnedFarmland(); // Refresh the table display
  }
}

export { buyLand, Farmland, displayOwnedFarmland, plantField };



