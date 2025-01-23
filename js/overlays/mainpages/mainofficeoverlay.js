
import { addTransaction } from '/js/finance.js';
import { incrementWeek } from '/js/endDay.js';
import { hideAllOverlays } from './hideOverlays.js';
import { showMainViewOverlay } from '../overlayUtils.js';

export function showMainOfficeOverlay() {
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
