
import { addTransaction } from '/js/finance.js';
import { incrementWeek } from '/js/endDay.js';


export function showMainOfficeOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

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

    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Add event listeners
    document.getElementById('add-money-btn').addEventListener('click', () => {
        addTransaction('Income', 'Manual Money Addition', 1000000);
    });
    document.getElementById('increment-week-btn').addEventListener('click', incrementWeek);
}
