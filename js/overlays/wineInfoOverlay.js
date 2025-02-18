import { showModalOverlay } from './overlayUtils.js';
import { createTextCenter } from '../components/createOverlayHTML.js';
import { getColorClass } from '../utils.js';
import { archetypes, balanceCalculator } from '../utils/balanceCalculator.js';

export function showWineInfoOverlay(wineItem) {
    const overlayContainer = showModalOverlay('wineInfoOverlay', createWineInfoOverlayHTML(wineItem));
    setupWineInfoEventListeners(overlayContainer, overlayContainer);
    return overlayContainer;
}

function calculateWineBalance(wine) {
    // Create wine data object for balance calculation
    const wineData = {
        sweetness: wine.sweetness,
        acidity: wine.acidity,
        tannins: wine.tannins,
        body: wine.body,
        spice: wine.spice,
        aroma: wine.aroma
    };

    let bestScore = 0;
    let bestArchetype = null;
    let bestDebugInfo = null;

    for (const [key, archetype] of Object.entries(archetypes)) {
        const score = balanceCalculator(wineData, archetype);
        if (score > bestScore) {
            bestScore = score;
            bestArchetype = archetype.name;
            bestDebugInfo = score;
        }
    }

    return {
        score: bestScore,
        archetype: bestArchetype,
        debugInfo: bestDebugInfo
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
                    ${balanceInfo.archetype ? `<tr><td>Best Archetype</td><td>${balanceInfo.archetype}</td></tr>` : ''}
                    <tr><td>Amount</td><td>${formatAmount(wine)}</td></tr>
                    <tr><td>State</td><td>${wine.state}</td></tr>
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
                        sweetness: wine.sweetness,
                        acidity: wine.acidity,
                        tannins: wine.tannins,
                        body: wine.body,
                        spice: wine.spice,
                        aroma: wine.aroma
                    }).map(([trait, value]) => {
                        const colorClass = getColorClass(value);
                        return `
                            <tr>
                                <td>${trait.charAt(0).toUpperCase() + trait.slice(1)}</td>
                                <td class="${colorClass}">${(value * 100).toFixed(0)}%</td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

    return `
        <div class="overlay-card">
            <div class="imgbox">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">${wine.resource.name} (${wine.vintage})</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <img src="/assets/icon/wine/icon_${wine.resource.name.toLowerCase()}.webp" 
                     class="card-img-top process-image mx-auto d-block" 
                     alt="${wine.resource.name}">
            </div>
            <div class="info-grid">
                ${baseInfoSection}
                ${characteristicsSection}
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
