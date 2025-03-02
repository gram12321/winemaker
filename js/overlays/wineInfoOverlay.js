import { showModalOverlay } from './overlayUtils.js';
import { createTextCenter, createInfoTable, createIconLabel } from '../components/createOverlayHTML.js';
import { getColorClass } from '../utils.js';
import { balanceCalculator, calculateNearestArchetype, baseBalancedRanges, applyRangeAdjustments  } from '../utils/balanceCalculator.js';
import { createCharacteristicBar } from '../components/characteristicBar.js';

export function showWineInfoOverlay(wineItem) {
    const overlayContainer = showModalOverlay('wineInfoOverlay', createWineInfoOverlayHTML(wineItem));
    setupWineInfoEventListeners(overlayContainer, overlayContainer);
    return overlayContainer;
}

function calculateWineBalance(wine) {

    const { archetype, distance, qualifies } = calculateNearestArchetype(wine);
    const score = balanceCalculator(wine, archetype);

    return {
        score: score,
        archetype: archetype.name,
        qualifies: qualifies,
        distance: distance
    };
}

function createWineInfoOverlayHTML(wine) {
    const balanceInfo = calculateWineBalance(wine);
    const displayInfo = wine.getDisplayInfo();
    const balanceColorClass = getColorClass(balanceInfo.score);

    const baseInfoSection = `
        <div class="info-section">
            ${createTextCenter({ text: 'Product Information', isHeadline: true })}
            ${createInfoTable({
                rows: [
                    { label: 'Name', value: displayInfo.name },
                    { label: 'Vintage', value: displayInfo.vintage },
                    { label: 'Field', value: displayInfo.fieldName },
                    { label: 'Quality', value: displayInfo.qualityDisplay },
                    { 
                        label: 'Balance', 
                        value: `${(balanceInfo.score * 100).toFixed(1)}%`,
                        valueClass: balanceColorClass 
                    },
                    { 
                        label: balanceInfo.qualifies ? 'Archetype' : 'Nearest Archetype',
                        value: `${balanceInfo.archetype}${!balanceInfo.qualifies ? 
                            ` (${(balanceInfo.distance * 100).toFixed(1)}% away)` : ''}`
                    },
                    { label: 'Amount', value: formatAmount(wine) },
                    { 
                        label: 'State',
                        icon: displayInfo.state.toLowerCase(),
                        value: ''
                    }
                ]
            })}
        </div>`;

    // Show characteristics section using createTable
    const characteristicsSection = `
        <div class="info-section">
            ${createTextCenter({ 
                text: `${displayInfo.state} Characteristics`, 
                isHeadline: true 
            })}
            ${createTable({
                className: 'data-table',
                headers: [],
                id: 'characteristics-table',
                tableClassName: 'table'
            })}
            <tbody>
                ${Object.entries(displayInfo.characteristics)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([trait, value]) => createCharacteristicRow(trait, value, displayInfo.characteristics))
                    .join('')}
            </tbody>
        </div>`;

    // Use createOverlayHTML for consistent structure
    return createOverlayHTML({
        title: `${displayInfo.fieldName}, ${displayInfo.resource.name} (${displayInfo.vintage})`,
        content: `
            <div class="overlay-card">
                <div class="imgbox">
                    <img src="/assets/icon/grape/icon_${displayInfo.resource.name.toLowerCase()}.webp" 
                         class="card-img-top process-image mx-auto d-block" 
                         alt="${displayInfo.resource.name}">
                </div>
                <div class="info-grid">
                    ${baseInfoSection}
                    ${characteristicsSection}
                </div>
            </div>
        `,
        buttonText: '',  // No action button needed
        isModal: true
    });
}

function createCharacteristicRow(trait, value, characteristics) {
    return `<tr>
        <td>${createIconLabel({ icon: trait, text: trait.charAt(0).toUpperCase() + trait.slice(1) })}</td>
        <td class="characteristic-bar-cell">
            ${createCharacteristicBar(trait, value, characteristics)}
        </td>
    </tr>`;
}

function createCharacteristicBar(trait, value, wine) {
    const [minBalance, maxBalance] = baseBalancedRanges[trait] || [0, 1];
    
    const adjustedRanges = applyRangeAdjustments(wine, baseBalancedRanges);
    return createCharacteristicBar(trait, value, minBalance, maxBalance, adjustedRanges[trait]);
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
