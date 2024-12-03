import { saveTask } from '../database/adminFunctions.js'; // Ensure the import path is correct
import { populateStorageTable } from '../resource.js'; // This is assuming you have a similar function
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 


export function selectContainerOverlay(task) {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'overlay';

    overlayContainer.innerHTML = `
        <div class="overlay-content">
            <h2>Select Container for ${task.taskName}</h2>

            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Container</th>
                        <th>Capacity</th>
                        <th>Resource</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="storage-display-body">
                    <!-- Storage resources will be dynamically generated here -->
                </tbody>
            </table>

            <button class="btn btn-success select-btn">Select</button>
            <button class="btn btn-secondary close-btn">Close</button>
        </div>
    `;

    document.body.appendChild(overlayContainer);

    populateStorageTable('storage-display-body', true);

    overlayContainer.querySelector('.select-btn').addEventListener('click', () => {
        const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
        if (selectedRadio) {
            const newStorageValue = selectedRadio.value; 
            // Update the storage in the task object
            task.storage = newStorageValue;

            // Handle the change of storage
            handleGenericTask(
                task.taskName, 
                (task, mode) => {
                    console.log(`Handling generic task: task='${task.taskName}', mode='${mode}'`);
                    return fieldTaskFunction(task, mode, task.taskName, { fieldId: task.fieldId, storage: task.storage });
                },
                { fieldId: task.fieldId, storage: task.storage } 
            );

            // Save the task with the new storage value
            saveTask(task);
            removeOverlay(); 
        } 
    });

    const closeButton = overlayContainer.querySelector('.close-btn');
    closeButton.addEventListener('click', removeOverlay);
    overlayContainer.addEventListener('click', (event) => {
        if (event.target === overlayContainer) removeOverlay();
    });

    function removeOverlay() {
        document.body.removeChild(overlayContainer);
    }
}