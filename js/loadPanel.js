// loadPanel.js
import { loadTasks, removeTask } from './database/adminFunctions.js';
import { activeTasks } from './database/adminFunctions.js'; // Import the instantiatedTasks array
import { addConsoleMessage } from './console.js'; // Ensure this import is present to use addConsoleMessage

// Function to initialize the task panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Now the panel is initialized, and the task list should exist.
            loadTasks(); // This ensures tasks are loaded freshly onto the panel
        });
}

export function executeAllTasks() {
    activeTasks.forEach(task => {
        executeTaskFunction(task); // Execute the task function for each instantiated task
    });
}

// Standalone function to execute a task
export class Task {
    static latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;

    constructor(taskName, taskFunction, taskId = null, workTotal = 0, resourceName = '', resourceState = '', vintage = '', quality = '', iconPath = '') {
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
       this.createTaskBox();
    }

    static generateTaskId() {
        const newTaskId = ++Task.latestTaskId; // Increment the task ID
        localStorage.setItem('latestTaskId', newTaskId); // Store the new task ID back in localStorage
        return newTaskId;
    }

    createTaskBox() {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error("Element 'task-list' not found");
        return;
    }

        // Create the task box element
        const taskBox = document.createElement('div');
        taskBox.className = 'task-box';

        taskBox.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <strong>${this.taskName}</strong>
                <img src="${this.iconPath}" alt="Task Icon" class="task-icon" />
            </div>
            <div class="task-details"><strong>${this.resourceName}, ${this.vintage}</strong> - ${this.quality}</div>
        `;

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';

        const fromLabel = document.createElement('span');
        fromLabel.textContent = `Progress: ${this.workProgress}`;

        const toLabel = document.createElement('span');
        toLabel.textContent = `Goal: ${this.workTotal}`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress mt-1';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: ${this.workProgress / this.workTotal * 100}%" aria-valuenow="${this.workProgress}" aria-valuemin="0" aria-valuemax="${this.workTotal}"></div>
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
}

export function executeTaskFunction(task) {
    const increment = task.taskFunction(); // Function should return progress amount
    if (increment) {
        task.workProgress += increment; 
        task.updateProgressBar();
    }

    if (task.workProgress >= task.workTotal) {
        task.removeTaskBox();
        console.log(`Executing removeTask for ID: ${task.taskId}`);
        removeTask(task.taskId);

        // Add console message with task details
        if (task.taskName === "Planting") {
            addConsoleMessage(`Planting task completed for field <strong>${task.fieldName || 'Unknown'}</strong> with <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage || 'Unknown'}</strong>.`);
        } else if (task.taskName === "Crushing Grapes") {
            addConsoleMessage(`Crushing task completed for <strong>${task.resourceName}</strong>, Vintage <strong>${task.vintage}</strong>, Quality <strong>${task.quality}</strong>.`);
        } else {
            addConsoleMessage(`${task.taskName} task completed for <strong>${task.resourceName}, ${task.vintage}, ${task.quality}.</strong>`);
        }
    }
}
export { initializePanel };