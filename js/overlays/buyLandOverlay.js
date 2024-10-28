// js/overlays/buyLandOverlay.js

import { getRandomName, getLastId, Farmland } from '../farmland.js';
import { addConsoleMessage } from '../console.js';
import { displayOwnedFarmland } from '../farmland.js';

document.addEventListener('DOMContentLoaded', () => {
    // Fetch DOM elements
    const buyLandBtn = document.getElementById('buy-land-btn');
    const overlay = document.getElementById('buyLandOverlay');
    const closeOverlayBtn = document.getElementById('closeOverlay');
    const farmlandOptionsTable = document.getElementById('farmland-options');
    // Bind events
    buyLandBtn.addEventListener('click', displayFarmlandOptions);
    closeOverlayBtn.addEventListener('click', closeOverlay);
    window.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });
    function displayFarmlandOptions() {
        const numberOfOptions = 5;
        const farmlands = [];
        for (let i = 0; i < numberOfOptions; i++) {
            const id = getLastId(farmlands) + 1;
            const name = getRandomName();
            const farmland = new Farmland(id, name, "Italy", "Piedmont", 100);
            farmlands.push(farmland);
        }
        farmlandOptionsTable.innerHTML = '';
        farmlands.forEach(farmland => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${farmland.name}</td>
                <td>${farmland.country}</td>
                <td>${farmland.region}</td>
                <td>${farmland.acres} Acres</td>
                <td><button class="btn btn-primary buy-farmland-btn">Buy</button></td>
            `;
            row.querySelector('.buy-farmland-btn').addEventListener('click', () => buySelectedFarmland(farmland));
            farmlandOptionsTable.appendChild(row);
        });
        overlay.style.display = 'block';
    }
    function buySelectedFarmland(farmland) {
        const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
        ownedFarmlands.push(farmland);
        localStorage.setItem('ownedFarmlands', JSON.stringify(ownedFarmlands));
        addConsoleMessage(`Purchased: <strong>${farmland.name}</strong>, ${farmland.country} - ${farmland.region} (${farmland.acres} Acres)`);
        closeOverlay(); // Close the overlay after purchase
    }
    function closeOverlay() {
        overlay.style.display = 'none';
        displayOwnedFarmland(); // Refresh the owned farmlands display
    }
});