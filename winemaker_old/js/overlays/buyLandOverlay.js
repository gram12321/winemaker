import { createFarmland, getLastId, getRandomAcres } from '../farmland.js';
import { addConsoleMessage } from '/js/console.js';
import { getColorClass, formatNumber, getFlagIconHTML, formatLandSizeWithUnit } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor } from '../names.js';
import { getUnit, convertToCurrentUnit } from '../settings.js';
import { addTransaction } from '/js/finance.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js';
import { addFarmland } from '../database/adminFunctions.js';
import { showStandardOverlay, setupStandardOverlayClose, hideOverlay } from './overlayUtils.js';

// Show the overlay
export function showBuyLandOverlay() {
    const numberOfOptions = 5;
    const farmlandOptions = generateFarmlandOptions(numberOfOptions);
    const overlayContent = createBuyLandOverlayHTML(farmlandOptions);
    const overlayContainer = showStandardOverlay(overlayContent);
    setupBuyLandOverlayListeners(overlayContainer, farmlandOptions);
}

// Create the overlay HTML
function createBuyLandOverlayHTML(farmlandOptions) {
    const selectedUnit = getUnit();
    const conversionFactor = (selectedUnit === 'hectares') ? 2.47105 : 1;

    return `
        <section id="vineyard-section" class="overlay-section card mb-4">
            <div class="card-header text-white d-flex justify-content-between align-items-center">
                <h3 class="h5 mb-0">Available Farmlands</h3>
                <button class="close-btn btn btn-light btn-sm">Close</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover overlay-table">
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
                            ${farmlandOptions.map(farmland => {
                                const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
                                const colorClass = getColorClass(aspectRating);
                                const priceFactorPerAcre = calculateAndNormalizePriceFactor(farmland.country, farmland.region, farmland.altitude, farmland.aspect);
                                const landValuePerUnit = parseFloat(priceFactorPerAcre * conversionFactor);
                                const landSize = parseFloat(convertToCurrentUnit(farmland.acres));
                                const totalPrice = landSize * landValuePerUnit;
                                const formattedSize = landSize < 10 ? landSize.toFixed(2) : formatNumber(landSize);

                                farmland.totalPrice = totalPrice;

                                return `
                                    <tr>
                                        <td>${farmland.name}</td>
                                        <td>${getFlagIconHTML(farmland.country)} ${farmland.country}</td>
                                        <td>${farmland.region}</td>
                                        <td>${formattedSize} ${selectedUnit}</td>
                                        <td>${farmland.soil}</td>
                                        <td>${farmland.altitude}</td>
                                        <td>${farmland.aspect} (<span class="${colorClass}">${formatNumber(aspectRating, 2)}</span>)</td>
                                        <td>${formatNumber(landValuePerUnit)}€</td>
                                        <td>${formatNumber(totalPrice)}€</td>
                                        <td><button class="btn btn-light btn-sm buy-farmland-btn">Buy</button></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>`;
}

// Setup event listeners
function setupBuyLandOverlayListeners(overlayContainer, farmlandOptions) {
    setupStandardOverlayClose(overlayContainer);

    const buyButtons = overlayContainer.querySelectorAll('.buy-farmland-btn');
    buyButtons.forEach((button, index) => {
        button.addEventListener('click', () => buySelectedFarmland(farmlandOptions[index]));
    });
}

// Helper functions
function generateFarmlandOptions(numberOfOptions) {
    const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const newFarmlandOptions = [];

    while (newFarmlandOptions.length < numberOfOptions) {
        const id = getLastId(ownedFarmlands.concat(newFarmlandOptions)) + 1;
        const acres = getRandomAcres();
        const farmland = createFarmland(id, acres);
        const isOwned = ownedFarmlands.some(f => f.name === farmland.name);
        if (!isOwned) {
            newFarmlandOptions.push(farmland);
        }
    }
    return newFarmlandOptions;
}

function buySelectedFarmland(farmland) {
    const totalPrice = farmland.totalPrice;
    const currentMoney = parseFloat(localStorage.getItem('money') || '0');

    if (currentMoney < totalPrice) {
        addConsoleMessage(`Insufficient funds to purchase: <strong>${farmland.name}</strong> in ${farmland.region}, ${getFlagIconHTML(farmland.country)}${farmland.country}. Total cost is <strong>${formatNumber(totalPrice)}€</strong>, but you only have <strong>${formatNumber(currentMoney)}€</strong>.`);
        return;
    }

    addTransaction('Expense', `Purchase of ${farmland.name}`, -totalPrice);
    addFarmland(farmland);
    addConsoleMessage(`Land successfully purchased: <strong>${farmland.name}</strong>, in ${farmland.region}, ${getFlagIconHTML(farmland.country)}${farmland.country} total size of (${formatLandSizeWithUnit(farmland.acres)}) for <strong>${formatNumber(totalPrice)}€</strong>.`);
    displayFarmland();
    hideOverlay(document.querySelector('.overlay.active'));
}