import { showMainViewOverlay } from '../overlayUtils.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import tutorialManager from '/js/tutorial.js';
import { allResources } from '/js/resource.js';

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
        </div>
    `;
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
                <p>Description: ${getGrapeDescription(grape)}</p>
            </div>
        </div>
    `).join('');
}
