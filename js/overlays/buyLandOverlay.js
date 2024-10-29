import { createFarmland, getLastId, getRandomName } from '../farmland.js';
import { addConsoleMessage } from '/js/console.js';
import { displayOwnedFarmland } from '/js/farmland.js';
import { getFlagIcon } from '../utils.js';
import { regionAspectRatings } from '../names.js'; // Import the aspect ratings
import { getColorClass } from '../utils.js'; // Import the color class function

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

        const newFarmlandOptions = [];
        while (newFarmlandOptions.length < numberOfOptions) {
            const id = getLastId(ownedFarmlands.concat(newFarmlandOptions)) + 1;
            const name = getRandomName();
            const farmland = createFarmland(id, name, 100);

            const isOwned = ownedFarmlands.some(f => f.name === farmland.name);
            if (!isOwned) {
                newFarmlandOptions.push(farmland);
            }
        }

        farmlandTableContainer.innerHTML = '';

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
            const flagIconHTML = getFlagIcon(farmland.country);

            // Get aspect rating from aspectRatings
            const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
            const colorClass = getColorClass(aspectRating); // Get corresponding color class

            tableHTML += `
              <tr>
                <td>${farmland.name}</td>
                <td>${flagIconHTML} ${farmland.country}</td>
                <td>${farmland.region}</td>
                <td>${farmland.acres} Acres</td>
                <td>${farmland.soil}</td>
                <td>${farmland.altitude}</td>
                <td class="${colorClass}">${farmland.aspect} (${aspectRating.toFixed(2)})</td>
                <td><button class="btn btn-primary buy-farmland-btn">Buy</button></td>
              </tr>
            `;
        });

        tableHTML += `
            </tbody>
          </table>
        `;

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
        displayOwnedFarmland();
    }
});