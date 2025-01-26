import { loadStaff, saveTasks, loadTasks as loadTasksFromStorage } from './database/adminFunctions.js';
import { updateAllDisplays } from './displayManager.js';
import { showStaffOverlay } from './overlays/showstaffoverlay.js';
import { showAssignStaffOverlay } from './overlays/assignStaffOverlay.js';
import { getFlagIconHTML, getColorClass } from './utils.js';
import { bookkeeping } from './administration.js';


// Define task types as constants
export const TaskType = {
    field: 'Field',
    winery: 'Winery',
    administration: 'Administration',
    sales: 'Sales',
    maintenance: 'Building & Maintenance',
    crushing: 'Crushing'
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
    }
}

class TaskManager {
    constructor() {
        this.tasks = loadTasksFromStorage();
        this.taskIdCounter = Math.max(0, ...Array.from(this.tasks.keys()));
        this.updateTaskDisplay();
    }

    addProgressiveTask(name, taskType, totalWork, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        const task = new Task(taskId, name, 'progressive', taskType, totalWork, callback, target, { ...params, assignedStaff: [] });
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

        const task = new Task(taskId, name, 'completion', taskType, totalWork, callback, target, { ...params, assignedStaff: [] });
        this.tasks.set(taskId, task);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        return taskId;
    }

    checkDateTriggeredTasks() {
        // Check for tasks that should be triggered based on game date
        bookkeeping();
        // Add more date-triggered tasks here as needed
    }

    processWeek() {
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
            let appliedWork = 0;
            task.assignedStaff.forEach(staff => {
                let relevantSkill = 0;
                switch (task.taskType) {
                    case TaskType.field:
                        relevantSkill = staff.skills.field.field;
                        break;
                    case TaskType.winery:
                        relevantSkill = staff.skills.winery.winery;
                        break;
                    case TaskType.administration:
                        relevantSkill = staff.skills.administration.administration;
                        break;
                    case TaskType.sales:
                        relevantSkill = staff.skills.sales.sales;
                        break;
                    case TaskType.maintenance:
                        relevantSkill = staff.skills.maintenance.maintenance;
                        break;
                    // Add more cases for other task types if needed
                    default:
                        relevantSkill = 0;
                }
                const taskCount = staffTaskCount.get(staff.id) || 1;
                appliedWork += (staff.workforce / taskCount) * relevantSkill;
            });

            task.appliedWork += appliedWork;
            task.progress = task.appliedWork / task.totalWork;

            if (task.type === 'progressive') {
                // Call callback every week with progress
                task.callback(task.target, task.progress, task.params);
            }

            if (task.appliedWork >= task.totalWork) {
                if (task.type === 'completion') {
                    // Call callback only on completion
                    task.callback(task.target, task.params);
                }
                this.removeTask(task.id);
            }
        });
        saveTasks(this.tasks);
        this.updateTaskDisplay(); // Add this line to update display after processing
    }

    removeTask(taskId) {
        this.tasks.delete(taskId);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        updateAllDisplays(); // Add this line to update all displays when a task is removed
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
            
            taskBox.innerHTML = `
                <div class="task-name">
                    ${task.target && task.target.name ? 
                        (task.target.country ? getFlagIconHTML(task.target.country) : defaultFlag) : 
                        defaultFlag}
                    ${task.name}
                </div>
                <div class="task-header">
                    ${(task.target && task.target.name) ? `<div class="task-type">${task.taskType}</div>` : ''}
                    <img src="../assets/icon/icon_${iconName}.webp" 
                         alt="${task.name}" 
                         class="task-icon"
                         onerror="this.style.display='none'"
                    >
                </div>
                ${task.name !== task.taskType ? `
                <div class="task-target">
                    ${task.target && task.target.name ? task.target.name : task.taskType}
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
            // Load actual staff objects
            const allStaff = loadStaff();
            const assignedStaff = staffIds.map(id => 
                allStaff.find(s => s.id === parseInt(id))
            ).filter(s => s); // Filter out any undefined staff

            // Update task params with assigned staff
            task.assignedStaff = assignedStaff;
            
            // Save tasks to persist changes
            saveTasks(this.tasks);
            
            // Update display
            this.updateTaskDisplay();
            return true;
        }
        return false;
    }
}

const taskManager = new TaskManager();
export default taskManager;

