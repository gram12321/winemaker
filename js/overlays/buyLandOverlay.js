import { createFarmland, getLastId, getRandomName, getRandomAcres } from '../farmland.js'; // Import getRandomAcres
import { addConsoleMessage } from '/js/console.js';
import { displayOwnedFarmland } from '/js/farmland.js';
import { getFlagIcon, getColorClass } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor  } from '../names.js';
import { getUnit, convertToCurrentUnit } from '../settings.js';
import { formatNumber } from '../utils.js';

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
            const acres = getRandomAcres(); // Generates the size in acres

            // Create the farmland with the name generated based on its country
            const farmland = createFarmland(id, acres);
            const isOwned = ownedFarmlands.some(f => f.name === farmland.name);
            if (!isOwned) {
                newFarmlandOptions.push(farmland);
            }
        }
        const selectedUnit = getUnit(); // Get the current land unit setting
        const conversionFactor = (selectedUnit === 'hectares') ? 2.47105 : 1; // Conversion from acres to hectares
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
                        <th>Land Value (per ${selectedUnit})</th>
                        <th>Price</th> <!-- New column for total price -->
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;
        newFarmlandOptions.forEach(farmland => {
            const flagIconHTML = getFlagIcon(farmland.country);
            const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
            const colorClass = getColorClass(aspectRating);
            // Calculate total land value per acre
            const priceFactorPerAcre = calculateAndNormalizePriceFactor(farmland.country, farmland.region, farmland.altitude, farmland.aspect);
            // Adjust for selected unit (hectares vs acres)
            const landValuePerUnit = priceFactorPerAcre * conversionFactor;
            // Convert size based on current unit
            const landSize = convertToCurrentUnit(farmland.acres);
            // Calculate the total price of the land
            const totalPrice = landSize * landValuePerUnit;
            tableHTML += `
                <tr>
                    <td>${farmland.name}</td>
                    <td>${flagIconHTML} ${farmland.country}</td>
                    <td>${farmland.region}</td>
                    <td>${formatNumber(landSize)} ${selectedUnit}</td>
                    <td>${farmland.soil}</td>
                    <td>${farmland.altitude}</td>
                    <td class="${colorClass}">${farmland.aspect} (${formatNumber(aspectRating, 2)})</td>
                    <td>${formatNumber(landValuePerUnit)}€</td>
                    <td>${formatNumber(totalPrice)}€</td> <!-- Total Price -->
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