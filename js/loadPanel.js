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
    // Initialize 'latestTaskId' from localStorage, or start at 0 if not set
    static latestTaskId = parseInt(localStorage.getItem('latestTaskId'), 10) || 0;

    constructor(taskName, taskFunction, taskId = null, workTotal = 0, resourceName = '', resourceState = '', vintage = '', quality = '') {
        this.taskName = taskName;
        this.taskFunction = taskFunction;
        this.taskId = taskId || Task.generateTaskId();
        this.workTotal = workTotal;
        this.workProgress = 0;

        // Store the additional properties
        this.resourceName = resourceName;
        this.resourceState = resourceState;
        this.vintage = vintage;
        this.quality = quality;
        this.createTaskBox();
        console.log(`Task created with ID: ${this.taskId}`);
    }

    static generateTaskId() {
        const newTaskId = ++Task.latestTaskId; // Increment the task ID
        // Store the new task ID back in localStorage
        localStorage.setItem('latestTaskId', newTaskId);
        return newTaskId;
    }

    createTaskBox() {
        // Get the task list element
        const taskList = document.getElementById('task-list');
        if (!taskList) {
            console.error("Element 'task-list' not found");
            return;
        }
        // Create the task box element
        const taskBox = document.createElement('div');
        taskBox.className = 'task-box bg-light p-2 mb-2';
        taskBox.innerHTML = `<strong>${this.taskName}</strong>`;
        // Add the progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress mt-2';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        `;
        // Append the progress bar to the task box
        taskBox.appendChild(progressBar);
        // Append task box to task list
        taskList.appendChild(taskBox);
        // Store reference to task box for future updates
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

// Note: Ensure the executeTaskFunction is updated to increment workProgress like below:

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

