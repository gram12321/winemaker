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
        this.tasks = new Map();
        this.taskIdCounter = 0;
    }

    addProgressiveTask(name, taskType, durationInWeeks, callback, target = null, params = {}, initialCallback = null) {
        const taskId = ++this.taskIdCounter;
        
        // Execute initial state change if provided
        if (initialCallback) {
            initialCallback(target, params);
        }

        const task = new Task(taskId, name, 'progressive', taskType, durationInWeeks, callback, target, params);
        this.tasks.set(taskId, task);
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
    }

    removeTask(taskId) {
        this.tasks.delete(taskId);
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
}

const taskManager = new TaskManager();
export default taskManager;
