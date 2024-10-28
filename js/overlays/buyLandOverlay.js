// js/overlays/buyLandOverlay.js

import { createFarmland, getLastId, getRandomName } from '../farmland.js';
import { addConsoleMessage } from '/js/console.js';
import { displayOwnedFarmland } from '/js/farmland.js';
import { getFlagIcon } from '../utils.js';  // Import the flag icon utility function

document.addEventListener('DOMContentLoaded', () => {
    const buyLandBtn = document.getElementById('buy-land-btn');
    const overlay = document.getElementById('buyLandOverlay');
    const closeOverlayBtn = document.getElementById('closeOverlay');
    const farmlandTableContainer = document.getElementById('farmland-table-container');

    buyLandBtn.addEventListener('click', displayFarmlandOptions);
    closeOverlayBtn.addEventListener('click', closeOverlay);
    window.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });

    function displayFarmlandOptions() {
        const numberOfOptions = 5;
        const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

        // Generate new farmland options ensuring they do not duplicate existing owned ones
        const newFarmlandOptions = [];
        while (newFarmlandOptions.length < numberOfOptions) {
            const id = getLastId(ownedFarmlands.concat(newFarmlandOptions)) + 1;
            const name = getRandomName();
            const farmland = createFarmland(id, name, "Italy", "Piedmont", 100, 'Loam', '300m', 'South-facing');

            // Check if the farmland is already owned
            const isOwned = ownedFarmlands.some(f => f.name === farmland.name);
            if (!isOwned) {
                newFarmlandOptions.push(farmland);
            }
        }

        // Clear existing content, including headers
        farmlandTableContainer.innerHTML = '';

        // Construct the table structure
        let tableHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Country</th>
                <th>Region</th>
                <th>Size</th>
                <th>Soil</th>
                <th>Altitude</th>
                <th>Aspect</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
        `;

        newFarmlandOptions.forEach(farmland => {
            const flagIconHTML = getFlagIcon(farmland.country); // Get the flag icon HTML
            tableHTML += `
              <tr>
                <td>${farmland.name}</td>
                <td>${flagIconHTML} ${farmland.country}</td>
                <td>${farmland.region}</td>
                <td>${farmland.acres} Acres</td>
                <td>${farmland.soil}</td>
                <td>${farmland.altitude}</td>
                <td>${farmland.aspect}</td>
                <td><button class="btn btn-primary buy-farmland-btn">Buy</button></td>
              </tr>
            `;
        });

        tableHTML += `
            </tbody>
          </table>
        `;

        // Set table HTML and attach event listeners
        farmlandTableContainer.innerHTML = tableHTML;

        const buyButtons = farmlandTableContainer.querySelectorAll('.buy-farmland-btn');
        buyButtons.forEach((button, index) => {
            button.addEventListener('click', () => buySelectedFarmland(newFarmlandOptions[index]));
        });

        overlay.style.display = 'block';
    }

    function buySelectedFarmland(farmland) {
        const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
        ownedFarmlands.push(farmland);
        localStorage.setItem('ownedFarmlands', JSON.stringify(ownedFarmlands));

        addConsoleMessage(`Purchased: <strong>${farmland.name}</strong>, ${farmland.country} - ${farmland.region} (${farmland.acres} Acres)`);
        closeOverlay();
    }

    function closeOverlay() {
        overlay.style.display = 'none';
        displayOwnedFarmland(); // Refresh the owned farmlands display
    }
});