
import { clearFirestore, saveCompanyInfo, clearLocalStorage } from '/js/database/initiation.js'; 

export function showAdminOverlay() {
    // Check if an instance of the overlay already exists and remove it
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Admin Page</h1>
            <div class="text-center mt-4">
                <button id="clear-storage-btn" class="btn btn-danger">Clear Local Storage</button>
                <button id="clear-firestore-btn" class="btn btn-warning">Clear Firestore</button>
                <button id="save-company-info-btn" class="btn btn-primary">Save Company Info</button>
            </div>
        </div>
    `;

    // Append the overlay to the document body
    document.body.appendChild(overlay);

    // Make sure the overlay is displayed
    overlay.style.display = 'block';

    // Attach event listeners to buttons
    document.getElementById('clear-storage-btn').addEventListener('click', () => {
        clearLocalStorage();
    });

    document.getElementById('clear-firestore-btn').addEventListener('click', () => {
        clearFirestore();
    });

    document.getElementById('save-company-info-btn').addEventListener('click', saveCompanyInfo);
}