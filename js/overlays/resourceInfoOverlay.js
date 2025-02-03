import { getResourceByName } from '../resource.js';
import { formatNumber, getColorClass } from '../utils.js';
import { grapeSuitability } from '../names.js';
import { hideOverlay, showModalOverlay } from './overlayUtils.js';

export function showResourceInfoOverlay(resourceName) {
  const resource = getResourceByName(resourceName);
  if (!resource) {
    console.error('Resource not found.');
    return;
  }

  const overlayContainer = showModalOverlay('resourceInfoOverlay', createResourceInfoOverlayHTML(resource));
  setupResourceInfoEventListeners(overlayContainer, overlayContainer);
  return overlayContainer;
}

function createResourceInfoOverlayHTML(resource) {
  const naturalYieldPercentage = resource.naturalYield * 100;
  const naturalYieldColorClass = getColorClass(resource.naturalYield);
  const fragilePercentage = resource.fragile * 100;
  const fragileColorClass = getColorClass(resource.naturalYield);

  // Generate regions suitability data
  let countryButtons = '';
  let regionsTable = '';
  const sortedCountries = Object.keys(grapeSuitability).sort();
  sortedCountries.forEach((country, index) => {
    let countryTable = '<table class="skills-table"><tbody>';
    for (const [region, suitability] of Object.entries(grapeSuitability[country])) {
      if (suitability[resource.name]) {
        countryTable += `<tr><td>${region}</td><td>${(suitability[resource.name] * 100).toFixed(0)}%</td></tr>`;
      }
    }
    countryTable += '</tbody></table>';
    countryButtons += `
      <button class="btn btn-secondary btn-sm toggle-country" data-country="${country}">${country}</button>
    `;
    regionsTable += `
      <div class="country-section" id="regions-${country.replace(/\s+/g, '-')}" style="display: ${index === 0 ? 'block' : 'none'};">
        ${countryTable}
      </div>
    `;
  });

  return `
    <div class="hire-staff-content">
      <div class="card-header text-white d-flex justify-content-between align-items-center">
        <h3 class="h5 mb-0">${resource.name}</h3>
        <button class="btn btn-light btn-sm close-btn">Close</button>
      </div>
      <img src="/assets/icon/grape/icon_${resource.name.toLowerCase()}.webp" class="card-img-top process-image mx-auto d-block" alt="${resource.name}">
      <div class="overlay-section-wrapper">
        <div class="staff-options-container">
          <div class="staff-option">
            <h4>Resource Information</h4>
            <table class="skills-table">
              <tbody>
                <tr><td>Name</td><td>${resource.name}</td></tr>
                <tr><td>Natural Yield</td><td class="${naturalYieldColorClass}">${formatNumber(naturalYieldPercentage)}%</td></tr>
                <tr><td>Grape Fragile</td><td class="${fragileColorClass}">${formatNumber(fragilePercentage)}%</td></tr>
              </tbody>
            </table>
          </div>
          <div class="staff-option">
            <h4>Regions</h4>
            <div class="country-buttons">
              ${countryButtons}
            </div>
            <div class="mt-3">
              ${regionsTable}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupResourceInfoEventListeners(details, overlay) {
  // Add close button functionality
  const closeBtn = details.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Add click outside to close
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  // Setup toggle button event listeners for countries
  const toggleButtons = details.querySelectorAll('.toggle-country');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const country = button.getAttribute('data-country').replace(/\s+/g, '-');
      const regionsContainer = details.querySelector(`#regions-${country}`);
      
      // Hide all other country sections
      details.querySelectorAll('.country-section').forEach(section => {
        section.style.display = 'none';
      });

      // Show the selected country section
      if (regionsContainer) {
        regionsContainer.style.display = 'block';
      }
    });
  });
}
