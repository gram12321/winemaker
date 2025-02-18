import { getResourceByName } from '../resource.js';
import { formatNumber, getColorClass } from '../utils.js';
import { grapeSuitability } from '../names.js';
import { hideOverlay, showModalOverlay } from './overlayUtils.js';
import { createTable, createTextCenter } from '../components/createOverlayHTML.js';

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

  // Create base information section
  const baseInfoSection = `
    <div class="info-section">
      ${createTextCenter({ text: '<h4>Base Information</h4>' })}
      <table class="data-table">
        <tbody>
          <tr><td>Name</td><td>${resource.name}</td></tr>
          <tr><td>Natural Yield</td><td class="${naturalYieldColorClass}">${formatNumber(naturalYieldPercentage)}%</td></tr>
          <tr><td>Grape Fragile</td><td class="${fragileColorClass}">${formatNumber(fragilePercentage)}%</td></tr>
        </tbody>
      </table>
    </div>`;

  // Create characteristics section
  const characteristicsSection = `
    <div class="info-section">
      ${createTextCenter({ text: '<h4>Wine Characteristics</h4>' })}
      <table class="data-table">
        <tbody>
          ${Object.entries(resource.wineCharacteristics)
            .map(([trait, value]) => {
              const displayValue = 0.5 + value;
              const colorClass = getColorClass(displayValue);
              return `
                <tr>
                  <td>${trait.charAt(0).toUpperCase() + trait.slice(1)}</td>
                  <td class="${colorClass}">${(displayValue * 100).toFixed(0)}%</td>
                </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>`;

  // Generate regions section
  let countryButtons = '';
  let regionsTable = '';
  const sortedCountries = Object.keys(grapeSuitability).sort();
  sortedCountries.forEach((country, index) => {
    const countryContent = Object.entries(grapeSuitability[country])
      .filter(([_, suitability]) => suitability[resource.name])
      .map(([region, suitability]) => {
        const suitabilityValue = suitability[resource.name];
        const colorClass = getColorClass(suitabilityValue);
        return `<tr>
          <td>${region}</td>
          <td class="${colorClass}">${(suitabilityValue * 100).toFixed(0)}%</td>
        </tr>`;
      }).join('');

    countryButtons += `
      <button class="btn btn-secondary btn-sm toggle-country" data-country="${country}">${country}</button>
    `;
    regionsTable += `
      <div class="country-section" id="regions-${country.replace(/\s+/g, '-')}" style="display: ${index === 0 ? 'block' : 'none'};">
        <table class="data-table">
          <tbody>
            ${countryContent}
          </tbody>
        </table>
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
        ${baseInfoSection}
        ${characteristicsSection}
        <div class="info-section">
          ${createTextCenter({ text: '<h4>Regional Suitability</h4>' })}
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
