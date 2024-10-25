// loadPanel.js

function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Now the panel is initialized, and the task list should exist.
            // You can now safely create tasks
            initializeTasks(); // Initialize tasks after the panel is setup
        });
}

// Initialize the panel
initializePanel();

function initializeTasks() {
    // Creating a new task after panel and task-list are available
    const task = new Task(
      'Sample Task',
      () => console.log('Task function is running'), // Task function
      () => Math.random() > 0.5 // Condition function
    );
}

export class Task {
  constructor(taskName, taskFunction, conditionFunction) {
    this.taskName = taskName;
    this.taskFunction = taskFunction;
    this.conditionFunction = conditionFunction;

    this.createTaskBox();
  }

  createTaskBox() {
    // Get the task list element
    const taskList = document.getElementById('task-list');
    if (!taskList) {
      console.error("Element 'task-list' not found");
      return;
    }

    // Create task box element
    const taskBox = document.createElement('div');
    taskBox.className = 'task-box bg-light p-2 mb-2';
    taskBox.innerHTML = `<strong>${this.taskName}</strong>`;

    // Button to execute the task
    const executeButton = document.createElement('button');
    executeButton.className = 'btn btn-primary btn-sm ml-2';
    executeButton.textContent = 'Execute';
    executeButton.onclick = () => this.executeTask();

    taskBox.appendChild(executeButton);

    // Append task box to task list
    taskList.appendChild(taskBox);

    // Store reference to task box for removal later
    this.taskBox = taskBox;
  }

  executeTask() {
    // Run the task function
    this.taskFunction();

    // Check the condition
    if (this.conditionFunction()) {
      // Task condition is fulfilled, remove task box
      this.removeTaskBox();
    } else {
      console.log("Task condition not yet fulfilled.");
    }
  }

  removeTaskBox() {
    if (this.taskBox) {
      this.taskBox.remove();
    }
  }
}

export { initializePanel };