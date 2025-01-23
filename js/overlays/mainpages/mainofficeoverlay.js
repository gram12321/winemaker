
import { addTransaction } from '/js/finance.js';
import { incrementWeek } from '/js/endDay.js';
import { hideAllOverlays } from '/js/overlays/mainpages/hideOverlays.js';

export function showMainOfficeOverlay() {
    // First hide any existing overlays
    hideAllOverlays();
    
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Welcome to the Game!</h1>
            <p>Start playing now.</p>

            <div class="text-center mt-4">
                <button id="add-money-btn" class="btn btn-success">Add $1.000.000 €</button>
                <button id="increment-week-btn" class="btn btn-info">Increment Week</button> 
            </div>
        </div>
    `;

    const pageContent = document.querySelector('#page-content-wrapper');
    if (pageContent) {
        pageContent.innerHTML = ''; // Clear existing content
        pageContent.appendChild(overlay);
    }

    // Add event listeners
    document.getElementById('add-money-btn').addEventListener('click', () => {
        addTransaction('Income', 'Manual Money Addition', 1000000);
    });
    document.getElementById('increment-week-btn').addEventListener('click', incrementWeek);
}
