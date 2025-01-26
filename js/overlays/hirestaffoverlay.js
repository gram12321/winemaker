
import { createNewStaff } from '../staff.js';
import { getFlagIconHTML } from '../utils.js';
import { saveStaff, loadStaff } from '../database/adminFunctions.js';
import { addConsoleMessage } from '../console.js';
import { addTransaction } from '../finance.js';
import taskManager, { TaskType } from '../taskManager.js';
import { showStandardOverlay, hideOverlay } from './overlayUtils.js';

export function showHireStaffOverlay() {
    const numberOfOptions = 5;
    const createdStaffOptions = Array.from({length: numberOfOptions}, () => createNewStaff());
    const overlayContainer = showStandardOverlay(createHireStaffHTML(createdStaffOptions));
    setupHireStaffEventListeners(overlayContainer, createdStaffOptions);
    return overlayContainer;
}

function createHireStaffHTML(createdStaffOptions) {
    return `
        <section id="hiring-section" class="overlay-section card mb-4">
            <div class="card-header text-white d-flex justify-content-between align-items-center">
                <h3 class="h5 mb-0">Hire Staff</h3>
                <button class="close-btn btn btn-alternative btn-sm">Close</button>
            </div>
            <div class="p-3 text-center">
                <p>HR Department has completed search for candidates for our new staff addition. These are the possible candidates:</p>
            </div>
            <div class="staff-options-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 20px; overflow-y: auto; max-height: 80vh;">
                ${createdStaffOptions.map((staff, index) => `
                    <div class="staff-option">
                        <div class="card-header text-white d-flex justify-content-between align-items-center">
                            <h3 class="h5 mb-0">${staff.firstName} ${staff.lastName}</h3>
                            <button class="btn btn-alternative btn-sm hire-staff-button" data-staff-index="${index}">Hire</button>
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
                `).join('')}
            </div>
        </section>
    `;
}

function setupHireStaffEventListeners(overlayContainer, createdStaffOptions) {
    // Add event listeners for hire buttons
    overlayContainer.querySelectorAll('.hire-staff-button').forEach(button => {
        button.addEventListener('click', () => {
            const staffIndex = parseInt(button.dataset.staffIndex);
            hireSelectedStaff(createdStaffOptions[staffIndex]);
        });
    });

    // Add event listener for close button
    overlayContainer.querySelector('.close-btn').addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });
}

function hireSelectedStaff(staff) {
    const hiringExpense = staff.wage * 12;
    const currentMoney = parseFloat(localStorage.getItem('money') || '0');

    if (currentMoney < hiringExpense) {
        addConsoleMessage(`Insufficient funds for hiring: <strong>${staff.firstName} ${staff.lastName}</strong>. Required: <strong>${formatNumber(hiringExpense)}€</strong>, Available: <strong>${formatNumber(currentMoney)}€</strong>.`);
        return;
    }

    taskManager.addCompletionTask(
        'Hiring Process',
        TaskType.administration,
        20,
        (target, params) => {
            const { staff, hiringExpense } = params;
            const staffMembers = loadStaff();
            staffMembers.push(staff);
            saveStaff(staffMembers);

            addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);
            const flagIconHTML = getFlagIconHTML(staff.nationality);
            addConsoleMessage(`${staff.firstName} ${staff.lastName} ${flagIconHTML} has joined your company!`, true);
        },
        null,
        { staff, hiringExpense },
        (target, params) => {
            const { staff } = params;
            addConsoleMessage(`Started hiring process for ${staff.firstName} ${staff.lastName}...`, true);
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                hideOverlay(overlay);
            }
        }
    );
}

function getSkillLevelClass(skillValue) {
    return skillValue > 0.75 ? 'high' : skillValue > 0.5 ? 'medium' : 'low';
}

function formatNumber(number) {
    return number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
