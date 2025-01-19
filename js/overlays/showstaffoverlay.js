import { getFlagIconHTML, formatNumber, getColorClass } from '../utils.js';

export function showStaffOverlay(staffData) {
  const overlay = createOverlay();
  const content = getStaffOverlayHTML(staffData);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  setupStaffOverlayEventListeners(overlay, content);
  overlay.style.display = 'block';
}

function createOverlay() {
  const existingOverlay = document.getElementById('staffOverlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'staffOverlay';
  overlay.className = 'overlay';
  return overlay;
}

function getStaffOverlayHTML(staffData) {
  const content = document.createElement('div');
  content.className = 'overlay-content';

  content.innerHTML = `
    <section id="staff-details-section" class="overlay-section card mb-4">
      <div class="card-header text-white d-flex justify-content-between align-items-center">
        <h3 class="h5 mb-0">${staffData.name} ${staffData.lastName}</h3>
        <button class="btn btn-light btn-sm close-btn">Close</button>
      </div>
      <div class="staff-options-container">
      <div class="staff-option">
        <h4>Personal Details</h4>
        <table class="skills-table">
          <tbody>
            <tr><td>Nationality</td><td>${getFlagIconHTML(staffData.nationality)} ${staffData.nationality}</td></tr>
            <tr><td>Monthly Wage</td><td>€${staffData.wage}</td></tr>
            <tr><td>Annual Cost</td><td>€${staffData.wage * 12}</td></tr>
            <tr><td>Workforce</td><td>${staffData.workforce}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="staff-option">
        <h4>Skills & Expertise</h4>
        <table class="skills-table">
          <tbody>
            <tr><td>Field Work</td><td class="${getColorClass(staffData.skills.field.field)}">${formatNumber(staffData.skills.field.field * 100)}%</td></tr>
            <tr><td>Winery Operations</td><td class="${getColorClass(staffData.skills.winery.winery)}">${formatNumber(staffData.skills.winery.winery * 100)}%</td></tr>
            <tr><td>Administration</td><td class="${getColorClass(staffData.skills.administration.administration)}">${formatNumber(staffData.skills.administration.administration * 100)}%</td></tr>
            <tr><td>Sales Management</td><td class="${getColorClass(staffData.skills.sales.sales)}">${formatNumber(staffData.skills.sales.sales * 100)}%</td></tr>
            <tr><td>Maintenance</td><td class="${getColorClass(staffData.skills.maintenance.maintenance)}">${formatNumber(staffData.skills.maintenance.maintenance * 100)}%</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  return content;
}

function setupStaffOverlayEventListeners(overlay, content) {
  // Add close button functionality
  const closeBtn = content.querySelector('.close-btn');
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
}
