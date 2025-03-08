
import { showMainViewOverlay } from '../overlayUtils.js';
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
    // Tab switching
    const tabs = overlay.querySelectorAll('.winepedia-tab');
    const tabContents = overlay.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const targetContent = overlay.querySelector(`#${tab.dataset.target}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
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
        </div>
    `).join('');
}

function createCharacteristicsHTML(characteristics) {
    if (!characteristics) return '';
    
    return Object.entries(characteristics).map(([key, value]) => `
        <div class="characteristic">
            <span class="label">${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
            <span class="value">${formatCharacteristicValue(value)}</span>
        </div>
    `).join('');
}

function formatCharacteristicValue(value) {
    const percentage = ((value + 0.5) * 100).toFixed(0);
    return `${percentage}%`;
}
