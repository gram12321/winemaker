// Import necessary utility functions and classes
import { formatNumber, getColorClass, getFlagIcon } from '../utils.js';
import { regionAspectRatings } from '/js/names.js';
import { Farmland } from '/js/farmland.js';

export function showFarmlandOverlay(farmlandData) {
  const overlay = document.getElementById('farmlandOverlay');
  const details = document.getElementById('farmland-details');

  // Construct a Farmland instance using the existing farmlandData
  const farmland = new Farmland(
    farmlandData.id,
    farmlandData.name,
    farmlandData.country,
    farmlandData.region,
    farmlandData.acres,
    farmlandData.plantedResourceName,
    farmlandData.vineAge,
    farmlandData.grape,
    farmlandData.soil,
    farmlandData.altitude,
    farmlandData.aspect,
    farmlandData.density
  );

  // Manually set ripeness if farmlandData includes an updated value
  farmland.ripeness = farmlandData.ripeness ?? farmland.ripeness;

  if (details) {
    const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
    const colorClass = getColorClass(aspectRating);
    const landValue = farmland.calculateLandvalue();
    const flagIcon = getFlagIcon(farmland.country);

    // Use the farmlandPrestige property instead of calling the method
    const farmlandPrestige = farmland.farmlandPrestige;

    // Update details utilizing farmland object, including the ripeness value
    details.innerHTML = `
      <div class="overlay-content">
        <h2 class="text-center mb-3">${farmland.name}</h2>
        <table class="table table-bordered table-hover">
          <thead class="thead-dark">
            <tr>
              <th>Property</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Country</td>
              <td>${flagIcon} ${farmland.country}</td>
            </tr>
            <tr><td>Region</td><td>${farmland.region}</td></tr>
            <tr><td>Acres</td><td>${farmland.acres}</td></tr>
            <tr><td>Status</td><td>${farmland.status}</td></tr>
            <tr><td>Ripeness</td><td>${formatNumber(farmland.ripeness, 2)}</td></tr>
            <tr><td>Soil</td><td>${farmland.soil}</td></tr>
            <tr><td>Altitude</td><td>${farmland.altitude}m</td></tr>
            <tr>
              <td>Aspect</td>
              <td class="${colorClass}">${farmland.aspect} (${formatNumber(aspectRating, 2)})</td>
            </tr>
            <tr><td>Land Value</td><td>€ ${formatNumber(landValue)}</td></tr>
            <tr><td>Density</td><td>${farmland.density}</td></tr>
            <tr>
              <td>Planted Resource</td>
              <td>${farmland.plantedResourceName || 'None'}</td>
            </tr>
            <tr>
              <td>Farmland Prestige</td>
              <td>${formatNumber(farmlandPrestige, 2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    overlay.style.display = 'block';
  }
}

// Event listener for closing the overlay when clicking outside the content
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('click', (event) => {
    const overlay = document.getElementById('farmlandOverlay');
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
});