import { getFlagIconHTML } from '../utils.js';
import { loadStaff, loadTeams, loadBuildings } from '../database/adminFunctions.js';
import { Building, Tool } from '../buildings.js';
import taskManager from '../taskManager.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { updateAllDisplays } from '../displayManager.js';

export function showAssignStaffOverlay(task) {
    const buildings = loadBuildings();
    
    const validTools = buildings.flatMap(buildingData => {
        const building = new Building(buildingData.name, buildingData.level);
        building.slots = buildingData.slots.map(slot => ({
            tools: slot.tools.map(toolData => {
                const tool = new Tool(
                    toolData.name,
                    toolData.buildingType,
                    toolData.speedBonus,
                    toolData.cost,
                    toolData.capacity,
                    toolData.supportedResources || [],
                    toolData.weight,
                    toolData.validTasks || [],
                    toolData.toolType // Make sure toolType is passed here
                );
                tool.instanceNumber = toolData.instanceNumber;
                tool.assignedTaskId = toolData.assignedTaskId; // Make sure we copy the assignedTaskId

                return tool;
            }),
            currentWeight: slot.currentWeight
        }));

        // Only filter by task validity, not availability
        const tools = building.getAllTools();
        return tools.filter(tool => tool.isValidForTask(task.name));
    });

    const overlayContent = generateAssignStaffHTML(task, validTools);
    const overlay = showModalOverlay('assignStaffOverlay', overlayContent);
    if (overlay) {
        setupAssignStaffEventListeners(overlay.querySelector('.overlay-content'), task, validTools);
    }
    return overlay;
}

function generateAssignStaffHTML(task, validTools) {
    const allStaff = loadStaff();
    const currentStaff = Array.isArray(task.assignedStaff) ? task.assignedStaff : [];
    const teams = loadTeams();
    const selectedTools = task.params.selectedTools || [];

    // Remove validTools calculation from here since it's now passed in
    const toolsHTML = validTools.length > 0 ? `
        <div class="tools-section mb-3">
            <h5>Available Tools</h5>
            <div class="tool-list">
                ${validTools.map(tool => {
                    const isDisabled = tool.assignedTaskId && tool.assignedTaskId !== task.id;
                    
                    return `
                    <div class="tool-item ${isDisabled ? 'disabled' : ''}">
                        <input type="checkbox" 
                               class="tool-select" 
                               value="${tool.getStorageId()}"
                               ${isDisabled ? 'disabled' : ''}
                               ${!isDisabled && task.params.selectedTools?.includes(tool.getStorageId()) ? 'checked' : ''}>
                        <img src="../assets/icon/buildings/${tool.name.toLowerCase()}.png" 
                             alt="${tool.name}" 
                             style="width: 24px; height: 24px;">
                        <span>${tool.name} #${tool.instanceNumber}</span>
                        <span class="tool-bonus">(+${((tool.speedBonus - 1) * 100).toFixed(0)}% speed)</span>
                    </div>
                    `;
                }).join('')}
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
                    ${autoAssignedTeamsHTML ? '<div class="overlay-divider"></div>' : ''}
                    <div class="staff-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5>Available Staff</h5>
                        </div>
                        <table class="table table-hover justify-content-center w-100">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Nationality</th>
                                    <th>Skills</th>
                                    <th class="text-right">Wage</th>
                                    <th>Select
                                        <br>
                                        <label class="select-all-label">
                                            <input type="checkbox" id="select-all-staff" class="me-2">
                                         </label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>${staffList}</tbody>
                        </table>
                    </div>
                    ${validTools.length > 0 ? '<div class="overlay-divider"></div>' : ''}
                    ${toolsHTML}
                </div>
                <div class="btn-group mt-3">
                    <button class="btn save-staff-btn">Save Assignments</button>
                </div>
            </section>
        </div>
    `;
}

function setupAssignStaffEventListeners(overlayContent, task, validTools) {
    if (!overlayContent) return;
    
    const saveBtn = overlayContent.querySelector('.save-staff-btn');
    const closeBtn = overlayContent.querySelector('.close-btn');
    const selectAllCheckbox = overlayContent.querySelector('#select-all-staff');
    const overlay = document.getElementById('assignStaffOverlay');

    // Add select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const staffCheckboxes = overlay.querySelectorAll('.staff-select');
            staffCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });

        // Update select all checkbox when individual checkboxes change
        const staffCheckboxes = overlay.querySelectorAll('.staff-select');
        staffCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(staffCheckboxes).every(cb => cb.checked);
                const someChecked = Array.from(staffCheckboxes).some(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = someChecked && !allChecked;
            });
        });
    }

    // Add this function to handle tool selection logic
    const handleToolSelection = (checkbox) => {
        const toolId = checkbox.value;
        const tool = validTools.find(t => t.getStorageId() === toolId);
        
        if (!tool || (tool.assignedTaskId && tool.assignedTaskId !== task.id)) {
            checkbox.checked = false;
            return;
        }
    
        console.log('Tool selected:', {
            name: tool.name,
            toolType: tool.toolType,
            id: toolId
        });
    
        const toolCheckboxes = overlay.querySelectorAll('.tool-select');
        
        if (tool.toolType === 'task') {
            console.log('Processing task type tool');
            // If it's a task tool, uncheck all other tools
            toolCheckboxes.forEach(cb => {
                if (cb !== checkbox && cb.checked) {
                    cb.checked = false;
                }
            });
        } else if (tool.toolType === 'individual') {
            console.log('Processing individual type tool');
            // For individual tools, check if we have more tools selected than staff
            const selectedStaffCount = Array.from(overlay.querySelectorAll('.staff-select:checked')).length;
            const selectedIndividualTools = Array.from(toolCheckboxes)
                .filter(cb => {
                    const t = validTools.find(vt => vt.getStorageId() === cb.value);
                    const isIndividual = t && t.toolType === 'individual';
                    console.log('Checking tool:', t?.name, 'Is individual:', isIndividual);
                    return cb.checked && isIndividual;
                }).length;
            
            console.log('Staff count:', selectedStaffCount, 'Individual tools:', selectedIndividualTools);
            
            if (selectedIndividualTools > selectedStaffCount) {
                checkbox.checked = false;
                alert('You cannot assign more individual tools than selected staff members.');
            }
        } else {
            console.log('Unknown tool type:', tool.toolType);
        }
    };

    // Also log the available tools when overlay opens
    console.log('Available tools:', validTools.map(t => ({
        name: t.name,
        toolType: t.toolType,
        id: t.getStorageId()
    })));

    // Update staff selection event listener to handle tool type correctly
    overlay.querySelectorAll('.staff-select').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedStaffCount = Array.from(overlay.querySelectorAll('.staff-select:checked')).length;
            const individualToolCheckboxes = Array.from(overlay.querySelectorAll('.tool-select'))
                .filter(cb => {
                    const tool = validTools.find(t => t.getStorageId() === cb.value);
                    return tool && tool.toolType === 'individual' && cb.checked;
                });
            
            // Only uncheck individual tools if staff count is too low
            if (individualToolCheckboxes.length > selectedStaffCount) {
                individualToolCheckboxes.forEach(cb => cb.checked = false);
                alert('Some individual tools were unselected because there are not enough staff members.');
            }
        });
    });

    // Add tool selection event listeners
    overlay.querySelectorAll('.tool-select').forEach(checkbox => {
        checkbox.addEventListener('change', () => handleToolSelection(checkbox));
    });
    
    // Add staff selection event listener to update tool limits
    overlay.querySelectorAll('.staff-select').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const selectedStaffCount = Array.from(overlay.querySelectorAll('.staff-select:checked')).length;
          const individualToolCheckboxes = Array.from(overlay.querySelectorAll('.tool-select')).filter(cb => {
            const tool = validTools.find(t => t.getStorageId() === cb.value);
            return tool && tool.toolType === 'individual';
          });
          
          // Uncheck excess individual tools if staff count decreases
          if (individualToolCheckboxes.filter(cb => cb.checked).length > selectedStaffCount) {
            individualToolCheckboxes.forEach(cb => {
              if (cb.checked) {
                cb.checked = false;
              }
            });
          }
        });
      });

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
