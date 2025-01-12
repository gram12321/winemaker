
// Import necessary utility functions and classes
import { formatNumber, getColorClass, getFlagIcon } from '../utils.js';
import { regionAspectRatings, calculateAndNormalizePriceFactor } from '/js/names.js';

export function showFarmlandOverlay(farmlandData) {
  const overlay = document.getElementById('farmlandOverlay');
  const details = document.getElementById('farmland-details');
  details.innerHTML = ''; // Clear existing details

  // Calculate additional values needed for display
  const aspectRating = regionAspectRatings[farmlandData.country][farmlandData.region][farmlandData.aspect];
  const colorClass = getColorClass(aspectRating);
  const landValue = calculateAndNormalizePriceFactor(farmlandData.country, farmlandData.region, farmlandData.altitude, farmlandData.aspect);
  const flagIcon = getFlagIcon(farmlandData.country);
  const farmlandPrestige = farmlandData.farmlandPrestige || 0;

  // Render the specific farmland data
  if (details) {
    details.innerHTML = `
      <div class="hire-staff-content">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">${farmlandData.name}</h3>
          <button id="closeFarmlandOverlay" class="btn btn-light btn-sm">Close</button>
        </div>
        <div class="staff-options-container">
          <div class="staff-option">
            <h4>Location & Size</h4>
            <table class="skills-table">
              <tbody>
                <tr><td>Country</td><td>${flagIcon} ${farmlandData.country}</td></tr>
                <tr><td>Region</td><td>${farmlandData.region}</td></tr>
                <tr><td>Acres</td><td>${farmlandData.acres}</td></tr>
              </tbody>
            </table>

            <h4>Terrain Details</h4>
            <table class="skills-table">
              <tbody>
                <tr><td>Soil</td><td>${farmlandData.soil}</td></tr>
                <tr><td>Altitude</td><td>${farmlandData.altitude}m</td></tr>
                <tr><td>Aspect</td><td class="${colorClass}">${farmlandData.aspect} (${formatNumber(aspectRating, 2)})</td></tr>
              </tbody>
            </table>
          </div>

          <div class="staff-option">
            <h4>Field Status</h4>
            <table class="skills-table">
              <tbody>
                <tr><td>Status</td><td>${farmlandData.status}</td></tr>
                <tr><td>Ripeness</td><td>${formatNumber(farmlandData.ripeness ?? 0, 2)}</td></tr>
                <tr><td>Land Value</td><td>€${formatNumber(landValue)}</td></tr>
                <tr><td>Density</td><td>${farmlandData.density || 'N/A'}</td></tr>
                <tr><td>Planted Resource</td><td>${farmlandData.plantedResourceName || 'None'}</td></tr>
                <tr><td>Farmland Prestige</td><td>${formatNumber(farmlandPrestige, 2)}</td></tr>
                <tr><td>Farmland Health</td><td>${farmlandData.farmlandHealth || 'Unknown'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Add close button event listener
    const closeBtn = details.querySelector('#closeFarmlandOverlay');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }
  }

  if (overlay) {
    overlay.style.display = 'block';

    // Add click event listener to the overlay for outside clicks
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
}
