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
                            <button class="btn btn-light btn-sm" id="create-team-btn">Create Team</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="team-management-grid">
                            <div class="options-container">
                                <!-- Team cards will be dynamically added here -->
                            </div>
                            <div class="options-info-box">
                                <!-- Team details will be shown here -->
                            </div>
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
    setupHireStaffButton(overlay);
    setupTeamSections(overlay);
    setupCreateTeamButton(overlay);
    setupSaveTeamButton(overlay);
    displayTeams();
}

function setupTeamSections(overlay) {
    const teams = loadTeams();
    const teamSection = overlay.querySelector('#team-section');
    const optionsContainer = teamSection.querySelector('.options-container');
    
    optionsContainer.innerHTML = '';
    teams.forEach(team => {
        optionsContainer.innerHTML += `
            <div class="option-card" data-team="${team.name}">
                <div class="option-header">
                    <img src="/assets/icon/icon_${team.flagCode}.webp" 
                         alt="${team.name}" 
                         style="width: 24px; height: 24px;"
                         onerror="this.style.display='none'">
                    <h4>${team.name}</h4>
                </div>
                <div class="option-description">
                    ${team.description}
                </div>
            </div>
        `;
    });

    // Add click handlers for option cards
    optionsContainer.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            optionsContainer.querySelectorAll('.option-card').forEach(c => 
                c.classList.remove('active'));
            card.classList.add('active');
            const teamName = card.dataset.team;
            const selectedTeam = teams.find(t => t.name === teamName);
            if (selectedTeam) {
                updateTeamInfo(selectedTeam);
            }
        });
    });

    // Show first team by default
    if (teams.length > 0) {
        const firstCard = optionsContainer.querySelector('.option-card');
        if (firstCard) {
            firstCard.classList.add('active');
            updateTeamInfo(teams[0]);
        }
    }
}

function updateTeamInfo(team) {
    const infoBox = document.querySelector('.options-info-box');

    infoBox.innerHTML = `
        <div class="info-header">
            <img src="/assets/icon/icon_${team.flagCode}.webp" 
                 alt="${team.name}" 
                 style="width: 24px; height: 24px;"
                 onerror="this.style.display='none'">
            <h4>${team.name} Details</h4>
        </div>
        <div class="info-content">
            <div class="info-row">
                <span class="info-label">Description:</span>
                <span class="info-value">${team.description}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Team Members:</span>
                <div class="info-value">
                    ${Array.isArray(team.members) && team.members.length > 0 
                        ? team.members.map(member => 
                            `<div class="team-member">${member.firstName} ${member.lastName}</div>`
                        ).join('')
                        : '<em>No members assigned</em>'}
                </div>
            </div>
            <button class="btn btn-danger btn-sm delete-team-btn mt-3" data-team="${team.name}">Delete Team</button>
        </div>
    `;

    pictureBox.innerHTML = `
        <img src="/assets/pic/staff_dalle.webp" 
             alt="${team.name} team" 
             class="team-picture">
    `;

    // Setup delete button
    const deleteBtn = infoBox.querySelector('.delete-team-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const teamName = deleteBtn.dataset.team;
            const teams = loadTeams().filter(t => t.name !== teamName);
            saveTeams(teams);
            addConsoleMessage(`Team "${teamName}" has been deleted`);
            setupTeamSections(document.querySelector('.mainview-overlay-content'));
        });
    }


    // Setup delete buttons
    teamContainer.querySelectorAll('.delete-team-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const teamName = e.target.dataset.team;
            const teams = loadTeams().filter(t => t.name !== teamName);
            saveTeams(teams);
            addConsoleMessage(`Team "${teamName}" has been deleted`);
            displayTeams();
        });
    });
}

function setupHireStaffButton(overlay) {
    const hireStaffBtn = overlay.querySelector('#hire-staff-btn');
    if (hireStaffBtn) {
        hireStaffBtn.addEventListener('click', () => {
            showHireStaffOptionsOverlay();
        });
    }
}

function setupTeamManagementButton(overlay) {
    const manageTeamBtn = overlay.querySelector('#manage-team-btn');
    if (manageTeamBtn) {
        manageTeamBtn.addEventListener('click', () => {
            showTeamManagementOverlay();
        });
    }
}

function setupCreateTeamButton(overlay) {
    const createTeamBtn = overlay.querySelector('#create-team-btn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', () => {
            toggleCreateTeamForm(overlay);
        });
    }
}

function toggleCreateTeamForm(overlay) {
    const form = overlay.querySelector('#create-team-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function createNewTeam(overlay) {
    const teamName = overlay.querySelector('#team-name').value;
    const teamDescription = overlay.querySelector('#team-description').value;
    
    if (!teamName || !teamDescription) {
        addConsoleMessage('Please fill in all required fields');
        return null;
    }

    const selectedMembers = Array.from(overlay.querySelectorAll('#team-members input:checked'))
        .map(checkbox => {
            const staffId = parseInt(checkbox.value);
            return staffMembers.find(staff => staff.id === staffId);
        })
        .filter(staff => staff !== undefined);

    return {
        name: teamName,
        description: teamDescription,
        flagCode: teamName.toLowerCase().replace(/\s+/g, ''),
        teamPicture: 'placeholder.webp',
        members: selectedMembers
    };
}

function setupSaveTeamButton(overlay) {
    const saveTeamBtn = overlay.querySelector('#save-team-btn');
    if (saveTeamBtn) {
        saveTeamBtn.addEventListener('click', () => {
            const teamName = overlay.querySelector('#team-name').value;
            
            if (teams.some(team => team.name === teamName)) {
                addConsoleMessage('A team with this name already exists. Please choose a different name.');
                return;
            }

            const newTeam = createNewTeam(overlay);
            if (newTeam) {
                const teams = loadTeams();
                teams.push(newTeam);
                saveTeams(teams);
                
                addConsoleMessage(`Team "${teamName}" has been created`);
                overlay.querySelector('#create-team-form').style.display = 'none';
                displayTeams();
            }
        });
    }
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