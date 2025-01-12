
import { getFlagIconHTML } from '../utils.js';

export function showStaffOverlay(staffData) {
  const overlay = document.getElementById('staffOverlay');
  const details = document.getElementById('staff-details');

  if (!overlay) {
    const newOverlay = document.createElement('div');
    newOverlay.id = 'staffOverlay';
    newOverlay.className = 'overlay';
    newOverlay.innerHTML = '<div id="staff-details" class="hire-staff-content"></div>';
    document.body.appendChild(newOverlay);
  }

  const staffDetails = document.getElementById('staff-details');
  staffDetails.innerHTML = `
    <div class="card-header text-white d-flex justify-content-between align-items-center">
      <h3 class="h5 mb-0">${staffData.firstName} ${staffData.lastName}</h3>
      <button id="closeStaffOverlay" class="btn btn-primary btn-sm">Close</button>
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

  const closeBtn = document.getElementById('closeStaffOverlay');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('staffOverlay').style.display = 'none';
    });
  }

  document.getElementById('staffOverlay').style.display = 'block';
}

function getSkillLevelClass(skillValue) {
  return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}
