// loadPanel.js
import { loadTasks, removeTask, saveTask, loadStaff} from './database/adminFunctions.js';
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
    staff = [];  // Initialized as an empty array
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
        this.staff = [];  // Ensure it's an array
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
        // Add a container to display selected staff
        const staffContainer = document.createElement('div');
        staffContainer.className = 'staff-container';
        this.updateTaskBoxWithStaff(this.staff, staffContainer);
        taskBox.appendChild(staffContainer);
        taskList.appendChild(taskBox);
        this.taskBox = taskBox;
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
                            <td><button class="select-staff" data-id="${staff.id}" data-name="${staff.name}">Select</button></td>
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
                const staffName = event.target.getAttribute('data-name');
                this.staff.push(staffId);
                this.updateTaskBoxWithStaff(this.staff);
                // Retrieve current tasks and update the specific task
                let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                const taskIndex = tasks.findIndex(task => task.taskId === this.taskId);
                if (taskIndex !== -1) {
                    // Update only the staff and other necessary parts of the existing task
                    tasks[taskIndex].staff = this.staff;
                    saveTask(tasks[taskIndex]);
                }
                overlay.remove();
            });
        });
    }
    updateTaskBoxWithStaff(staff, staffContainer = this.taskBox.querySelector('.staff-container')) {
        if (staffContainer) {
            staffContainer.innerHTML = '';  // Clear the container first

            // Create a container for icon and names
            const staffLine = document.createElement('div');
            staffLine.style.display = 'flex';
            staffLine.style.alignItems = 'center'; // Vertically center the items

            // Add the staff icon
            const icon = document.createElement('img');
            icon.src = '/assets/icon/small/staff.png';
            icon.alt = 'Staff Icon';
            icon.style.width = '15px'; // Set the icon size to 15px
            icon.style.marginRight = '5px'; // Add some margin for spacing
            staffLine.appendChild(icon);

            // Create a container for the staff names with smaller font
            const namesContainer = document.createElement('span');
            namesContainer.style.fontSize = '0.8em'; // Smaller font size, can adjust if needed

            // Add each staff name to the names container
            staff.forEach(staffId => {
                const staffName = this.getStaffNameById(staffId);
                const staffLabel = document.createElement('span');
                staffLabel.textContent = `${staffName} `;
                namesContainer.appendChild(staffLabel);
            });

            // Add the namesContainer to the staffLine
            staffLine.appendChild(namesContainer);

            // Append the whole line to the staffContainer
            staffContainer.appendChild(staffLine);
        }
    }
    getStaffNameById(staffId) {
        const staffData = loadStaff();
        const staffMember = staffData.find(staff => staff.id.toString() === staffId.toString());
        return staffMember ? staffMember.name : 'Unknown';
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