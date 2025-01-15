import { loadStaff, saveTasks, loadTasks as loadTasksFromStorage } from './database/adminFunctions.js';
import { showStaffOverlay } from './overlays/showstaffoverlay.js';
import { showAssignStaffOverlay } from './overlays/assignStaffOverlay.js';

// Define task types as constants
export const TaskType = {
    field: 'Field',
    winery: 'Winery',
    administration: 'Administration',
    sales: 'Sales',
    building: 'Building',
    maintenance: 'Maintenance'
};

class Task {
    constructor(id, name, type, taskType, durationInWeeks, callback, target = null, params = {}, initialState = null) {
        this.id = id;
        this.name = name;
        this.type = type; // 'progressive' or 'completion'
        this.taskType = taskType; // One of TaskType constants
        this.duration = durationInWeeks;
        this.remainingWeeks = durationInWeeks;
        this.callback = callback;
        this.target = target; // Optional target (farmland, winery, etc.)
        this.params = params;
        this.progress = 0;
        this.initialState = initialState;
    }
}

class TaskManager {
    constructor() {
        this.tasks = loadTasksFromStorage();
        this.taskIdCounter = Math.max(0, ...Array.from(this.tasks.keys()));
        this.updateTaskDisplay();
    }

    addProgressiveTask(name, taskType, durationInWeeks, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        const task = new Task(taskId, name, 'progressive', taskType, durationInWeeks, callback, target, params);
        this.tasks.set(taskId, task);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        return taskId;
    }

    addCompletionTask(name, taskType, durationInWeeks, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        const task = new Task(taskId, name, 'completion', taskType, durationInWeeks, callback, target, params);
        this.tasks.set(taskId, task);
        saveTasks(this.tasks);
        this.updateTaskDisplay();
        return taskId;
    }

    processWeek() {
        this.tasks.forEach(task => {
            task.remainingWeeks--;
            task.progress = (task.duration - task.remainingWeeks) / task.duration;

            if (task.type === 'progressive') {
                // Call callback every week with progress
                task.callback(task.target, task.progress, task.params);
            }

            if (task.remainingWeeks <= 0) {
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
            
            const progress = (task.duration - task.remainingWeeks) / task.duration * 100;
            const iconName = task.name.toLowerCase().replace(/\s+/g, '');
            
            taskBox.innerHTML = `
                ${task.target ? `<div class="task-target">${task.target.name || 'No target'}</div>` : ''}
                <div class="task-header">
                    <div class="task-type">${task.taskType}</div>
                    <img src="../assets/icon/icon_${iconName}.webp" 
                         alt="${task.name}" 
                         class="task-icon"
                         onerror="this.style.display='none'"
                    >
                </div>
                <div class="task-name">${task.name}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>${Math.round(progress)}% complete</span>
                    <span>${task.remainingWeeks} weeks left</span>
                </div>
                ${Array.isArray(task.params.staff) ? `
                    <div class="staff-line">
                        <img src="../assets/icon/small/staff.png" alt="Staff Icon" class="staff-icon">
                        <span class="staff-names">
                            ${task.params.staff.map(s => s.name).join(', ')}
                        </span>
                    </div>
                ` : ''}
                <button class="assign-staff-btn">
                    ${Array.isArray(task.params.staff) ? 'Manage Staff' : 'Assign Staff'}
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
            task.params.staff = assignedStaff;
            
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
