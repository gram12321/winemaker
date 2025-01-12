
import { createNewStaff, displayStaff } from '../staff.js';
import { getFlagIconHTML } from '../utils.js';
import { saveStaff, loadStaff } from '../database/adminFunctions.js';
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
            <div class="staff-option">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">${staff.firstName} ${staff.lastName}</h3>
                    <button class="btn btn-primary btn-sm hire-staff-button">Hire</button>
                </div>
                <div class="staff-options-container">
                    <div class="staff-option">
                        <h4>Personal Details</h4>
                        <table class="skills-table">
                            <tbody>
                                <tr>
                                    <td>Nationality</td>
                                    <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
                                </tr>
                                <tr>
                                    <td>Monthly Wage</td>
                                    <td>€${staff.wage}</td>
                                </tr>
                                <tr>
                                    <td>Annual Cost</td>
                                    <td>€${staff.wage * 12}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="staff-option">
                        <h4>Skills & Expertise</h4>
                        <table class="skills-table">
                            <tbody>
                                <tr><td>Field Work</td><td class="${getSkillLevelClass(staff.skills.field.field)}">${staff.skills.field.field}</td></tr>
                                <tr><td>Winery Operations</td><td class="${getSkillLevelClass(staff.skills.winery.winery)}">${staff.skills.winery.winery}</td></tr>
                                <tr><td>Administration</td><td class="${getSkillLevelClass(staff.skills.administration.administration)}">${staff.skills.administration.administration}</td></tr>
                                <tr><td>Sales Management</td><td class="${getSkillLevelClass(staff.skills.sales.sales)}">${staff.skills.sales.sales}</td></tr>
                                <tr><td>Maintenance</td><td class="${getSkillLevelClass(staff.skills.maintenance.maintenance)}">${staff.skills.maintenance.maintenance}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
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
    // Get current staff from adminFunctions
    const staffMembers = loadStaff();
    
    // Add new staff member
    staffMembers.push(staff);
    
    // Save updated staff list
    saveStaff(staffMembers);

    // Handle hiring expense
    const hiringExpense = staff.wage * 12;
    addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);

    // Display confirmation message
    const flagIconHTML = getFlagIconHTML(staff.nationality);
    addConsoleMessage(`Hired: ${staff.firstName} ${staff.lastName}, ${flagIconHTML} ${staff.nationality}, Hiring cost: €${hiringExpense}`, true);

    // Close the overlay and refresh staff display
    document.getElementById('hireStaffOverlay').style.display = 'none';
    displayStaff(); // Refresh the staff display
}

function getSkillLevelClass(skillValue) {
    return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}
