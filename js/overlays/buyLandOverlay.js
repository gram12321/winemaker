
import { createFarmland, getLastId, getRandomAcres } from '../farmland.js';
import { addConsoleMessage } from '/js/console.js';
import { getColorClass, formatNumber, getFlagIconHTML, formatLandSizeWithUnit, formatQualityDisplay } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor } from '../names.js';
import { getUnit, convertToCurrentUnit } from '../settings.js';
import { addTransaction} from '/js/finance.js';
import { displayFarmland } from '/js/farmland.js';

export function showBuyLandOverlay() {
    const overlay = document.getElementById('buyLandOverlay');
    const farmlandTableContainer = document.getElementById('farmland-table-container');
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

    const selectedUnit = getUnit();
    const conversionFactor = (selectedUnit === 'hectares') ? 2.47105 : 1;
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

        farmland.totalPrice = totalPrice;

        tableHTML += `
            <tr>
                <td>${farmland.name}</td>
                <td>${getFlagIconHTML(farmland.country)} ${farmland.country}</td>
                <td>${farmland.region}</td>
                <td>${formatNumber(landSize)} ${selectedUnit}</td>
                <td>${farmland.soil}</td>
                <td>${farmland.altitude}</td>
                <td>${formatQualityDisplay(aspectRating)}</td>
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

    const closeButton = document.createElement('div');
    closeButton.className = 'text-right mb-2';
    closeButton.innerHTML = `
        <h3 class="h5 d-inline mr-3">Available Farmlands</h3>
        <button id="closeBuyLandOverlay" class="btn btn-light btn-sm">Close</button>
    `;
    farmlandTableContainer.appendChild(closeButton);
    farmlandTableContainer.innerHTML += tableHTML;
    const buyButtons = farmlandTableContainer.querySelectorAll('.buy-farmland-btn');
    buyButtons.forEach((button, index) => {
        button.addEventListener('click', () => buySelectedFarmland(newFarmlandOptions[index]));
    });
    overlay.style.display = 'block';
    setupCloseListeners();
}

function buySelectedFarmland(farmland) {
    const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const totalPrice = farmland.totalPrice;
    const currentMoney = parseFloat(localStorage.getItem('money') || '0');

    if (currentMoney < totalPrice) {
        addConsoleMessage(`Insufficient funds to purchase: <strong>${farmland.name}</strong> in ${farmland.region}, ${getFlagIconHTML(farmland.country)}${farmland.country}. Total cost is <strong>${formatNumber(totalPrice)}€</strong>, but you only have <strong>${formatNumber(currentMoney)}€</strong>.`);
        return;
    }

    // Log the purchase transaction and update the balance
    addTransaction('Expense', `Purchase of ${farmland.name}`, -totalPrice);

    // Add farmland to ownedFarmlands
    ownedFarmlands.push(farmland);
    localStorage.setItem('ownedFarmlands', JSON.stringify(ownedFarmlands));

    addConsoleMessage(`Land successfully purchased: <strong>${farmland.name}</strong>, in ${farmland.region}, ${getFlagIconHTML(farmland.country)}${farmland.country} total size of (${formatLandSizeWithUnit(farmland.acres)}) for <strong>${formatNumber(totalPrice)}€</strong>.`);

    // Update land display
    displayFarmland();

    // Close the overlay
    document.getElementById('buyLandOverlay').style.display = 'none';
}

// Close button event listener
function setupCloseListeners() {
    const overlay = document.getElementById('buyLandOverlay');
    const closeButton = document.getElementById('closeBuyLandOverlay');
    
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }

    // Close on clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.style.display = 'none';
        }
    });
}
