import { getResourceByName } from '../resource.js';
import { formatNumber, getColorClass } from '../utils.js';
import { grapeSuitability } from '../names.js';
import { showModalOverlay } from './overlayUtils.js';
import { baseBalancedRanges } from '../utils/balanceCalculator.js';
import { 
    createTextCenter, 
    createTable, 
    createOverlayHTML, 
    createInfoTable, 
    createIconLabel,
    createRegionalSection 
} from '../components/createOverlayHTML.js';
import { createCharacteristicBar } from '../components/characteristicBar.js';

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
  const displayInfo = {
    naturalYield: resource.naturalYield * 100,
    naturalYieldClass: getColorClass(resource.naturalYield),
    fragility: resource.fragile * 100,
    fragileClass: getColorClass(resource.naturalYield),
    characteristics: resource.wineCharacteristics || {},
    name: resource.name,
    grapeColor: resource.grapeColor
  };

  // Create base information section using createInfoTable
  const baseInfoSection = `
    <div class="info-section">
      ${createTextCenter({ text: 'Base Information', isHeadline: true })}
      ${createInfoTable({
        rows: [
          { label: 'Name', value: displayInfo.name },
          { 
            label: 'Grape Color', 
            value: displayInfo.grapeColor,
            valueClass: 'text-capitalize' 
          },
          { 
            label: 'Natural Yield', 
            value: `${formatNumber(displayInfo.naturalYield)}%`,
            valueClass: displayInfo.naturalYieldClass 
          },
          { 
            label: 'Grape Fragile', 
            value: `${formatNumber(displayInfo.fragility)}%`,
            valueClass: displayInfo.fragileClass 
          }
        ],
        className: 'data-table resource-info-table'  // Add resource-info-table class
      })}
    </div>`;

  // Show characteristics section
  const characteristicsSection = `
    <div class="info-section">
      ${createTextCenter({ text: 'Grape Characteristics', isHeadline: true })}
      <table class="data-table resource-info-table">
        <tbody>
          ${Object.entries(displayInfo.characteristics)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([trait, value]) => {
              const displayValue = 0.5 + value;
              const [minBalance, maxBalance] = baseBalancedRanges[trait];
              return createCharacteristicRow(trait, displayValue, minBalance, maxBalance);
            }).join('')}
        </tbody>
      </table>
    </div>`;

  // Create regional suitability section
  const regionsSection = createRegionalSuitabilitySection(resource);

  return createOverlayHTML({
    title: resource.name,
    content: `
      <div class="overlay-card resource-overlay">
        <div class="imgbox">
          <img src="/assets/icon/grape/icon_${resource.name.toLowerCase()}.webp" 
               class="card-img-top process-image mx-auto d-block" 
               alt="${resource.name}">
        </div>
        <div class="info-grid">
          ${baseInfoSection}
          ${characteristicsSection}
          ${regionsSection}
        </div>
      </div>
    `,
    buttonText: '',
    isModal: true
  });
}

function createRegionalSuitabilitySection(resource) {
    const sortedCountries = Object.keys(grapeSuitability).sort();
    
    return createRegionalSection({
        title: 'Regional Suitability',
        countries: sortedCountries,
        createContent: (country) => `
            <table class="data-table">
                <tbody>
                    ${Object.entries(grapeSuitability[country])
                        .filter(([_, suitability]) => suitability[resource.name])
                        .map(([region, suitability]) => {
                            const suitabilityValue = suitability[resource.name];
                            return `<tr>
                                <td>${region}</td>
                                <td class="${getColorClass(suitabilityValue)}">
                                    ${(suitabilityValue * 100).toFixed(0)}%
                                </td>
                            </tr>`;
                        }).join('')}
                </tbody>
            </table>`
    });
}

function createCharacteristicRow(trait, value, minBalance, maxBalance) {
  return `<tr>${createCharacteristicBar(trait, value, minBalance, maxBalance)}</tr>`;
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
