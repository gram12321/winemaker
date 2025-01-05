
import { createNewStaff, displayStaff } from '../staff.js';
import { getFlagIconHTML } from '../utils.js';
import { saveStaff } from '../database/adminFunctions.js';
import { addConsoleMessage } from '../console.js';
import { addTransaction } from '../finance.js';
import { hiringTaskFunction } from '../administration.js';

export function showHireStaffOverlay() {
    const overlay = document.getElementById('hireStaffOverlay');
    const staffContainer = overlay.querySelector('.overlay-content');

    // Clear existing content except the close button and header
    staffContainer.innerHTML = `
        <span id="closeHireStaffOverlay" class="close-btn">&times;</span>
        <h3>Hire Staff</h3>
    `;

    const numberOfOptions = 5;
    const createdStaffOptions = [];

    for (let i = 0; i < numberOfOptions; i++) {
        const newStaff = createNewStaff();
        createdStaffOptions.push(newStaff);
    }

    let staffHTML = '<div class="staff-options-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; overflow-y: auto; max-height: 80vh;">';

    createdStaffOptions.forEach(staff => {
        staffHTML += `
            <div class="staff-option" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <h4>${staff.firstName} ${staff.lastName}</h4>
                <table class="table table-bordered" style="width: 100%;">
                    <tbody>
                        <tr>
                            <td>Nationality</td>
                            <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
                        </tr>
                        <tr>
                            <td>Wage</td>
                            <td>€${staff.wage}</td>
                        </tr>
                    </tbody>
                </table>
                <h4>Skills</h4>
                <table class="skills-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Field</td><td class="${getSkillLevelClass(staff.skills.field.field)}">${staff.skills.field.field}</td></tr>
                        <tr><td>Winery</td><td class="${getSkillLevelClass(staff.skills.winery.winery)}">${staff.skills.winery.winery}</td></tr>
                        <tr><td>Administration</td><td class="${getSkillLevelClass(staff.skills.administration.administration)}">${staff.skills.administration.administration}</td></tr>
                        <tr><td>Sales</td><td class="${getSkillLevelClass(staff.skills.sales.sales)}">${staff.skills.sales.sales}</td></tr>
                        <tr><td>Maintenance</td><td class="${getSkillLevelClass(staff.skills.maintenance.maintenance)}">${staff.skills.maintenance.maintenance}</td></tr>
                    </tbody>
                </table>
                <button class="btn btn-primary hire-staff-button" style="margin-top: 10px;">Hire</button>
            </div>
        `;
    });

    staffHTML += '</div>';
    staffContainer.innerHTML += staffHTML;
    overlay.style.display = 'block';

    // Add event listeners for hire buttons
    overlay.querySelectorAll('.hire-staff-button').forEach((button, index) => {
        button.addEventListener('click', () => hireSelectedStaff(createdStaffOptions[index]));
    });

    // Add close button functionality
    const closeBtn = document.getElementById('closeHireStaffOverlay');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }
}

function hireSelectedStaff(staff) {
    let pendingHires = JSON.parse(localStorage.getItem('pendingHires')) || [];
    pendingHires.push(staff);
    localStorage.setItem('pendingHires', JSON.stringify(pendingHires));

    const hiringExpense = staff.wage * 12;
    addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);

    const flagIconHTML = getFlagIconHTML(staff.nationality);
    addConsoleMessage(`Started hiring process for: ${staff.firstName} ${staff.lastName}, ${flagIconHTML} ${staff.nationality}, One-time hiring cost: €${hiringExpense}`, true);

    hiringTaskFunction();

    document.getElementById('hireStaffOverlay').style.display = 'none';
}

function getSkillLevelClass(skillValue) {
    return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}
