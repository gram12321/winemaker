import { getFlagIconHTML } from '../utils.js';

export function showStaffOverlay(staffData) {
  const existingOverlay = document.getElementById('staffOverlay');

  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Create new overlay
  const overlay = document.createElement('div');
  overlay.id = 'staffOverlay';
  overlay.className = 'overlay';

  // Create content container
  const content = document.createElement('div');
  content.className = 'overlay-content';

  content.innerHTML = `
    <div class="card-header text-white d-flex justify-content-between align-items-center">
      <h3 class="h5 mb-0">${staffData.name} ${staffData.lastName}</h3>
      <button id="closeStaffOverlay" class="btn btn-primary btn-sm hire-staff-button">Close</button>
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
            <tr><td>Field Work</td><td class="${getSkillLevelClass(staffData.skills.field.field)}">${staffData.skills.field.field}</td></tr>
            <tr><td>Winery Operations</td><td class="${getSkillLevelClass(staffData.skills.winery.winery)}">${staffData.skills.winery.winery}</td></tr>
            <tr><td>Administration</td><td class="${getSkillLevelClass(staffData.skills.administration.administration)}">${staffData.skills.administration.administration}</td></tr>
            <tr><td>Sales Management</td><td class="${getSkillLevelClass(staffData.skills.sales.sales)}">${staffData.skills.sales.sales}</td></tr>
            <tr><td>Maintenance</td><td class="${getSkillLevelClass(staffData.skills.maintenance.maintenance)}">${staffData.skills.maintenance.maintenance}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Add close button functionality
  const closeBtn = content.querySelector('#closeStaffOverlay');
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

  overlay.style.display = 'block';
}

function getSkillLevelClass(skillValue) {
  return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}