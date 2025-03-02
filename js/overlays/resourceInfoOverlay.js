import { getResourceByName } from '../resource.js';
import { formatNumber, getColorClass } from '../utils.js';
import { grapeSuitability } from '../names.js';
import { showModalOverlay } from './overlayUtils.js';
import { createTextCenter, createTable, createOverlayHTML } from '../components/createOverlayHTML.js';
import { baseBalancedRanges } from '../utils/balanceCalculator.js';
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

  // Create base information section using createTable
  const baseInfoSection = `
    <div class="info-section">
      ${createTextCenter({ text: 'Base Information', isHeadline: true })}
      ${createTable({
        className: 'data-table',
        headers: [],
        id: 'resource-info-table',
        tableClassName: 'table'
      })}
      <tbody>
        <tr><td>Name</td><td>${displayInfo.name}</td></tr>
        <tr><td>Grape Color</td><td style="text-transform: capitalize">${displayInfo.grapeColor}</td></tr>
        <tr><td>Natural Yield</td><td class="${displayInfo.naturalYieldClass}">${formatNumber(displayInfo.naturalYield)}%</td></tr>
        <tr><td>Grape Fragile</td><td class="${displayInfo.fragileClass}">${formatNumber(displayInfo.fragility)}%</td></tr>
      </tbody>
    </div>`;

  // Show characteristics section using createTable
  const characteristicsSection = `
    <div class="info-section">
      ${createTextCenter({ text: 'Grape Characteristics', isHeadline: true })}
      ${createTable({
        className: 'data-table',
        headers: [],
        id: 'characteristics-table',
        tableClassName: 'table'
      })}
      <tbody>
        ${Object.entries(displayInfo.characteristics)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([trait, value]) => {
            const displayValue = 0.5 + value;
            const [minBalance, maxBalance] = baseBalancedRanges[trait];
            return createCharacteristicRow(trait, displayValue, minBalance, maxBalance);
          }).join('')}
      </tbody>
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
  let countryButtons = sortedCountries.map(country => 
    `<button class="btn btn-secondary btn-sm toggle-country" data-country="${country}">${country}</button>`
  ).join('');

  let regionsTable = sortedCountries.map((country, index) => {
    const countryContent = Object.entries(grapeSuitability[country])
      .filter(([_, suitability]) => suitability[resource.name])
      .map(([region, suitability]) => {
        const suitabilityValue = suitability[resource.name];
        return `<tr>
          <td>${region}</td>
          <td class="${getColorClass(suitabilityValue)}">${(suitabilityValue * 100).toFixed(0)}%</td>
        </tr>`;
      }).join('');

    return `
      <div class="country-section" id="regions-${country.replace(/\s+/g, '-')}" 
           style="display: ${index === 0 ? 'block' : 'none'};">
        ${createTable({
          className: 'data-table',
          headers: [],
          tableClassName: 'table'
        })}
        <tbody>${countryContent}</tbody>
      </div>`;
  }).join('');

  return `
    <div class="info-section">
      ${createTextCenter({ text: 'Regional Suitability', isHeadline: true })}
      <div class="country-buttons">${countryButtons}</div>
      <div class="mt-3">${regionsTable}</div>
    </div>`;
}

function createCharacteristicRow(trait, value, minBalance, maxBalance) {
  return `
    <tr>
      <td>
        <img src="/assets/icon/small/${trait}.png" 
             alt="${trait}" 
             class="characteristic-icon">
        ${trait.charAt(0).toUpperCase() + trait.slice(1)}
      </td>
      <td class="characteristic-bar-cell">
        ${createCharacteristicBar(trait, value, minBalance, maxBalance)}
      </td>
    </tr>`;
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
