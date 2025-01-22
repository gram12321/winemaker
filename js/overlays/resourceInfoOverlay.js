import { getResourceByName } from '../resource.js';
import { formatNumber, getColorClass } from '../utils.js';
import { grapeSuitability } from '../names.js';

export function showResourceInfoOverlay(resourceName) {
  const resource = getResourceByName(resourceName);
  if (!resource) {
    console.error('Resource not found.');
    return;
  }

  const overlay = document.getElementById('resourceInfoOverlay');
  if (!overlay) {
    console.error('Resource info overlay element not found.');
    return;
  }
  overlay.style.zIndex = '2050'; // Ensure overlay stays above the console
  const details = document.getElementById('resource-details');
  details.innerHTML = ''; // Clear existing details

  // Render the specific resource data
  if (details) {
    const naturalYieldPercentage = resource.naturalYield * 100;
    const naturalYieldColorClass = getColorClass(resource.naturalYield);
   
    const fragilePercentage = resource.fragile * 100;
    const fregileColorClass = getColorClass(resource.naturalYield);

    // Generate regions suitability table with collapsible countries
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

    details.innerHTML = `
      <div class="hire-staff-content">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">
            ${resource.name}
          </h3>
          <button id="closeResourceInfoOverlay" class="btn btn-primary btn-sm">Close</button>
        </div>
        <img src="/assets/icon/grape/icon_${resource.name.toLowerCase()}.webp" class="card-img-top process-image mx-auto d-block" alt="${resource.name}">
        </div>
        <div class="staff-options-container d-flex">
          <div class="staff-option flex-fill">
            <h4>Resource Information</h4>
            <table class="skills-table">
              <tbody>
                <tr><td>Name</td><td>${resource.name}</td></tr>
                <tr><td>Natural Yield</td><td class="${naturalYieldColorClass}">${formatNumber(naturalYieldPercentage)}%</td></tr>
                <tr><td>Grape Frigile</td><td class="${fregileColorClass}">${formatNumber(fragilePercentage)}%</td></tr>
              </tbody>
            </table>
          </div>
          <div class="staff-option flex-fill">
            <h4>Regions</h4>
            <div class="country-buttons">
              ${countryButtons}
            </div>
          </div>
          <div class="staff-option flex-fill">
            <h4>Regions Info</h4>
            ${regionsTable}
          </div>
        </div>
      </div>
    `;

    // Add close button event listener
    const closeBtn = details.querySelector('#closeResourceInfoOverlay');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }

    // Add toggle button event listeners for countries
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

  overlay.style.display = 'block';

  // Add click event listener to the overlay for outside clicks
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
}
// Resource Info Overlay
export function showResourceInfo(resource) {
  // Basic implementation
  console.log('Resource info:', resource);
}
