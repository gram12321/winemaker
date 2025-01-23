import { getFlagIconHTML } from '../utils.js';
import { loadStaff } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { updateAllDisplays } from '../displayManager.js';

export function showAssignStaffOverlay(task) {
    const overlayContent = generateAssignStaffHTML(task);
    const overlay = showModalOverlay('assignStaffOverlay', overlayContent);
    if (overlay) {
        setupAssignStaffEventListeners(overlay.querySelector('.overlay-content'), task);
    }
    return overlay;
}

function generateAssignStaffHTML(task) {
    const allStaff = loadStaff();
    const currentStaff = Array.isArray(task.assignedStaff) ? task.assignedStaff : [];

    const staffList = allStaff.map(staff => {
        const skillsHTML = `
            <div class="skill-bar-container">
                <div class="skill-bar" style="width: ${parseFloat(staff.skills.field.field) * 100}%; background-color: #ffcc00; height: 20px;" title="Field Skill: ${staff.skills.field.field}">F</div>
                <div class="skill-bar" style="width: ${parseFloat(staff.skills.winery.winery) * 100}%; background-color: #2179ff; height: 20px;" title="Winery Skill: ${staff.skills.winery.winery}">W</div>
                <div class="skill-bar" style="width: ${parseFloat(staff.skills.administration.administration) * 100}%; background-color: #6c757d; height: 20px;" title="Administration Skill: ${staff.skills.administration.administration}">A</div>
                <div class="skill-bar" style="width: ${parseFloat(staff.skills.sales.sales) * 100}%; background-color: #28a745; height: 20px;" title="Sales Skill: ${staff.skills.sales.sales}">S</div>
                <div class="skill-bar" style="width: ${parseFloat(staff.skills.maintenance.maintenance) * 100}%; background-color: #d9534f; height: 20px;" title="Maintenance Skill: ${staff.skills.maintenance.maintenance}">M</div>
            </div>
        `;

        return `
            <tr>
                <td>${staff.name}</td>
                <td>${getFlagIconHTML(staff.nationality)} ${staff.nationality}</td>
                <td>${skillsHTML}</td>
                <td class="text-right">€${staff.wage}</td>
                <td>
                    <input type="checkbox" 
                           class="staff-select" 
                           value="${staff.id}"
                           ${currentStaff.some(s => s.id === staff.id) ? 'checked' : ''}>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="overlay-section-wrapper">
            <section class="overlay-section card">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">Assign Staff to ${task.name}</h2>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Nationality</th>
                                <th>Skills</th>
                                <th class="text-right">Wage</th>
                                <th>Select</th>
                            </tr>
                        </thead>
                        <tbody>${staffList}</tbody>
                    </table>
                </div>
            </div>
            <div class="btn-group mt-3">
                <button class="btn save-staff-btn">Save Assignments</button>
            </div>
        </section>
    </div>
    `;
}

function setupAssignStaffEventListeners(overlayContent, task) {
    if (!overlayContent) return;
    
    const saveBtn = overlayContent.querySelector('.save-staff-btn');
    const closeBtn = overlayContent.querySelector('.close-btn');
    const overlay = document.getElementById('assignStaffOverlay');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const selectedStaff = Array.from(overlay.querySelectorAll('.staff-select:checked'))
                .map(checkbox => parseInt(checkbox.value));
            taskManager.assignStaffToTask(task.id, selectedStaff);
            updateAllDisplays();
            hideOverlay(overlay);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideOverlay(overlay);
        });
    }

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            hideOverlay(overlay);
        }
    });
}
