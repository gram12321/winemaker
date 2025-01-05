// loadPanel.js
import { loadStaff} from './database/adminFunctions.js';
import { saveStaff, loadBuildings, storeBuildings   } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';
import { Building } from './buildings.js';
import { selectContainerOverlay } from './overlays/selectContainerOverlay.js';

// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

           ;
        });
}



function openStaffOverlay(currentStaff, staffTaskId, updateTaskBoxCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const overlayContent = document.createElement('div');
    overlayContent.className = 'overlay-content';
    const staffData = loadStaff().map(staff => ({
        ...staff,
        isAssigned: currentStaff.includes(staff.id.toString())
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
        </table>
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
            const isAssigned = currentStaff.includes(staffId);

            if (isAssigned) {
                // Remove staff from task
                currentStaff = currentStaff.filter(id => id !== staffId);
                currentTarget.textContent = 'Select'; // Toggle button label
            } else {
                // Add staff to task
                currentStaff.push(staffId);
                currentTarget.textContent = 'Remove'; // Toggle button label
            }

            // Update the task box to reflect changes
            updateTaskBoxCallback(currentStaff);

            // Update the specific task data in localStorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskIndex = tasks.findIndex(task => task.taskId === staffTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].staff = currentStaff;
                saveTask(tasks[taskIndex]);
            }
        });
    });
}

export { initializePanel };
// Function to display farmland table
export function displayFarmlandTable() {
  const farmlandEntries = document.getElementById('farmland-entries');
  const ownedFarmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  
  if (!farmlandEntries) return;
  
  farmlandEntries.innerHTML = '';
  
  ownedFarmlands.forEach(farmland => {
    const row = document.createElement('tr');
    const flagIcon = getFlagIcon(farmland.country);
    
    row.innerHTML = `
      <td><img src="/assets/icon/small/planting.png" alt="Field" style="width: 24px; height: 24px;"></td>
      <td>${farmland.name}</td>
      <td>${flagIcon} ${farmland.country}/${farmland.region}</td>
      <td>${formatNumber(farmland.acres)} acres</td>
      <td>${farmland.plantedResourceName || 'None'}</td>
      <td>
        <button class="btn btn-sm btn-primary plant-btn" data-farmland-id="${farmland.id}">
          Plant
        </button>
      </td>
      <td>
        <button class="btn btn-sm btn-info view-btn" data-farmland-id="${farmland.id}">
          View
        </button>
      </td>
    `;
    
    farmlandEntries.appendChild(row);
  });

  // Add event listeners for buttons
  attachFarmlandButtonListeners();
}

// Function to attach event listeners to farmland buttons
function attachFarmlandButtonListeners() {
  // Plant buttons
  document.querySelectorAll('.plant-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const farmlandId = parseInt(e.target.getAttribute('data-farmland-id'));
      const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
      const farmland = farmlands.find(f => f.id === farmlandId);
      if (farmland) {
        showPlantingOverlay(farmland);
      }
    });
  });

  // View buttons
  document.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const farmlandId = parseInt(e.target.getAttribute('data-farmland-id'));
      const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
      const farmland = farmlands.find(f => f.id === farmlandId);
      if (farmland) {
        showFarmlandOverlay(farmland);
      }
    });
  });
}
