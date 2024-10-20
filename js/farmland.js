import { addConsoleMessage } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names

class Farmland {
  constructor(id, name, country, region, acres, planted = 0) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
    this.planted = planted;
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

  farmlands.forEach((farmland, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${farmland.id}</td>
      <td>${farmland.name}</td>
      <td>${farmland.country}</td>
      <td>${farmland.region}</td>
      <td>${farmland.acres}</td>
      <td>${farmland.planted ? 'Planted' : 'Empty'}</td>
      <td><button class="btn btn-warning plant-field-btn">Plant the Field</button></td>
    `;
    farmlandTableBody.appendChild(row);

    // Add event listener for the "Plant the Field" button
    row.querySelector('.plant-field-btn').addEventListener('click', () => plantField(index));
  });
}

function plantField(index) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  if (farmlands[index]) {
    farmlands[index].planted = 1; // Set the "Planted" status to 1
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands)); // Save changes to localStorage
    addConsoleMessage(`Field ID ${farmlands[index].id} has been planted.`);
    displayOwnedFarmland(); // Refresh the table display
  }
}

export { buyLand, Farmland, displayOwnedFarmland, plantField };



