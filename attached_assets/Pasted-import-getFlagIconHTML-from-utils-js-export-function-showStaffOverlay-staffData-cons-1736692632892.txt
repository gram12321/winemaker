import { getFlagIconHTML } from '../utils.js';

export function showStaffOverlay(staffData) {
  const overlay = document.createElement('div');
  overlay.id = 'staffOverlay';
  overlay.className = 'overlay';

  const overlayContent = document.createElement('div');
  overlayContent.className = 'overlay-content';
  overlayContent.innerHTML = `
    <span class="close-btn">&times;</span>
    <h2>${staffData.name} ${staffData.lastName}</h2>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th colspan="2">Staff Information</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Nationality</td><td>${getFlagIconHTML(staffData.nationality)} ${staffData.nationality}</td></tr>
        <tr><td>Workforce</td><td>${staffData.workforce}</td></tr>
        <tr><td>Wage (€)</td><td>${staffData.wage}</td></tr>
      </tbody>
    </table>
    <h4>Skills</h4>
    <table class="skills-table">
      <thead>
        <tr>
          <th>Skill</th>
          <th>Level</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Field</td><td class="${getSkillLevelClass(staffData.skills.field.field)}">${staffData.skills.field.field}</td></tr>
        <tr><td>Winery</td><td class="${getSkillLevelClass(staffData.skills.winery.winery)}">${staffData.skills.winery.winery}</td></tr>
        <tr><td>Administration</td><td class="${getSkillLevelClass(staffData.skills.administration.administration)}">${staffData.skills.administration.administration}</td></tr>
        <tr><td>Sales</td><td class="${getSkillLevelClass(staffData.skills.sales.sales)}">${staffData.skills.sales.sales}</td></tr>
        <tr><td>Maintenance</td><td class="${getSkillLevelClass(staffData.skills.maintenance.maintenance)}">${staffData.skills.maintenance.maintenance}</td></tr>
      </tbody>
    </table>
  `;

  overlay.appendChild(overlayContent);
  document.body.appendChild(overlay);

  // Event listener to close the overlay
  overlay.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Close overlay when clicking outside the content
  window.addEventListener('click', (event) => {
    if (event.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// Helper function to determine skill level class
function getSkillLevelClass(skillValue) {
  return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}