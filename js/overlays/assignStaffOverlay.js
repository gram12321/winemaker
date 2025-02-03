import { getFlagIconHTML } from '../utils.js';
import { loadStaff, loadTeams, loadBuildings } from '../database/adminFunctions.js';
import { Building } from '../buildings.js';
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
    const teams = loadTeams();
    
    // Get available tools for this task
    const buildings = loadBuildings();
    const validTools = buildings.flatMap(buildingData => {
        const building = new Building(buildingData.name, buildingData.level);
        // Copy slots from stored data
        building.slots = buildingData.slots || [];
        return building.getAllTools().filter(tool => tool.isValidForTask(task.taskType));
    });

    const selectedTools = task.params.selectedTools || [];

    const toolsHTML = validTools.length > 0 ? `
        <div class="tools-section mb-3">
            <h5>Available Tools</h5>
            <div class="tool-list">
                ${validTools.map(tool => `
                    <div class="tool-item">
                        <input type="checkbox" 
                               class="tool-select" 
                               value="${tool.getStorageId()}"
                               ${selectedTools.includes(tool.getStorageId()) ? 'checked' : ''}>
                        <img src="../assets/icon/buildings/${tool.name.toLowerCase()}.png" 
                             alt="${tool.name}" 
                             style="width: 24px; height: 24px;">
                        <span>${tool.name} #${tool.instanceNumber}</span>
                        <span class="tool-bonus">(+${((tool.speedBonus - 1) * 100).toFixed(0)}% speed)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    // Find teams that are set to auto-assign to this task type
    const autoAssignedTeams = teams.filter(team => 
        team.defaultTaskTypes?.includes(task.taskType)
    );

    const autoAssignedTeamsHTML = autoAssignedTeams.length > 0 ? `
        <div class="auto-assigned-teams mb-3">
            <h5>Auto-assigned Teams</h5>
            <div class="team-badges">
                ${autoAssignedTeams.map(team => {
                    const memberNames = team.members.map(m => `${m.firstName} ${m.lastName}`).join('\n');
                    const tooltipText = team.members.length > 0 
                        ? `Team Members:\n${memberNames}`
                        : 'No members assigned';
                    
                    return `
                        <div class="team-badge" title="${tooltipText}">
                            <img src="/assets/icon/icon_${team.flagCode}.webp" 
                                 alt="${team.name}" 
                                 style="width: 16px; height: 16px;"
                                 onerror="this.style.display='none'">
                            <span>${team.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : '';

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
                    <h2 class="mb-0">Assign Staff & Tools to ${task.name}</h2>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    ${autoAssignedTeamsHTML}
                    ${toolsHTML}
                    <table class="table table-hover justify-content-center w-100">
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
            
            // Get selected tools
            const selectedTools = Array.from(overlay.querySelectorAll('.tool-select:checked'))
                .map(checkbox => checkbox.value);

            // Update task with both staff and tools
            task.params.selectedTools = selectedTools;
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
