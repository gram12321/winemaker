import { showModalOverlay } from './overlayUtils.js';
import { createTextCenter } from '../components/createOverlayHTML.js';
import { getColorClass } from '../utils.js';
import { balanceCalculator, calculateNearestArchetype, baseBalancedRanges, applyRangeAdjustments  } from '../utils/balanceCalculator.js';

export function showWineInfoOverlay(wineItem) {
    const overlayContainer = showModalOverlay('wineInfoOverlay', createWineInfoOverlayHTML(wineItem));
    setupWineInfoEventListeners(overlayContainer, overlayContainer);
    return overlayContainer;
}

function calculateWineBalance(wine) {
    const wineData = {
        acidity: wine.acidity,
        aroma: wine.aroma,
        body: wine.body,
        spice: wine.spice,
        sweetness: wine.sweetness,
        tannins: wine.tannins
    };

    // Get nearest archetype and check if wine qualifies
    const { archetype, distance, qualifies } = calculateNearestArchetype(wineData);
    
    // Calculate balance score for the nearest archetype
    const score = balanceCalculator(wineData, archetype);

    return {
        score: score,
        archetype: archetype.name,
        qualifies: qualifies,
        distance: distance
    };
}

function createWineInfoOverlayHTML(wine) {
    const balanceInfo = calculateWineBalance(wine);
    const balanceColorClass = getColorClass(balanceInfo.score);

    // Create base information section
    const baseInfoSection = `
        <div class="info-section">
            ${createTextCenter({ text: '<h4>Product Information</h4>' })}
            <table class="data-table">
                <tbody>
                    <tr><td>Name</td><td>${wine.resource.name}</td></tr>
                    <tr><td>Vintage</td><td>${wine.vintage}</td></tr>
                    <tr><td>Field</td><td>${wine.fieldName}</td></tr>
                    <tr><td>Quality</td><td class="${getColorClass(wine.quality)}">${(wine.quality * 100).toFixed(0)}%</td></tr>
                    <tr><td>Balance</td><td class="${balanceColorClass}">${(balanceInfo.score * 100).toFixed(1)}%</td></tr>
                    <tr><td>${balanceInfo.qualifies ? 'Archetype' : 'Nearest Archetype'}</td>
                        <td>${balanceInfo.archetype}${!balanceInfo.qualifies ? 
                            ` (${(balanceInfo.distance * 100).toFixed(1)}% away)` : 
                            ''}</td></tr>
                    <tr><td>Amount</td><td>${formatAmount(wine)}</td></tr>
                    <tr>
                        <td>State</td>
                        <td>
                            <img src="/assets/icon/small/${wine.state.toLowerCase()}.png" 
                                 alt="${wine.state}" 
                                 class="characteristic-icon">
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>`;

    // Show characteristics section for all stages
    const characteristicsSection = `
        <div class="info-section">
            ${createTextCenter({ text: `<h4>${wine.state} Characteristics</h4>` })}
            <table class="data-table">
                <tbody>
                    ${Object.entries({
                        acidity: wine.acidity,
                        aroma: wine.aroma,
                        body: wine.body,
                        spice: wine.spice,
                        sweetness: wine.sweetness,
                        tannins: wine.tannins
                    }).sort(([a], [b]) => a.localeCompare(b)).map(([trait, value]) => `
                        <tr>
                            <td>
                                <img src="/assets/icon/small/${trait}.png" 
                                     alt="${trait}" 
                                     class="characteristic-icon">
                                ${trait.charAt(0).toUpperCase() + trait.slice(1)}
                            </td>
                            <td class="characteristic-bar-cell">
                                ${createCharacteristicBar(trait, value, wine)}  <!-- Pass wine object here -->
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    return `
        <div class="overlay-card">
            <div class="imgbox">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">${wine.fieldName}, ${wine.resource.name} (${wine.vintage})</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <img src="/assets/icon/grape/icon_${wine.resource.name.toLowerCase()}.webp" 
                     class="card-img-top process-image mx-auto d-block" 
                     alt="${wine.resource.name}">
            </div>
            <div class="info-grid">
                ${baseInfoSection}
                ${characteristicsSection}
            </div>
        </div>`;
}

function createCharacteristicBar(trait, value, wine) {  // Add wine parameter here
    // Get both base and adjusted ranges
    const [minBalance, maxBalance] = baseBalancedRanges[trait] || [0, 1]; // Add fallback values
    
    // Create wineData object with all characteristics for adjustment calculation
    const wineData = {
        acidity: wine.acidity,
        aroma: wine.aroma,
        body: wine.body,
        spice: wine.spice,
        sweetness: wine.sweetness,
        tannins: wine.tannins
    };

    const adjustedRanges = applyRangeAdjustments(wineData, baseBalancedRanges);
    const [adjustedMin, adjustedMax] = adjustedRanges[trait] || [0, 1]; // Add fallback values
    
    // Calculate the center range (25% on each side of middle)
    const rangeSize = adjustedMax - adjustedMin;
    const centerSize = rangeSize * 0.25;
    const adjustedMiddle = (adjustedMin + adjustedMax) / 2;
    const centerMin = adjustedMiddle - centerSize;
    const centerMax = adjustedMiddle + centerSize;
    
    return `
        <div class="characteristic-bar-container">
            <div class="characteristic-bar">
                <!-- Background bar -->
                <div class="bar-background"></div>
                <!-- Base balanced range (green zone) -->
                <div class="balanced-range" style="left: ${minBalance * 100}%; width: ${(maxBalance - minBalance) * 100}%"></div>
                <!-- Lower part of adjusted range -->
                <div class="adjusted-range adjusted-range-outer" style="left: ${adjustedMin * 100}%; width: ${(centerMin - adjustedMin) * 100}%"></div>
                <!-- Center optimal part -->
                <div class="adjusted-range adjusted-range-center" style="left: ${centerMin * 100}%; width: ${(centerMax - centerMin) * 100}%"></div>
                <!-- Upper part of adjusted range -->
                <div class="adjusted-range adjusted-range-outer" style="left: ${centerMax * 100}%; width: ${(adjustedMax - centerMax) * 100}%"></div>
                <!-- Value marker -->
                <div class="value-marker" style="left: ${value * 100}%"></div>
            </div>
            <div class="bar-labels">
                <span class="value-label" style="left: ${value * 100}%">${(value * 100).toFixed(0)}%</span>
            </div>
        </div>`;
}

function formatAmount(item) {
    switch(item.state) {
        case 'Bottles':
            return `${item.amount.toFixed(0)} bottles`;
        case 'Must':
            return `${item.amount.toFixed(1)} l`;
        case 'Grapes':
            return item.amount >= 1000 ? 
                `${(item.amount / 1000).toFixed(2)} t` : 
                `${item.amount.toFixed(1)} kg`;
        default:
            return `${item.amount.toFixed(1)} units`;
    }
}

function setupWineInfoEventListeners(details, overlay) {
    // Add close button functionality
    const closeBtn = details.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
    }

    // Add click outside to close
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
}
