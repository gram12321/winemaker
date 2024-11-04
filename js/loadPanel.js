// loadPanel.js
import { loadTasks, removeTask } from './database/adminFunctions.js';
import { loadStaff } from './database/adminFunctions.js';
import { activeTasks } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';

// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            loadTasks();
        });
}

// Execute all tasks
export function executeAllTasks() {
    activeTasks.forEach(task => {
        executeTaskFunction(task);
    });
}

// Task class definition
export class Task {
    static latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;
    staff = []; // Array for staff IDs

    constructor(taskName, taskFunction, taskId = null, workTotal = 0, resourceName = '', resourceState = '', vintage = '', quality = '', iconPath = '', fieldName = '') {
        this.taskName = taskName;
        this.taskFunction = taskFunction;
        this.taskId = taskId || Task.generateTaskId();
        this.workTotal = workTotal;
        this.workProgress = 0;
        this.resourceName = resourceName;
        this.resourceState = resourceState;
        this.vintage = vintage;
        this.quality = quality;
        this.iconPath = iconPath;
        this.fieldName = fieldName;
        this.staff = []; // Initialize staff array
        this.createTaskBox();
    }

    static generateTaskId() {
        const newTaskId = ++Task.latestTaskId;
        localStorage.setItem('latestTaskId', newTaskId);
        return newTaskId;
    }

    createTaskBox() {
        const taskList = document.getElementById('task-list');
        if (!taskList) {
            console.error("Element 'task-list' not found");
            return;
        }
        const taskBox = document.createElement('div');
        taskBox.className = 'task-box';
        taskBox.innerHTML = `
            <div class="task-details">
                <div><strong>Field: ${this.fieldName}</strong></div>
            </div>
            <div class="d-flex align-items-center justify-content-between">
                ${this.taskName}
                <img src="${this.iconPath}" alt="Task Icon" class="task-icon" />
            </div>
            <div class="task-details">
                ${this.resourceName}, ${this.vintage}
            </div>
            <button class="add-staff-btn">Add Staff</button>
        `;
        const addStaffBtn = taskBox.querySelector('.add-staff-btn');
        addStaffBtn.addEventListener('click', () => this.openAddStaffOverlay());

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        const fromLabel = document.createElement('span');
        fromLabel.textContent = `Progress: ${formatNumber(this.workProgress)}`;
        const toLabel = document.createElement('span');
        toLabel.textContent = `Goal: ${formatNumber(this.workTotal)}`;
        const progressBar = document.createElement('div');
        progressBar.className = 'progress mt-1';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: ${(this.workProgress / this.workTotal) * 100}%" aria-valuenow="${this.workProgress}" aria-valuemin="0" aria-valuemax="${this.workTotal}"></div>
        `;
        progressInfo.appendChild(fromLabel);
        progressInfo.appendChild(toLabel);
        taskBox.appendChild(progressInfo);
        taskBox.appendChild(progressBar);
        taskList.appendChild(taskBox);

        this.taskBox = taskBox;
    }

    updateProgressBar() {
        if (this.taskBox) {
            const progressBar = this.taskBox.querySelector('.progress-bar');
            const progress = (this.workProgress / this.workTotal) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', this.workProgress);
        }
    }

    removeTaskBox() {
        if (this.taskBox) {
            this.taskBox.remove();
        }
    }

    openAddStaffOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const overlayContent = document.createElement('div');
        overlayContent.className = 'overlay-content';

        const staffData = loadStaff();

        overlayContent.innerHTML = `
            <h2>Select Staff</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Nationality</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${staffData.map(staff => `
                        <tr>
                            <td>${staff.name}</td>
                            <td>${staff.nationality}</td>
                            <td><button class="select-staff" data-id="${staff.id}">Select</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <span class="close-btn">Close</span>
        `;
        overlay.appendChild(overlayContent);
        document.body.appendChild(overlay);

        overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove());
        overlay.querySelectorAll('.select-staff').forEach(button => {
            button.addEventListener('click', (event) => {
                const staffId = event.target.getAttribute('data-id');
                this.staff.push(staffId);
                overlay.remove();
            });
        });
    }
}

// Execute task function
export function executeTaskFunction(task) {
    const increment = task.taskFunction();
    if (increment) {
        task.workProgress += increment;
        task.updateProgressBar();
    }

    if (task.workProgress >= task.workTotal) {
        task.removeTaskBox();
        console.log(`Task completed: ${task.taskName}, Removing task with ID: ${task.taskId}`);
        removeTask(task.taskId);

        switch (task.taskName) {
            case "Planting":
                addConsoleMessage(`Planting task completed for field <strong>${task.fieldName || 'Unknown'}</strong> with <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage || 'Unknown'}</strong>.`);
                break;
            case "Crushing Grapes":
                addConsoleMessage(`Crushing task completed for <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>, Quality <strong>${task.quality}</strong>.`);
                break;
            case "Harvesting":
                addConsoleMessage(`Harvesting task completed for field <strong>${task.fieldName}</strong> with <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>.`);
                break;
            case "Uprooting":
                addConsoleMessage(`Uprooting task completed for field <strong>${task.fieldName || 'Unknown'}</strong>.`);
                break;
            default:
                console.warn(`No console message for task name: ${task.taskName}`);
        }
    }
}

export { initializePanel };