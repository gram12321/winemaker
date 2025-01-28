import { displayStaff } from '/js/staff.js';
import { showHireStaffOptionsOverlay } from '/js/overlays/hireStaffOptionsOverlay.js';
import { showTeamManagementOverlay } from '/js/overlays/teamManagementOverlay.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { loadStaff, loadTeams, saveTeams } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';


let teams = []; // In-memory storage for teams
let staffMembers = []; // In-memory storage for staff members

export function showStaffOverlay() {
    const overlay = showMainViewOverlay(createStaffOverlayHTML());
    setupStaffOverlayEventListeners(overlay);
}

function createStaffOverlayHTML() {
    staffMembers = loadStaff(); // Load staff members once

    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Staff Management</h2>

            <div class="overlay-sections">
                <section id="staff-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/staff_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Staff">
                    <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, var(--color-accent), #8B4513);">
                        <h3 class="h5 mb-0">Staff Overview</h3>
                        <div class="btn-group">
                            <button class="btn btn-light btn-sm" id="hire-staff-btn">Hire Staff</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="staff-container" class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Nationality</th>
                                        <th>Workforce</th>
                                        <th>Wage (€)</th>
                                        <th>Assigned Tasks</th>
                                        <th class="skills-column">Skills</th>
                                    </tr>
                                </thead>
                                <tbody id="staff-entries">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <section id="team-section" class="overlay-section card mb-4">
                    <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, var(--color-accent), #8B4513);">
                        <h3 class="h5 mb-0">Team Management</h3>
                        <div class="btn-group">
                            <button class="btn btn-light btn-sm" id="manage-team-btn">Team Management</button>
                            <button class="btn btn-light btn-sm" id="create-team-btn">Create Team</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="team-container" class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Team Name</th>
                                        <th>Members</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="team-entries">
                                </tbody>
                            </table>
                        </div>
                        <div id="create-team-form" style="display: none;">
                            <div class="form-group mb-3">
                                <label for="team-name">Team Name:</label>
                                <input type="text" id="team-name" class="form-control" placeholder="Enter team name" required>
                            </div>
                            <div class="form-group mb-3">
                                <label for="team-description">Team Description:</label>
                                <textarea id="team-description" class="form-control" rows="3" placeholder="Enter team description" required></textarea>
                            </div>
                            <div class="form-group mb-3">
                                <label for="team-members">Select Members:</label>
                                <div id="team-members" class="form-control" style="height: auto; max-height: 200px; overflow-y: auto;">
                                    ${staffMembers.map(staff => `
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" value="${staff.id}" id="staff-${staff.id}">
                                            <label class="form-check-label" for="staff-${staff.id}">
                                                ${staff.firstName} ${staff.lastName}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <button class="btn btn-primary" id="save-team-btn">Save Team</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function setupStaffOverlayEventListeners(overlay) {
    displayStaff();

    const hireStaffBtn = overlay.querySelector('#hire-staff-btn');

    
    if (hireStaffBtn) {
        hireStaffBtn.addEventListener('click', () => {
            showHireStaffOptionsOverlay();
        });
    }

    const manageTeamBtn = overlay.querySelector('#manage-team-btn');
    if (manageTeamBtn) {
        manageTeamBtn.addEventListener('click', () => {
            showTeamManagementOverlay();
        });
    }


    const createTeamBtn = overlay.querySelector('#create-team-btn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', () => {
            const form = overlay.querySelector('#create-team-form');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });

        const saveTeamBtn = overlay.querySelector('#save-team-btn');
        if (saveTeamBtn) {
            saveTeamBtn.addEventListener('click', () => {
                const teamName = overlay.querySelector('#team-name').value;
                const teamDescription = overlay.querySelector('#team-description').value;
                const selectedMembers = Array.from(overlay.querySelectorAll('#team-members input:checked'))
                    .map(checkbox => {
                        const staffId = parseInt(checkbox.value);
                        return staffMembers.find(staff => staff.id === staffId);
                    })
                    .filter(staff => staff !== undefined);

                if (!teamName || !teamDescription) {
                    addConsoleMessage('Please fill in all required fields');
                    return;
                }

                const newTeam = {
                    name: teamName,
                    description: teamDescription,
                    flagCode: teamName.toLowerCase().replace(/\s+/g, ''),
                    teamPicture: 'placeholder.webp',
                    members: selectedMembers
                };

                const teams = loadTeams();
                teams.push(newTeam);
                saveTeams(teams);
                
                addConsoleMessage(`Team "${teamName}" has been created`);
                overlay.querySelector('#create-team-form').style.display = 'none';
                displayTeams();
            });
        }
    }
    const saveTeamBtn = overlay.querySelector('#save-team-btn');
    if (saveTeamBtn) {
        saveTeamBtn.addEventListener('click', () => {
            const teamName = overlay.querySelector('#team-name').value;
            if (teams.some(team => team.name === teamName)) {
                addConsoleMessage('A team with this name already exists. Please choose a different name.');
                return;
            }
            const selectedMembers = Array.from(overlay.querySelectorAll('#team-members .form-check-input:checked')).map(input => parseInt(input.value, 10));
            saveTeam(teamName, selectedMembers);
            displayTeams();
            const form = overlay.querySelector('#create-team-form');
            form.style.display = 'none'; // Close the form after saving the team
        });
    }
}

function saveTeam(name, members) {
    const teamData = {
        name: name,
        description: `${name} coordination and management`,
        flagCode: name.toLowerCase().includes('admin') ? 'bookkeeping' :
                 name.toLowerCase().includes('sales') ? 'sales' :
                 name.toLowerCase().includes('winery') ? 'crushing' :
                 name.toLowerCase().includes('vineyard') ? 'harvesting' : 'maintain',
        teamPicture: 'placeholder.webp',
        bonus: `${name} efficiency +10%`,
        members: members
    };

    teams.push(teamData);
    localStorage.setItem('teams', JSON.stringify(teams));
    console.log("Saved teams:", teams);
}

function displayTeams() {
    const teamContainer = document.getElementById('team-entries');
    teamContainer.innerHTML = '';
    teams.forEach(team => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team.name}</td>
            <td>${team.members.map(id => {
                const staff = staffMembers.find(staff => staff.id === id);
                return staff ? staff.name : 'Unknown';
            }).join(', ')}</td>
            <td><button class="btn btn-danger btn-sm delete-team-btn" data-team-name="${team.name}">Delete</button></td>
        `;
        teamContainer.appendChild(row);
    });

    // Add event listeners for delete buttons
    teamContainer.querySelectorAll('.delete-team-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const teamName = event.target.getAttribute('data-team-name');
            deleteTeam(teamName);
        });
    });
}

function deleteTeam(name) {
    teams = teams.filter(team => team.name !== name);
    displayTeams();

}