
import { showMainViewOverlay } from '../overlayUtils.js';
import tutorialManager from '/js/tutorial.js';

export function showWinepediaOverlay() {
    const overlay = showMainViewOverlay(createWinepediaOverlayHTML());
    setupWinepediaEventListeners(overlay);
    
    // Add tutorial check if needed later
    if (tutorialManager.shouldShowTutorial('WINEPEDIA')) {
        tutorialManager.showTutorial('WINEPEDIA');
    }
}

function createWinepediaOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Winepedia</h2>
            <div class="overlay-sections">
                <section class="overlay-section card mb-4">
                    <img src="/assets/pic/vineyard_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Winepedia">
                    <div class="card-header text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Wine Knowledge Base</h3>
                    </div>
                    <div class="card-body">
                        <p>Welcome to the Winepedia - your comprehensive guide to wine knowledge!</p>
                        
                        <div class="row mt-4">
                            <div class="col-md-4">
                                <div class="card mb-3">
                                    <div class="card-header">Grape Varieties</div>
                                    <div class="card-body">
                                        <p>Explore different grape varieties and their characteristics.</p>
                                        <button class="btn btn-outline-primary grape-varieties-btn">Learn More</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function setupWinepediaEventListeners(overlay) {
    // Grape varieties section
    const grapeVarietiesBtn = overlay.querySelector('.grape-varieties-btn');
    if (grapeVarietiesBtn) {
        grapeVarietiesBtn.addEventListener('click', () => {
            showGrapeVarietiesSection();
        });
    }
    
    // Wine regions section
    const wineRegionsBtn = overlay.querySelector('.wine-regions-btn');
    if (wineRegionsBtn) {
        wineRegionsBtn.addEventListener('click', () => {
            showWineRegionsSection();
        });
    }
    
    // Winemaking process section
    const winemakingBtn = overlay.querySelector('.winemaking-btn');
    if (winemakingBtn) {
        winemakingBtn.addEventListener('click', () => {
            showWinemakingSection();
        });
    }
}

// Placeholder functions for the different sections
function showGrapeVarietiesSection() {
    console.log("Grape varieties section clicked");
    // Implementation to be added later
}

function showWineRegionsSection() {
    console.log("Wine regions section clicked");
    // Implementation to be added later
}

function showWinemakingSection() {
    console.log("Winemaking process section clicked");
    // Implementation to be added later
}
