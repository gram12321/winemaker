import { showMainViewOverlay } from '../overlayUtils.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import tutorialManager from '/js/tutorial.js';
import { allResources } from '/js/resource.js';
import { initializeImporters } from '/js/classes/importerClass.js';

export function showWinepediaOverlay() {
    const overlay = showMainViewOverlay(createWinepediaOverlayHTML());
    setupWinepediaEventListeners(overlay);

    if (tutorialManager.shouldShowTutorial('WINEPEDIA')) {
        tutorialManager.showTutorial('WINEPEDIA');
    }
}

function setupWinepediaEventListeners(overlay) {
    // Add click handlers for grape cards
    const grapeCards = overlay.querySelectorAll('.grape-card');
    grapeCards.forEach(card => {
        card.addEventListener('click', () => {
            const grapeName = card.querySelector('h3').textContent;
            const grapeResource = allResources.find(r => r.name === grapeName);
            if (grapeResource) {
                showResourceInfoOverlay(grapeResource.name);
            }
        });
    });

    // Setup tab navigation
    const tabs = overlay.querySelectorAll('.winepedia-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;

            // Update active tab
            overlay.querySelectorAll('.winepedia-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            overlay.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function createWinepediaOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Winepedia</h2>

            <div class="tabs-container mb-4">
                <div class="tabs">
                    <button class="winepedia-tab active" data-target="grapeVarieties">Grape Varieties</button>
                    <button class="winepedia-tab" data-target="wineRegions">Wine Regions</button>
                    <button class="winepedia-tab" data-target="winemaking">Winemaking</button>
                    <button class="winepedia-tab" data-target="importers">Importers</button>
                </div>
            </div>

            <div class="tab-content active" id="grapeVarieties">
                <div class="grape-varieties-grid">
                    ${createGrapeVarietiesContent()}
                </div>
            </div>

            <div class="tab-content" id="wineRegions">
                <h3>Wine Regions</h3>
                <p>Content coming soon...</p>
            </div>

            <div class="tab-content" id="winemaking">
                <h3>Winemaking Process</h3>
                <p>Content coming soon...</p>
            </div>

            <div class="tab-content" id="importers">
                <div class="importers-grid">
                    ${createImportersContent()}
                </div>
            </div>
        </div>
    `;
}

function createImportersContent() {
    const importers = initializeImporters();
    let importersByCountry = {};
    
    // Group importers by country
    importers.forEach(importer => {
        if (!importersByCountry[importer.country]) {
            importersByCountry[importer.country] = [];
        }
        importersByCountry[importer.country].push(importer);
    });

    return Object.entries(importersByCountry).map(([country, countryImporters]) => `
        <div class="country-section">
            <div class="country-header">
                <span class="flag-icon flag-icon-${getCountryCode(country)}"></span>
                <h3>${country}</h3>
            </div>
            <div class="importers-grid">
                ${countryImporters.map(importer => `
                    <div class="importer-card">
                        <div class="importer-header">
                            <span class="flag-icon flag-icon-${getCountryCode(importer.country)}"></span>
                            <h4>${importer.country} Importer</h4>
                        </div>
                        <div class="importer-stats">
                            <div class="stat-item">
                                <span>Market Share:</span>
                                <strong>${importer.marketShare.toFixed(1)}%</strong>
                            </div>
                            <div class="stat-item">
                                <span>Purchasing Power:</span>
                                <strong>${(importer.purchasingPower * 100).toFixed(0)}%</strong>
                            </div>
                            <div class="stat-item">
                                <span>Wine Tradition:</span>
                                <strong>${(importer.wineTradition * 100).toFixed(0)}%</strong>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function getCountryCode(country) {
    const countryCodeMap = {
        'France': 'fr',
        'Germany': 'de',
        'Italy': 'it',
        'Spain': 'es',
        'United States': 'us'
    };
    return countryCodeMap[country] || 'unknown';
}

function getGrapeDescription(grape) {
    const descriptions = {
        'Barbera': 'A versatile grape known for high acidity and moderate tannins, producing medium-bodied wines.',
        'Chardonnay': 'A noble grape variety producing aromatic, medium-bodied wines with moderate acidity.',
        'Pinot Noir': 'A delicate grape creating light-bodied, aromatic wines with high acidity and soft tannins.',
        'Primitivo': 'A robust grape yielding full-bodied, aromatic wines with natural sweetness and high tannins.',
        'Sauvignon Blanc': 'A crisp grape variety producing aromatic, light-bodied wines with high acidity.'
    };
    return descriptions[grape.name] || 'A unique grape variety with distinctive characteristics.';
}

function createGrapeVarietiesContent() {
    return allResources.map(grape => `
        <div class="grape-card">
            <div class="grape-header">
                <img src="/assets/icon/grape/icon_${grape.name.toLowerCase()}.webp" 
                     alt="${grape.name}" 
                     class="grape-icon"
                     onerror="this.src='/assets/pic/grapes.webp'">
                <h3>${grape.name}</h3>
            </div>
            <hr>
            <div class="grape-description">
                <p>${getGrapeDescription(grape)}</p>
            </div>
        </div>
    `).join('');
}
