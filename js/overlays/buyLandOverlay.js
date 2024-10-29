import { createFarmland, getLastId, getRandomName, getRandomAcres } from '../farmland.js'; // Import getRandomAcres
import { addConsoleMessage } from '/js/console.js';
import { displayOwnedFarmland } from '/js/farmland.js';
import { getFlagIcon, getColorClass } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor  } from '../names.js';
import { getUnit, convertToCurrentUnit } from '../settings.js';
import { formatNumber, getFlagIconHTML, formatLandSizeWithUnit  } from '../utils.js';
import { deductMoney } from '../endDay.js';

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
            const acres = getRandomAcres();

            // Create the farmland with random attributes
            const farmland = createFarmland(id, acres);

            const isOwned = ownedFarmlands.some(f => f.name === farmland.name);
            if (!isOwned) {
                newFarmlandOptions.push(farmland);
            }
        }

        const selectedUnit = getUnit(); // Get the current land unit setting
        const conversionFactor = (selectedUnit === 'hectares') ? 2.47105 : 1; // Conversion factor
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
                        <th>Price</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        newFarmlandOptions.forEach(farmland => {
            const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
            const colorClass = getColorClass(aspectRating);

            const priceFactorPerAcre = calculateAndNormalizePriceFactor(farmland.country, farmland.region, farmland.altitude, farmland.aspect);
            const landValuePerUnit = parseFloat(priceFactorPerAcre * conversionFactor);
            const landSize = parseFloat(convertToCurrentUnit(farmland.acres));
            const totalPrice = landSize * landValuePerUnit;

            // Storing the totalPrice in the farmland object for easy access
            farmland.totalPrice = totalPrice;

            tableHTML += `
                <tr>
                    <td>${farmland.name}</td>
                    <td>${getFlagIconHTML(farmland.country)} ${farmland.country}</td>
                    <td>${farmland.region}</td>
                    <td>${formatNumber(landSize)} ${selectedUnit}</td>
                    <td>${farmland.soil}</td>
                    <td>${farmland.altitude}</td>
                    <td class="${colorClass}">${farmland.aspect} (${formatNumber(aspectRating, 2)})</td>
                    <td>${formatNumber(landValuePerUnit)}€</td>
                    <td>${formatNumber(totalPrice)}€</td>
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

        const totalPrice = farmland.totalPrice; // Ensure this is correctly set

        deductMoney(totalPrice);

        ownedFarmlands.push(farmland);
        localStorage.setItem('ownedFarmlands', JSON.stringify(ownedFarmlands));

        addConsoleMessage(`Land successfully purchased: <strong>${farmland.name}</strong>, in ${farmland.region}, ${getFlagIconHTML(farmland.country)}${farmland.country} total size of (${formatLandSizeWithUnit(farmland.acres)}) for <strong>${formatNumber(totalPrice)}€</strong>.`);

        closeOverlay();
    }

    function closeOverlay() {
        overlay.style.display = 'none';
        displayOwnedFarmland();
    }
});