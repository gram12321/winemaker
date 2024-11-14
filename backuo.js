


// Add this function in administration.js
export function handleHiringTask() {
    const isHiringTaskAlreadyActive = activeTasks.some(task => task.taskName.startsWith("Hiring"));

    if (isHiringTaskAlreadyActive) {
        const activeHiringTask = activeTasks.find(task => task.taskName.startsWith("Hiring"));

        if (activeHiringTask) {
            activeHiringTask.workTotal += 10; // Example increment, adjust as needed

            // Save the updated task back to localStorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskIndex = tasks.findIndex(task => task.taskId === activeHiringTask.taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].workTotal = activeHiringTask.workTotal;
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
        }
        addConsoleMessage(`<span style="color: red;">Hiring <strong>not</strong> completed. </span> More work has been added to the task: ${activeHiringTask.workTotal}`);
    } else {
        const iconPath = '/assets/icon/icon_hiring.webp';  // Use an appropriate path

        const taskName = `Hiring Task`;

        const task = new Task(
            taskName,
            hiringTaskFunction,
            undefined,
            10, // Initial work total, adjust as needed
            '', 
            '', 
            '', 
            '', 
            iconPath,
            '',
            'Administration'
        );

        task.staff = [];
        task.workProgress = 0;

        saveTask({
            taskName: task.taskName,
            taskId: task.taskId,
            workTotal: task.workTotal,
            workProgress: task.workProgress,
            iconPath,
            type: task.type,
            staff: task.staff,
        });

        activeTasks.push(task);
        addConsoleMessage(`Hiring task started.`);
    }
}