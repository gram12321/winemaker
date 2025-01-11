
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
      <div class="overlay-content">
        <span class="close-btn">&times;</span>
        <h2 class="text-center mb-3">${farmlandData.name}</h2>
        <table class="table table-bordered table-hover overlay-table">
          <thead class="thead-dark">
            <tr>
              <th>Property</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Country</td><td>${flagIcon} ${farmlandData.country}</td></tr>
            <tr><td>Region</td><td>${farmlandData.region}</td></tr>
            <tr><td>Acres</td><td>${farmlandData.acres}</td></tr>
            <tr><td>Status</td><td>${farmlandData.status}</td></tr>
            <tr><td>Ripeness</td><td>${formatNumber(farmlandData.ripeness ?? 0, 2)}</td></tr>
            <tr><td>Soil</td><td>${farmlandData.soil}</td></tr>
            <tr><td>Altitude</td><td>${farmlandData.altitude}m</td></tr>
            <tr><td>Aspect</td><td class="${colorClass}">${farmlandData.aspect} (${formatNumber(aspectRating, 2)})</td></tr>
            <tr><td>Land Value</td><td>€ ${formatNumber(landValue)}</td></tr>
            <tr><td>Density</td><td>${farmlandData.density}</td></tr>
            <tr><td>Planted Resource</td><td>${farmlandData.plantedResourceName || 'None'}</td></tr>
            <tr><td>Farmland Prestige</td><td>${formatNumber(farmlandPrestige, 2)}</td></tr>
            <tr><td>Farmland Health</td><td>${farmlandData.farmlandHealth || 'Unknown'}</td></tr>
          </tbody>
        </table>
      </div>
    `;

    // Add close button event listener
    const closeBtn = details.querySelector('.close-btn');
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
