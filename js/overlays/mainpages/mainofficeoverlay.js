
import { addTransaction } from '/js/finance.js';
import { incrementWeek } from '/js/endDay.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import tutorialManager from '/js/tutorial.js';

export function showMainOfficeOverlay() {
    console.log('Checking tutorial status:', tutorialManager.shouldShowTutorial('WELCOME'));
    
    // Check and show tutorial first
    if (tutorialManager.shouldShowTutorial('WELCOME')) {
        tutorialManager.showTutorial('WELCOME');
    }
    
    // Then create and show the overlay
    const overlay = showMainViewOverlay(createMainOfficeOverlayHTML());
    setupMainOfficeEventListeners(overlay);
}

function createMainOfficeOverlayHTML() {
    return `
        <div class="mainview-overlay-content">
            <h1>Welcome to the Game!</h1>
            <p>Start playing now.</p>

            <div class="text-center mt-4">
                <button id="add-money-btn" class="btn btn-success">Add $1.000.000 €</button>
                <button id="increment-week-btn" class="btn btn-info"></button> 
            </div>
        </div>
    `;
}

function setupMainOfficeEventListeners(overlay) {
    const addMoneyBtn = overlay.querySelector('#add-money-btn');
    const incrementWeekBtn = overlay.querySelector('#increment-week-btn');

    if (addMoneyBtn) {
        addMoneyBtn.addEventListener('click', () => {
            addTransaction('Income', 'Manual Money Addition', 1000000);
        });
    }

    if (incrementWeekBtn) {
        incrementWeekBtn.addEventListener('click', () => {
            incrementWeek();
        });
    }
}
