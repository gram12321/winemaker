import { getFlagIconHTML, formatNumber, getColorClass, getSkillLevelInfo } from '../utils.js';  
import { specializedRoles } from '../overlays/hireStaffOptionsOverlay.js'; 
import { showModalOverlay } from './overlayUtils.js';

export function showStaffOverlay(staffData) {
  const content = getStaffOverlayHTML(staffData);
  const overlayContainer = showModalOverlay('staffOverlay', content.outerHTML);
  
  setupStaffOverlayEventListeners(overlayContainer, staffData);
  
  return overlayContainer;
}

function getStaffOverlayHTML(staffData) {
  const content = document.createElement('div');
  const skillInfo = getSkillLevelInfo(staffData.skillLevel);
  const specializationHTML = staffData.specializedRoles.map(role => 
    `<span class="specialization ${role}">${specializedRoles[role].title}</span>`
  ).join(', ');

  content.innerHTML = `
    <div class="overlay-card staff-overlay">
      <div class="imgbox">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">${staffData.name} ${staffData.lastName}</h3>
          <button class="btn btn-light btn-sm close-btn">Close</button>
        </div>
        <img src="/assets/pic/staff_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Staff">
      </div>  
      <div class="info-grid">
        <div class="info-section">
          <h4>Personal Details</h4>
          <table class="data-table">
            <tbody>
              <tr><td>Nationality</td><td>${getFlagIconHTML(staffData.nationality)} ${staffData.nationality}</td></tr>
              <tr><td>Monthly Wage</td><td>€${staffData.wage}</td></tr>
              <tr><td>Annual Cost</td><td>€${staffData.wage * 12}</td></tr>
              <tr><td>Workforce</td><td>${staffData.workforce}</td></tr>
              <tr><td>Skill Level</td><td>${skillInfo.formattedName}</td></tr>
              <tr><td>Specialization</td><td>${specializationHTML}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="info-section">
          <h4>Skills & Expertise</h4>
          <table class="data-table">
            <tbody>
              <tr><td>Field Work</td><td class="${getColorClass(staffData.skills.field.field)}">${formatNumber(staffData.skills.field.field * 100)}%</td></tr>
              <tr><td>Winery Operations</td><td class="${getColorClass(staffData.skills.winery.winery)}">${formatNumber(staffData.skills.winery.winery * 100)}%</td></tr>
              <tr><td>Administration</td><td class="${getColorClass(staffData.skills.administration.administration)}">${formatNumber(staffData.skills.administration.administration * 100)}%</td></tr>
              <tr><td>Sales Management</td><td class="${getColorClass(staffData.skills.sales.sales)}">${formatNumber(staffData.skills.sales.sales * 100)}%</td></tr>
              <tr><td>Maintenance</td><td class="${getColorClass(staffData.skills.maintenance.maintenance)}">${formatNumber(staffData.skills.maintenance.maintenance * 100)}%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return content;
}

function setupStaffOverlayEventListeners(overlay, staffData) {
  // Add close button functionality
  const closeBtn = overlay.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  }); 
}
