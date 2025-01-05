
import { displayStaff } from '/js/staff.js';

export function showStaffOverlay() {
    // Remove any existing instances of the overlay
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
            <h1>Staff Management</h1>
            <button id="hire-staff-btn" class="btn btn-primary mt-3">Hire Staff</button>
            <div id="staff-container" class="mt-4">
            </div>
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Display staff data
    displayStaff();
}
