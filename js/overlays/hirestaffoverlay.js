import { createNewStaff, setupStaffWagesRecurringTransaction } from '../staff.js';
import { getFlagIconHTML, getSkillLevelInfo, formatNumber, getColorClass } from '../utils.js';
import { saveStaff, loadStaff } from '../database/initiation.js';
import { addConsoleMessage } from '../console.js';
import { addTransaction } from '../finance.js';
import taskManager from '../taskManager.js';  
import { showModalOverlay, hideOverlay } from './overlayUtils.js'; 
import { specializedRoles } from './staffSearchOverlay.js';

export function showHireStaffOverlay(numberOfOptions = 5, skillModifier = 0.5, specializedRoles = []) {
    const createdStaffOptions = Array.from(
        {length: numberOfOptions}, 
        () => createNewStaff(skillModifier, specializedRoles)
    );
    
    const content = createHireStaffHTML(createdStaffOptions);
    
    const overlayContainer = showModalOverlay('hireStaffOverlay', content);

    setupHireStaffEventListeners(overlayContainer, createdStaffOptions);
    return overlayContainer;
}

function createHireStaffHTML(createdStaffOptions) {
    const skillInfo = getSkillLevelInfo(createdStaffOptions[0]?.skillLevel || 0.1);
    const specializationText = createdStaffOptions[0]?.specializedRoles?.length > 0 
        ? `We have been specifically looking for ${createdStaffOptions[0].specializedRoles.map(role => 
            `<span style="color: var(--skill-${role});">${specializedRoles[role].title}</span>`).join(', ')}.<br>`
        : '';

    return `
    <div class="overlay-card hire-staff-overlay">
        <div class="imgbox">
            <div class="card-header text-white d-flex justify-content-between align-items-center">
                <h3 class="h5 mb-0">Hire Staff</h3>
                <button class="btn btn-light btn-sm close-btn">Close</button>
            </div>
            <img src="/assets/pic/staff_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Staff">
            <div class="p-3 text-center">
                <p>HR Department has completed the search for new Candidate:</p>
                <p>We have found ${createdStaffOptions.length} candidates</p>
                <p>We have been searching for ${skillInfo.formattedName}</p>
                ${specializationText}
                <p>Here are the possible candidates:</p>
            </div>
        </div>
        <div class="info-grid">
            ${createdStaffOptions.map((staff, index) => `
                <div class="info-section">
                    <div class="card-header text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">${staff.firstName} ${staff.lastName}</h3>
                        <button class="btn btn-alternative btn-sm hire-staff-button" data-staff-index="${index}">Hire</button>
                    </div>
                    
                        <div class="info-section">
                            <h4>Personal Details</h4>
                            <table class="data-table">
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
                                    <tr>
                                        <td>Skill Level</td>
                                        <td>${getSkillLevelInfo(staff.skillLevel).formattedName}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="info-section">
                            <h4>Skills & Expertise</h4>
                            <table class="data-table">
                                <tbody>
                                    <tr><td>Field Work</td><td class="${getColorClass(staff.skills.field.field)}">${formatNumber(staff.skills.field.field * 100)}%</td></tr>
                                    <tr><td>Winery Operations</td><td class="${getColorClass(staff.skills.winery.winery)}">${formatNumber(staff.skills.winery.winery * 100)}%</td></tr>
                                    <tr><td>Administration</td><td class="${getColorClass(staff.skills.administration.administration)}">${formatNumber(staff.skills.administration.administration * 100)}%</td></tr>
                                    <tr><td>Sales Management</td><td class="${getColorClass(staff.skills.sales.sales)}">${formatNumber(staff.skills.sales.sales * 100)}%</td></tr>
                                    <tr><td>Maintenance</td><td class="${getColorClass(staff.skills.maintenance.maintenance)}">${formatNumber(staff.skills.maintenance.maintenance * 100)}%</td></tr>
                                </tbody>
                            </table>
                        </div>
                    
                </div>
            `).join('')}
        </div>
    </div>`;
}

function setupHireStaffEventListeners(overlayContainer, createdStaffOptions) {
    // Add event listeners for hire buttons
    overlayContainer.querySelectorAll('.hire-staff-button').forEach(button => {
        button.addEventListener('click', () => {
            const staffIndex = parseInt(button.dataset.staffIndex);
            hiringProcess(createdStaffOptions[staffIndex]);
        });
    });

    // Add event listener for close button
    overlayContainer.querySelector('.close-btn').addEventListener('click', () => {
        hideOverlay(overlayContainer);
    });
}

export function hiringProcess(staff) {
    const hiringExpense = staff.wage * 12;
    const currentMoney = parseFloat(localStorage.getItem('money') || '0');

    if (currentMoney < hiringExpense) {
        addConsoleMessage(`Insufficient funds for hiring: <strong>${staff.firstName} ${staff.lastName}</strong>. Required: <strong>${formatNumber(hiringExpense)}€</strong>, Available: <strong>${formatNumber(currentMoney)}€</strong>.`);
        return;
    }

    taskManager.addCompletionTask(
        'Hiring Process',
        'administration', 
        20,
        performHiringProcess,
        null,
        { staff, hiringExpense },
        () => {
            addConsoleMessage(`Started hiring process for ${staff.firstName} ${staff.lastName}...`, true);
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                hideOverlay(overlay);
            }
        }
    );
}

export function performHiringProcess(target, params) {
    const { staff, hiringExpense } = params;
    const staffMembers = loadStaff();
    staffMembers.push(staff);
    saveStaff(staffMembers);

    addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);
    setupStaffWagesRecurringTransaction(); // Update wages after staff is actually hired
    const flagIconHTML = getFlagIconHTML(staff.nationality);
    addConsoleMessage(`${staff.firstName} ${staff.lastName} ${flagIconHTML} has joined your company!`, true);
}
