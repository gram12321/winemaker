import { formatNumber, getColorClass, getFlagIcon } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor } from '/js/names.js';
import { calculateAgeContribution, calculateLandValueContribution, calculatePrestigeRankingContribution, calculateFragilityBonusContribution } from '/js/farmland.js';
import { showResourceInfoOverlay } from './resourceInfoOverlay.js';
import { showModalOverlay } from './overlayUtils.js';
import { createTextCenter, createTable, createOverlayHTML, createInfoTable } from '../components/createOverlayHTML.js';
import { upgrades } from '../upgrade.js';

export function showFarmlandOverlay(farmlandData) {
    const displayInfo = calculateFarmlandDisplayInfo(farmlandData);
    const content = createFarmlandOverlayHTML(farmlandData, displayInfo);
    const overlayContainer = showModalOverlay('farmlandOverlay', content);
    setupFarmlandOverlayEventListeners(overlayContainer, overlayContainer, farmlandData);
    return overlayContainer;
}

function calculateFarmlandDisplayInfo(farmlandData) {
    return {
        aspectRating: regionAspectRatings[farmlandData.country][farmlandData.region][farmlandData.aspect],
        colorClass: getColorClass(regionAspectRatings[farmlandData.country][farmlandData.region][farmlandData.aspect]),
        landValue: calculateAndNormalizePriceFactor(farmlandData.country, farmlandData.region, farmlandData.altitude, farmlandData.aspect),
        flagIcon: getFlagIcon(farmlandData.country),
        farmlandPrestige: farmlandData.farmlandPrestige || 0,
        ageContribution: calculateAgeContribution(farmlandData.vineAge),
        landValueContribution: calculateLandValueContribution(farmlandData.landvalue),
        prestigeRankingContribution: calculatePrestigeRankingContribution(farmlandData.region, farmlandData.country),
        fragilityBonusContribution: calculateFragilityBonusContribution(farmlandData.plantedResourceName),
        formattedSize: farmlandData.acres < 10 ? farmlandData.acres.toFixed(2) : formatNumber(farmlandData.acres),
        prestigeColorClass: getColorClass(farmlandData.farmlandPrestige || 0),
        healthColorClass: getColorClass(farmlandData.farmlandHealth)
    };
}

function createFarmlandOverlayHTML(farmlandData, displayInfo) {
    return createOverlayHTML({
        title: `${displayInfo.flagIcon} ${farmlandData.name}, ${farmlandData.region}, ${farmlandData.country}${farmlandData.plantedResourceName ? ` | ${farmlandData.plantedResourceName}` : ''}`,
        content: createFarmlandContent(farmlandData, displayInfo),
        buttonText: '',
        isModal: true
    });
}

function createFarmlandContent(farmlandData, displayInfo) {
    const prestigeTooltip = `
        Age Contribution: ${formatNumber(displayInfo.ageContribution * 100)}%
        Land Value Contribution: ${formatNumber(displayInfo.landValueContribution * 100)}%
        Prestige Ranking Contribution: ${formatNumber(displayInfo.prestigeRankingContribution * 100)}%
        Fragility Bonus Contribution: ${formatNumber(displayInfo.fragilityBonusContribution * 100)}%
    `;

    return `
        <div class="overlay-card farmland-overlay">
            <div class="imgbox">
                <img src="/assets/pic/farming_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Farming">
            </div>
            <div class="overlay-section-wrapper">
                <div class="info-grid">
                    ${createLandDetailsSection(farmlandData, displayInfo)}
                    ${createFieldStatusSection(farmlandData, displayInfo, prestigeTooltip)}
                </div>
            </div>
        </div>
    `;
}

function createLandDetailsSection(farmlandData, displayInfo) {
    return `
        <div class="info-section">
            ${createTextCenter({ text: 'Land Details', isHeadline: true })}
            ${createInfoTable({
                rows: [
                    { 
                        label: 'Country', 
                        value: `${displayInfo.flagIcon} ${farmlandData.country}` 
                    },
                    { 
                        label: 'Region', 
                        value: farmlandData.region 
                    },
                    { 
                        label: 'Acres', 
                        value: displayInfo.formattedSize 
                    }
                ],
                className: 'data-table farmland-info-table'  // Add farmland-info-table class
            })}

            ${createTextCenter({ text: 'Terrain Details', isHeadline: true })}
            ${createInfoTable({
                rows: [
                    { 
                        label: 'Soil', 
                        value: farmlandData.soil 
                    },
                    { 
                        label: 'Altitude', 
                        value: `${farmlandData.altitude}m` 
                    },
                    { 
                        label: 'Aspect',
                        value: `${farmlandData.aspect} (${formatNumber(displayInfo.aspectRating * 100)}%)`,
                        valueClass: displayInfo.colorClass 
                    }
                ],
                className: 'data-table farmland-info-table'  // Add farmland-info-table class
            })}
        </div>
    `;
}

function createFieldStatusSection(farmlandData, displayInfo, prestigeTooltip) {
    return `
        <div class="info-section">
            ${createTextCenter({ text: 'Field Status', isHeadline: true })}
            ${createInfoTable({
                rows: [
                    { label: 'Status', value: farmlandData.status },
                    { label: 'Ripeness', value: formatNumber(farmlandData.ripeness ?? 0, 2) },
                    { label: 'Land Value', value: `€${formatNumber(displayInfo.landValue)}` },
                    { label: 'Density', value: formatNumber(farmlandData.density || 0) },
                    { 
                        label: 'Planted Resource', 
                        value: farmlandData.plantedResourceName || 'None',
                        id: 'plantedResource'
                    },
                    { label: 'Farming Method', value: getFarmingMethodText(farmlandData) },
                    { 
                        label: 'Farmland Prestige',
                        value: `${formatNumber(displayInfo.farmlandPrestige * 100)}%`,
                        valueClass: displayInfo.prestigeColorClass,
                        tooltip: prestigeTooltip
                    },
                    { 
                        label: 'Farmland Health',
                        value: `${formatNumber(farmlandData.farmlandHealth * 100)}%`,
                        valueClass: displayInfo.healthColorClass
                    },
                    { 
                        label: 'Field Upgrades',
                        value: getUpgradeIconsHTML(farmlandData)
                    }
                ],
                className: 'data-table farmland-info-table'
            })}
        </div>`;
}

function getFarmingMethodText(farmlandData) {
    if (farmlandData.conventional === 'Non-Conventional') {
        return `${farmlandData.conventional} (${farmlandData.organicYears}/3 years organic)`;
    }
    if (farmlandData.conventional === 'Ecological') {
        return `${farmlandData.conventional} (Certified)`;
    }
    return farmlandData.conventional;
}

function setupFarmlandOverlayEventListeners(details, overlay, farmlandData) {
    // Add close button event listener
    const closeBtn = details.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.remove();  // Use remove() instead of style.display = 'none'
        });
    }

    // Add event listener to the Planted Resource row
    const plantedResourceRow = details.querySelector('#plantedResource');
    if (plantedResourceRow && farmlandData.plantedResourceName) {
        plantedResourceRow.addEventListener('click', () => {
            showResourceInfoOverlay(farmlandData.plantedResourceName);
        });
        plantedResourceRow.style.cursor = 'pointer';
    }

    // Add click event listener to the overlay for outside clicks
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();  // Use remove() instead of style.display = 'none'
        }
    });
}

function getUpgradeIconsHTML(farmland) {
    if (!farmland.upgrades || farmland.upgrades.length === 0) {
        return 'None';
    }

    return farmland.upgrades.map(upgradeId => {
        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade) return '';
        
        const iconName = upgrade.name.toLowerCase().replace(/\s+/g, '');
        return `<img src="../assets/icon/small/upgrades/${iconName}.webp" 
                    alt="${upgrade.name}" 
                    title="${upgrade.name}"
                    class="upgrade-icon"
                    onerror="this.style.display='none'">`;
    }).join(' ');
}

