// loadPanel.js

function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);
            loadTasks(); // Load tasks from local storage after the panel is initialized
        });
}

const tasks = [];

function spawnTask(taskName, taskFunction, conditionFunction) {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error("Task list element not found.");
        return;
    }
    const taskBox = document.createElement('div');
    taskBox.className = 'task-box bg-secondary text-center mb-2';
    taskBox.dataset.task = taskName;
    taskBox.innerHTML = `<p class="m-0">${taskName}</p>`;
    taskList.appendChild(taskBox);
    tasks.push({
        taskName,
        taskFunction: taskFunction.toString(), // Store the function as a string
        conditionFunction: conditionFunction.toString(), // Store the function as a string
        taskBox
    });
    saveTasks(); // Save tasks to localStorage
}

function saveTasks() {
    const tasksData = tasks.map(task => ({
        taskName: task.taskName,
        taskFunction: task.taskFunction,
        conditionFunction: task.conditionFunction,
    }));
    localStorage.setItem('tasks', JSON.stringify(tasksData));
}

function loadTasks() {
    const tasksData = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasksData.forEach(taskData => {
        const taskFunction = new Function(`return ${taskData.taskFunction}`)();
        const conditionFunction = new Function(`return ${taskData.conditionFunction}`)();
        spawnTask(taskData.taskName, taskFunction, conditionFunction);
    });
}

initializePanel();

export { initializePanel, spawnTask, tasks };