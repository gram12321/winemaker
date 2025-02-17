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

  // Create characteristics section - simplified without tooltips
  let characteristicsTable = '<table class="data-table"><tbody>';
  const characteristics = resource.wineCharacteristics;
  for (const [trait, value] of Object.entries(characteristics)) {
    const displayValue = 0.5 + value;
    const colorClass = getColorClass(displayValue);
    characteristicsTable += `
      <tr>
        <td>${trait.charAt(0).toUpperCase() + trait.slice(1)}</td>
        <td class="${colorClass}">${(displayValue * 100).toFixed(0)}%</td>
      </tr>`;
  }
  characteristicsTable += '</tbody></table>';

  // Generate regions suitability data
  let countryButtons = '';
  let regionsTable = '';
  const sortedCountries = Object.keys(grapeSuitability).sort();
  sortedCountries.forEach((country, index) => {
    let countryTable = '<table class="data-table"><tbody>';
    for (const [region, suitability] of Object.entries(grapeSuitability[country])) {
      if (suitability[resource.name]) {
        const suitabilityValue = suitability[resource.name];
        const colorClass = getColorClass(suitabilityValue);
        countryTable += `<tr>
          <td>${region}</td>
          <td class="${colorClass}">${(suitabilityValue * 100).toFixed(0)}%</td>
        </tr>`;
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
    <div class="overlay-card resource-overlay">
      <div class="imgbox">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">${resource.name}</h3>
          <button class="btn btn-light btn-sm close-btn">Close</button>
        </div>
        <img src="/assets/icon/grape/icon_${resource.name.toLowerCase()}.webp" class="card-img-top process-image mx-auto d-block" alt="${resource.name}">
      </div>  
      <div class="info-grid">
        <div class="info-section">
          <h4>Base Information</h4>
          <table class="data-table">
            <tbody>
              <tr><td>Name</td><td>${resource.name}</td></tr>
              <tr><td>Natural Yield</td><td class="${naturalYieldColorClass}">${formatNumber(naturalYieldPercentage)}%</td></tr>
              <tr><td>Grape Fragile</td><td class="${fragileColorClass}">${formatNumber(fragilePercentage)}%</td></tr>
            </tbody>
          </table>
        </div>

        <div class="info-section">
          <h4>Wine Characteristics</h4>
          ${characteristicsTable}
        </div>

        <div class="info-section">
          <h4>Regional Suitability</h4>
          <div class="country-buttons">
            ${countryButtons}
          </div>
          <div class="mt-3">
            ${regionsTable}
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

  // Add click outside to close - Fixed syntax error here by removing extra semicolon
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });  // Removed extra semicolon and fixed bracket

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

  // Remove tooltip initialization section completely
}
