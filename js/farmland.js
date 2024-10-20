// Define the Farmland class
class Farmland {
  // Constructor to initialize the properties
  constructor(id, name, country, region, acres) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
  }
}

// Export the Farmland class to make it available for import in other scripts
export { Farmland };



import { initializeSidebar } from '/js/database/loadSidebar.js';
import { addConsoleMessage } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names

document.addEventListener('DOMContentLoaded', function() {
  // Initialize sidebar
  fetch('/html/sidebar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('sidebar-wrapper').innerHTML = data;
      initializeSidebar();
    });

  const farmlandTableBody = document.querySelector('#farmland-table tbody');
  const buyLandButton = document.getElementById('buy-land-btn');

  // Load farmland instances from localStorage
  displayOwnedFarmland();

  if (buyLandButton) {
    buyLandButton.addEventListener('click', buyLand);
  }
});

function createFarmland(id, name, country, region, acres) {
  return new Farmland(id, name, country, region, acres);
}

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
  const farmlandTableBody = document.querySelector('#farmland-table tbody');
  farmlandTableBody.innerHTML = ''; // Clear existing rows

  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

  farmlands.forEach(farmland => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${farmland.id}</td>
      <td>${farmland.name}</td>
      <td>${farmland.country}</td>
      <td>${farmland.region}</td>
      <td>${farmland.acres}</td>
    `;
    farmlandTableBody.appendChild(row);
  });
}

export { buyLand, displayOwnedFarmland }