import { saveTasks, updateFarmland, loadBuildings, storeBuildings,  loadTasks as loadTasksFromStorage } from './database/adminFunctions.js';
import { updateAllDisplays } from './displayManager.js';
import { showAssignStaffOverlay } from './overlays/assignStaffOverlay.js';
import { getFlagIconHTML, getColorClass, formatNumber } from './utils.js';
import { bookkeeping, maintenanceBuildings } from './administration.js'; // Update this line
import { performHarvest } from './overlays/harvestOverlay.js';
import { performCrushing } from './overlays/crushingOverlay.js';
import { performFermentation } from './wineprocessing.js';
import { showHireStaffOverlay } from './overlays/hirestaffoverlay.js';
import { Building, updateBuildingCards, updateBuildButtonStates } from './buildings.js';
import { updateUpgradesList } from './overlays/mainpages/financeoverlay.js';
import { applyUpgradeBenefits, upgrades, performUpgrade } from './upgrade.js'; // Add this import
import { addTransaction } from './finance.js';
import { setupStaffWagesRecurringTransaction } from './staff.js';
import { addConsoleMessage } from './console.js';
import { loadStaff, saveStaff, loadTeams } from './database/initiation.js';
import { performClearing } from './overlays/clearingOverlay.js';  // Add this import
import { performPlanting } from './overlays/plantingOverlay.js';  // Add this import
import { performUproot } from './overlays/uprootOverlay.js';  // Add this import


// Internal mapping for display names
const taskDisplayNames = {
    'field': 'Field',
    'winery': 'Winery',
    'administration': 'Administration',
    'sales': 'Sales',
    'maintenance': 'Building & Maintenance'
};

class Task {
    constructor(id, name, type, taskType, totalWork, callback, target = null, params = {}, initialState = null) {
        this.id = id;
        this.name = name;
        this.type = type; // 'progressive' or 'completion'
        this.taskType = taskType; // One of TaskType constants
        this.totalWork = totalWork;
        this.appliedWork = 0;
        this.callback = callback;
        this.target = target; // Optional target (required for field tasks)
        this.params = params;
        this.progress = 0;
        this.initialState = initialState;
        this.assignedStaff = params.assignedStaff || [];
        this.params.selectedTools = Array.isArray(params.selectedTools) ? params.selectedTools : [];
    }
}

class TaskManager {
    constructor() {
        this.tasks = loadTasksFromStorage();
        // Assign callbacks to loaded tasks
        this.tasks.forEach(task => {
            task.callback = this.getTaskCallback(task.name, task.taskType);
        });
        this.taskIdCounter = Math.max(0, ...Array.from(this.tasks.keys()));
        this.updateTaskDisplay();
    }

    getDefaultTeamMembers(taskType) {
        const teams = loadTeams();
        const matchingTeams = teams.filter(team => 
            team.defaultTaskTypes?.includes(taskType)
        );
        
        // Combine all unique members from matching teams
        const allMembers = new Map(); // Use Map to ensure uniqueness by ID
        matchingTeams.forEach(team => {
            team.members.forEach(member => {
                allMembers.set(member.id, member);
            });
        });
        
        return Array.from(allMembers.values());
    }

    addProgressiveTask(name, taskType, totalWork, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        // Get default team members for this task type
        const defaultMembers = this.getDefaultTeamMembers(taskType);
        
        const task = new Task(taskId, name, 'progressive', taskType, totalWork, callback, target, { 
            ...params, 
            assignedStaff: defaultMembers 
        });
        
        this.tasks.set(taskId, task);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        return taskId;
    }

    addCompletionTask(name, taskType, totalWork, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        // Get default team members for this task type
        const defaultMembers = this.getDefaultTeamMembers(taskType);
        
        const task = new Task(taskId, name, 'completion', taskType, totalWork, callback, target, { 
            ...params, 
            assignedStaff: defaultMembers 
        });
        
        this.tasks.set(taskId, task);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        return taskId;
    }

    checkDateTriggeredTasks() {
        bookkeeping();
        maintenanceBuildings(); // Add this line to trigger building maintenance
    }

    processWeek() {
        // Get current tasks state before processing the week
        const staffTaskCount = new Map();

        // Count the number of tasks each staff member is assigned to
        this.tasks.forEach(task => {
            task.assignedStaff.forEach(staff => {
                if (!staffTaskCount.has(staff.id)) {
                    staffTaskCount.set(staff.id, 0);
                }
                staffTaskCount.set(staff.id, staffTaskCount.get(staff.id) + 1);
            });
        });

        this.tasks.forEach(task => {
            if (!task.callback) {
                console.warn(`Task ${task.name} has no callback, skipping...`);
                return;
            }
            let appliedWork = 0;
            task.assignedStaff.forEach(staff => {
                let relevantSkill = 0;
                switch (task.taskType) {
                    case 'field':
                        relevantSkill = staff.skills.field.field;
                        break;
                    case 'winery':
                        relevantSkill = staff.skills.winery.winery;
                        break;
                    case 'administration':
                        relevantSkill = staff.skills.administration.administration;
                        break;
                    case 'sales':
                        relevantSkill = staff.skills.sales.sales;
                        break;
                    case 'maintenance':
                        relevantSkill = staff.skills.maintenance.maintenance;
                        break;
                    // Add more cases for other task types if needed
                    default:
                        relevantSkill = 0;
                }
                const taskCount = staffTaskCount.get(staff.id) || 1;
                appliedWork += (staff.workforce / taskCount) * relevantSkill;
            });

            // Apply tool bonus if any tools are assigned
            const toolBonus = this.calculateToolSpeedBonus(task.params.selectedTools || []);
            appliedWork *= toolBonus;

            task.appliedWork += appliedWork;
            task.progress = task.appliedWork / task.totalWork;

            if (task.type === 'progressive') {
                // Call callback every week with progress
                task.callback(task.target, task.progress, task.params);
            }

            if (task.appliedWork >= task.totalWork) {
                if (task.type === 'completion') {
                    task.callback(task.target, task.params);
                }
                this.removeTask(task.id);  // Task is removed when complete
            }
        });
        saveTasks(this.tasks);
        this.updateTaskDisplay(); // Add this line to update display after processing
    }

    removeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
            const buildings = loadBuildings();
            
            // Release tools assigned through assignStaff
            if (Array.isArray(task.params.selectedTools)) {
                task.params.selectedTools.forEach(toolId => {
                    const tool = this.findToolById(buildings, toolId);
                    if (tool) {
                        tool.releaseFromTask();
                    }
                });
            }
            
            // Release crushing tools assigned directly
            if (task.name === 'Crushing' && task.params.selectedMethod) {
                buildings.forEach(building => {
                    building.slots.forEach(slot => {
                        slot.tools.forEach(tool => {
                            if (tool.name === task.params.selectedMethod && tool.assignedTaskId === taskId) {
                                tool.releaseFromTask();
                            }
                        });
                    });
                });
            }
            
            storeBuildings(buildings);
        }
        this.tasks.delete(taskId);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        updateAllDisplays();
    }

    getTaskProgress(taskId) {
        const task = this.tasks.get(taskId);
        return task ? task.progress : 1;
    }

    cancelTask(taskId) {
        this.removeTask(taskId);
    }

    isTargetBusy(target) {
        if (!target) return false;
        return Array.from(this.tasks.values()).some(task => 
            task.target && task.target.id === target.id
        );
    }

    getTargetCurrentTask(target) {
        if (!target) return null;
        return Array.from(this.tasks.values()).find(task => 
            task.target && task.target.id === target.id
        );
    }

    getAllTasks() {
        return Array.from(this.tasks.values());
    }

    updateTaskDisplay() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        taskList.innerHTML = '';
        
        this.getAllTasks().forEach(task => {
            const taskBox = document.createElement('div');
            const displayName = taskDisplayNames[task.taskType.toLowerCase()] || task.taskType;
            taskBox.className = `task-box ${task.taskType.toLowerCase()}-task`;
            
            const progress = task.appliedWork / task.totalWork * 100;
            const progressClass = getColorClass(progress / 100);
            const iconName = task.name.split(' ')[0].toLowerCase();
            
            // Get list of assigned staff first names, limit display to 4 names
            const staffNames = task.assignedStaff.map(s => s.name.split(' ')[0]);
            const displayedStaffNames = staffNames.slice(0, 4).join(', ');
            const tooltipStaffNames = staffNames.join(', '); // Full list for tooltip

            // Get default staff (ID 1) for nationality flag when no target exists
            // This ensures we always show a nationality flag in the task box:
            // - If task has a target: Show target's country flag
            // - If no target: Show nationality flag of staff ID 1
            const defaultStaff = loadStaff().find(s => s.id === 1);
            const defaultFlag = defaultStaff ? getFlagIconHTML(defaultStaff.nationality) : '';
            
            // Fix the target display by checking if it's an object
            const targetDisplay = task.target ? 
                (task.target.name || task.target) : // Use name if available, otherwise use target directly
                task.taskType;

            taskBox.innerHTML = `
                <div class="task-name">
                    ${task.target && task.target.name ? 
                        (task.target.country ? getFlagIconHTML(task.target.country) : defaultFlag) : 
                        defaultFlag}
                    ${task.name}
                </div>
                <div class="task-header">
                    ${(task.target && task.target.name) ? `<div class="task-type">${displayName}</div>` : ''}
                    <img src="../assets/icon/icon_${iconName}.webp" 
                         alt="${task.name}" 
                         class="task-icon"
                         onerror="this.style.display='none'"
                    >
                </div>
                ${task.name !== task.taskType ? `
                <div class="task-target">
                    ${targetDisplay}
                </div>
                ` : ''}
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
                </div>
                <div class="progress-info">
                    <span class="${progressClass}">${Math.round(progress)}% complete</span>
                    <span>${Math.round(task.totalWork - task.appliedWork)} work left</span>
                </div>
                ${Array.isArray(task.assignedStaff) && task.assignedStaff.length > 0 ? `
                    <div class="staff-line" title="${tooltipStaffNames}">
                        <img src="../assets/icon/small/staff.png" alt="Staff Icon" class="staff-icon">
                        <span class="staff-names">
                            ${displayedStaffNames}${task.assignedStaff.length > 4 ? ', [...]' : ''}
                        </span>
                    </div>
                ` : ''}
                <button class="assign-staff-btn">
                    ${Array.isArray(task.assignedStaff) && task.assignedStaff.length > 0 ? 'Manage Staff' : 'Assign Staff'}
                </button>
            `;
            
            // Add click event listener to the assign staff button
            const assignButton = taskBox.querySelector('.assign-staff-btn');
            assignButton.addEventListener('click', () => {
                showAssignStaffOverlay(task);
            });
            
            taskList.appendChild(taskBox);
        });
    }

    assignStaffToTask(taskId, staffIds) {
        const task = this.tasks.get(taskId);
        if (task) {
            // First release any previously assigned tools
            if (task.params.selectedTools) {
                const buildings = loadBuildings();
                task.params.selectedTools.forEach(toolId => {
                    const tool = this.findToolById(buildings, toolId);
                    if (tool) {
                        tool.releaseFromTask();
                    }
                });
            }

            // Load actual staff objects
            const allStaff = loadStaff();
            const assignedStaff = staffIds.map(id => 
                allStaff.find(s => s.id === parseInt(id))
            ).filter(s => s);

            // Update task params with assigned staff
            task.assignedStaff = assignedStaff;
            
            // Assign new tools
            const selectedTools = task.params.selectedTools || [];
            const buildings = loadBuildings();
            selectedTools.forEach(toolId => {
                const tool = this.findToolById(buildings, toolId);
                if (tool && tool.isAvailable()) {
                    tool.assignToTask(taskId);
                }
            });
            storeBuildings(buildings);
            
            saveTasks(this.tasks);
            this.updateTaskDisplay();
            return true;
        }
        return false;
    }

    getTaskCallback(taskName, taskType) {
        switch (taskName.toLowerCase()) {
            case 'upgrade':
                return performUpgrade;  // Just return the function directly
            case 'building & maintenance':
                return (target, params) => {
                    if (params.buildingCost) {
                        const newBuilding = new Building(target);
                        const buildings = loadBuildings();
                        buildings.push(newBuilding);
                        storeBuildings(buildings);
                        addConsoleMessage(`${target} has been built successfully. Cost: €${formatNumber(params.buildingCost)}. Capacity: ${newBuilding.capacity}`);
                    } else if (params.upgradeCost) {
                        const buildings = loadBuildings();
                        const buildingToUpgrade = buildings.find(b => b.name === target);
                        if (buildingToUpgrade) {
                            const building = new Building(buildingToUpgrade.name, buildingToUpgrade.level, buildingToUpgrade.tools || []);
                            building.upgrade();
                            const updatedBuildings = buildings.map(b => b.name === target ? building : b);
                            storeBuildings(updatedBuildings);
                            addConsoleMessage(`${target} has been upgraded to level ${building.level}. Cost: €${formatNumber(params.upgradeCost)}. New Capacity: ${building.capacity}`);
                        }
                    }
                    updateBuildingCards();
                    updateBuildButtonStates();
                };
            case 'planting':
                return (target, progress, params) => {
                    if (progress >= 1) {
                        performPlanting(target, params);
                    }
                };
            case 'staff search':
                return (target, params) => {
                    showHireStaffOverlay(params.numberOfCandidates);
                };
            case 'hiring process':
                return (target, params) => {
                    const { staff, hiringExpense } = params;
                    const staffMembers = loadStaff();
                    staffMembers.push(staff);
                    saveStaff(staffMembers);
                    addTransaction('Expense', `Hiring expense for ${staff.firstName} ${staff.lastName}`, -hiringExpense);
                    const flagIconHTML = getFlagIconHTML(staff.nationality);
                    addConsoleMessage(`${staff.firstName} ${staff.lastName} ${flagIconHTML} has joined your company!`, true);
                    setupStaffWagesRecurringTransaction();
                };
            case 'harvesting':
                return (target, progress, params) => {
                    if (!params.lastProgress) params.lastProgress = 0;
                    const progressIncrement = progress - params.lastProgress;
                    const harvestedAmount = params.totalHarvest * progressIncrement;
                    params.lastProgress = progress;

                    if (harvestedAmount > 0 && params.selectedTools?.length > 0) {
                        const speedBonus = this.calculateToolSpeedBonus(params.selectedTools);
                        performHarvest(target, target.id, params.selectedTools, harvestedAmount);
                    }
                };
            case 'crushing':
                return (target, progress, params = {}) => {
                    if (!params.lastProgress) params.lastProgress = 0;
                    const mustAmount = params.totalGrapes * 0.6;
                    const processedAmount = mustAmount * (progress - params.lastProgress);
                    params.lastProgress = progress;
                    performCrushing(params.selectedStorages, processedAmount, params.totalGrapes);
                };
            case 'fermentation':
                return (target, progress, params) => {
                    performFermentation(target, progress, params);
                };
            case 'uprooting':
                return (target, progress) => {
                    if (progress >= 1) {
                        performUproot(target);
                    }
                };
            case 'maintain':
                return (target, params) => {
                    addConsoleMessage(`Maintenance of ${target.name} completed successfully.`);
                };
            case 'bookkeeping':
                return (target, params) => {
                    const { prevSeason, prevYear } = params;
                    addConsoleMessage(`Bookkeeping for ${prevSeason} ${prevYear} completed successfully.`);
                };
            case 'clearing':
                return (target, progress, params) => {
                    if (progress >= 1) {
                        performClearing(target, params);
                    }
                };

            default:
                return () => console.warn(`No callback found for task: ${taskName}`);
        }
    }

    calculateToolSpeedBonus(toolIds) {
        if (!Array.isArray(toolIds) || toolIds.length === 0) return 1.0;

        const buildings = loadBuildings();
        const allTools = buildings.flatMap(buildingData => {
            const building = new Building(buildingData.name, buildingData.level);
            building.slots = buildingData.slots || [];
            return building.getAllTools();
        });

        // Find selected tools and calculate combined bonus
        const selectedTools = allTools.filter(tool => 
            toolIds.includes(tool.getStorageId())
        );

        // Combine tool bonuses (multiplicative)
        return selectedTools.reduce((bonus, tool) => bonus * tool.speedBonus, 1.0);
    }

    findToolById(buildings, toolId) {
        return buildings.flatMap(b => 
            b.slots.flatMap(slot => 
                slot.tools.find(t => t.getStorageId() === toolId)
            )
        ).find(t => t);
    }

}

const taskManager = new TaskManager();
export default taskManager;

