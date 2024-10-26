// loadPanel.js
import { loadTasks, removeTask } from './database/adminFunctions.js';
import { activeTasks } from './database/adminFunctions.js'; // Import the instantiatedTasks array

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
        console.log(`Icon Path on Task creation: ${this.iconPath}`); // Log here for debugging
        this.createTaskBox();
        console.log(`Task created with ID: ${this.taskId}`);
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
        taskBox.className = 'task-box bg-light p-2 mb-2';
        taskBox.style.position = 'relative'; // Ensure the task box is positioned relatively to enable absolute positioning within

        taskBox.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <strong>${this.taskName}</strong>
                <img src="${this.iconPath}" alt="Task Icon" style="width: 42px; height: 42px; position: absolute; top: 12px; right: 12px; border-radius: 50%;" />
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
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }

    removeTaskBox() {
        if (this.taskBox) {
            this.taskBox.remove();
        }
    }
}

export function executeTaskFunction(task) {
    const increment = task.taskFunction(); // Let the task function return the increment done

    if (increment) {
        task.workProgress += increment; // Add the returned increment
        task.updateProgressBar(); // Update the progress bar
    }

    // Check the progress
    if (task.workProgress >= task.workTotal) {
        task.removeTaskBox();
        console.log(`Executing removeTask for ID: ${task.taskId}`);
        removeTask(task.taskId);
    } else {
        console.log(`Task condition not yet fulfilled. Progress: ${task.workProgress}/${task.workTotal}`);
    }
}

export { initializePanel };