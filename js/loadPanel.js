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

// Task class definition
export class Task {
    static latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;
    // Define task types with associated processing functions and skill keys
    static taskTypes = {
        'Administration': {
            processPerWorkApplied: 0.6,
            processingFunctions: ['bookkeepingTaskFunction'],
            skillKey: 'administration'
        },
        'Field': {
            processPerWorkApplied: 1,
            processingFunctions: ['plantAcres', 'uproot', 'harvestAcres'],
            skillKey: 'field'
        },
        'Winery': {
            processPerWorkApplied: 10,
            processingFunctions: ['grapeCrushing', 'fermentMust'],
            skillKey: 'winery'
        },
        'Sales': {
            processPerWorkApplied: 2,
            processingFunctions: ['Sales'], // Adjust with specific function if necessary
            skillKey: 'sales'
        }
    };
    constructor(taskName, taskFunction, taskId = null, workTotal = 0, resourceName = '', resourceState = '', vintage = '', quality = '', iconPath = '', fieldName = '', type = 'Administration') {
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
        this.staff = [];
        this.type = type; // Define task type
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

        // Conditional class based on task type
        switch (this.type) {
            case 'Field':
                taskBox.classList.add('field-task');
                break;
            case 'Winery':
                taskBox.classList.add('winery-task');
                break;
            case 'Administration':
                taskBox.classList.add('administration-task');
                break;
            case 'Sales':
                taskBox.classList.add('sales-task');
                break;
            default:
                console.warn(`Unknown task type: ${this.type}`);
        }

        // Constructing the task details part conditionally
        let taskDetailsContent = '';
        const companyName = localStorage.getItem('companyName');

        if (this.type === 'Administration') {
            // No resource details for administration
            taskDetailsContent = `<div><strong>${companyName}</strong></div>`;
        } else if (this.type === 'Winery' || this.type === 'Sales') {
            taskDetailsContent = `<div><strong>${companyName}</strong></div>
                                  <div>${this.resourceName}, ${this.vintage}</div>`;
        } else {
            // Default for Field tasks or other types not specified
            taskDetailsContent = `<div><strong>Field: ${this.fieldName}</strong></div>
                                  <div>${this.resourceName}, ${this.vintage}</div>`;
        }

        // Set the taskBox inner HTML using class names
        taskBox.innerHTML = `
            <div class="task-details">
                ${taskDetailsContent}
            </div>
            <div class="d-flex align-items-center">
                <span class="task-name">${this.taskName}</span>
                <img src="${this.iconPath}" alt="Task Icon" class="task-icon" />
            </div>
        `;

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        const fromLabel = document.createElement('span');
        fromLabel.textContent = `Progress: ${formatNumber(this.workProgress)}`;
        const toLabel = document.createElement('span');
        toLabel.textContent = `Goal: ${formatNumber(this.workTotal)}`;
        const progressBar = document.createElement('div');
        progressBar.className = 'progress';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: ${(this.workProgress / this.workTotal) * 100}%" aria-valuenow="${this.workProgress}" aria-valuemin="0" aria-valuemax="${this.workTotal}"></div>
        `;
        progressInfo.appendChild(fromLabel);
        progressInfo.appendChild(toLabel);
        taskBox.appendChild(progressInfo);
        taskBox.appendChild(progressBar);

        const addStaffBtn = document.createElement('button');
        addStaffBtn.className = 'add-staff-btn';
        addStaffBtn.textContent = 'Add Staff';
        addStaffBtn.addEventListener('click', () => this.openAddStaffOverlay());
        taskBox.appendChild(addStaffBtn);

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
        const staffData = loadStaff().map(staff => ({
            ...staff,
            isAssigned: this.staff.includes(staff.id.toString())
        }));

        // Building UI for staff selection
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
                    ${staffData.map(({ id, name, nationality, isAssigned }) => `
                        <tr>
                            <td>${name}</td>
                            <td>${nationality}</td>
                            <td>
                                <button class="select-staff" data-id="${id}">
                                    ${isAssigned ? 'Remove' : 'Select'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <span class="close-btn">Close</span>
            `;
        overlay.appendChild(overlayContent);
        document.body.appendChild(overlay);

        // Close button functionality
        overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove());

        // Handle staff selection and removal
        overlay.querySelectorAll('.select-staff').forEach(button => {
            button.addEventListener('click', ({ currentTarget }) => {
                const staffId = currentTarget.getAttribute('data-id');
                const isAssigned = this.staff.includes(staffId);

                if (isAssigned) {
                    // Remove staff from task
                    this.staff = this.staff.filter(id => id !== staffId);
                    currentTarget.textContent = 'Select'; // Toggle button label
                } else {
                    // Add staff to task
                    this.staff.push(staffId);
                    currentTarget.textContent = 'Remove'; // Toggle button label
                }

                // Update the task box to reflect changes
                this.updateTaskBoxWithStaff(this.staff);

                // Update the specific task data
                let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                const taskIndex = tasks.findIndex(task => task.taskId === this.taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].staff = this.staff;
                    saveTask(tasks[taskIndex]);
                }
            });
        });
    }

    updateTaskBoxWithStaff(staff, staffContainer = this.taskBox.querySelector('.staff-container')) {
        if (staffContainer) {
            staffContainer.innerHTML = '';  // Clear the container first

            // Create a container for icon and names
            const staffLine = document.createElement('div');
            staffLine.className = 'staff-line';

            // Add the staff icon
            const icon = document.createElement('img');
            icon.src = '/assets/icon/small/staff.png';
            icon.alt = 'Staff Icon';
            icon.className = 'staff-icon';
            staffLine.appendChild(icon);

            // Create a container for the staff names
            const namesContainer = document.createElement('span');
            namesContainer.className = 'staff-names';

            // Limit to first 6 staff names
            const maxVisibleStaff = 6;
            staff.slice(0, maxVisibleStaff).forEach(staffId => {
                const staffName = this.getStaffNameById(staffId);
                const staffLabel = document.createElement('span');
                staffLabel.textContent = `${staffName} `;
                namesContainer.appendChild(staffLabel);
            });

            // Add [...] if there are more staff
            if (staff.length > maxVisibleStaff) {
                const remainingStaff = staff.slice(maxVisibleStaff);
                const remainingNames = remainingStaff.map(id => this.getStaffNameById(id)).join(', ');
                const moreLabel = document.createElement('span');
                moreLabel.textContent = '[...]';
                moreLabel.style.cursor = 'pointer';
                moreLabel.setAttribute('data-toggle', 'tooltip');
                moreLabel.setAttribute('title', remainingNames);
                namesContainer.appendChild(moreLabel);
            }

            // Add the namesContainer to the staffLine
            staffLine.appendChild(namesContainer);

            // Append the whole line to the staffContainer
            staffContainer.appendChild(staffLine);

            // Initialize Bootstrap tooltips
            $(staffContainer).find('[data-toggle="tooltip"]').tooltip({
                container: 'body',
                placement: 'top',
                trigger: 'hover',
                customClass: 'custom-tooltip'
            });
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

// Execute all tasks
export function executeAllTasks() {
    activeTasks.forEach(task => {
        executeTaskFunction(task);
    });
}

// Execute task function
export function executeTaskFunction(task) {
    if (!task || typeof task.taskFunction !== 'function') {
        console.error("Invalid task or task function:", task);
        return;
    }

    // Execute the task function and get the work increment
    const increment = task.taskFunction(task);
    if (increment > 0) {
        // Apply the work progress increment
        task.workProgress += increment;
        task.updateProgressBar();

        // Retrieve all tasks from localStorage, update only the specific task's progress
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskIndex = tasks.findIndex(t => t.taskId === task.taskId);

        if (taskIndex !== -1) {
            // Update just the workProgress field for the specific task
            tasks[taskIndex].workProgress = task.workProgress;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    // Check if the task is complete
    if (task.workProgress >= task.workTotal) {
        task.removeTaskBox();
        removeTask(task.taskId);

        // Log a completion message based on the task type
        switch (true) {
            case task.taskName.startsWith("Bookkeeping"):
                const bookkeepingDetails = task.taskName.split(", ");
                const bookkeepingSeasonYear = bookkeepingDetails[1] || "Unknown Season/Year";
                addConsoleMessage(`Bookkeeping task completed for ${bookkeepingSeasonYear}.`);
                break;
            case task.taskName === "Planting":
                addConsoleMessage(`Planting task completed for field <strong>${task.fieldName || 'Unknown'}</strong> with <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage || 'Unknown'}</strong>.`);
                break;
            case task.taskName === "Crushing Grapes":
                addConsoleMessage(`Crushing task completed for <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>, Quality <strong>${task.quality}</strong>.`);
                break;
            case task.taskName === "Fermenting":
                addConsoleMessage(`Fermenting task completed for <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>.`);
                break;
            case task.taskName === "Harvesting":
                addConsoleMessage(`Harvesting task completed for field <strong>${task.fieldName}</strong> with <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>.`);
                break;
            case task.taskName === "Uprooting":
                addConsoleMessage(`Uprooting task completed for field <strong>${task.fieldName || 'Unknown'}</strong>.`);
                break;
            default:
                console.warn(`No console message for task name: ${task.taskName}`);
        }
    }
}

export { initializePanel };