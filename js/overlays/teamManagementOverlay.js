import { loadTeams } from '../database/adminFunctions.js';

function loadTeamOptions() {
    return loadTeams();
}

function createTeamOptionCard(team) {
    return `
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
}

function updateInfoBox(team) {
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
                <span class="info-label">Team Focus:</span>
                <span class="info-value">${team.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Description:</span>
                <span class="info-value">${team.description}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Team Bonus:</span>
                <span class="info-value">${team.bonus}</span>
            </div>
        </div>
    `;
}

function updateTeamPicture(team) {
    const pictureBox = document.querySelector('.options-picture');
    pictureBox.innerHTML = `
        <img src="/assets/pic/staff_dalle.webp" 
             alt="${team.name} team" 
             class="family-image">
    `;
}

export function showTeamManagementOverlay() {
    const teamOptions = loadTeamOptions();
    const overlay = document.createElement('div');
    overlay.id = 'teamManagementOverlay';
    overlay.className = 'overlay active';

    overlay.innerHTML = `
        <div class="overlay-content" style="max-width: 1200px">
            <h2>Team Management</h2>
            <div class="starting-condition-grid">
                <div class="options-container"></div>
                <div class="options-info-box"></div>
                <div class="options-picture"></div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    const optionsContainer = overlay.querySelector('.options-container');

    // Add options
    teamOptions.forEach(team => {
        optionsContainer.innerHTML += createTeamOptionCard(team);
    });

    // Handle card clicks
    optionsContainer.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            optionsContainer.querySelectorAll('.option-card').forEach(c => 
                c.classList.remove('active'));
            card.classList.add('active');
            const teamName = card.dataset.team;
            const selectedTeam = teamOptions.find(t => t.name === teamName);
            if (selectedTeam) {
                updateInfoBox(selectedTeam);
                updateTeamPicture(selectedTeam);
            }
        });
    });

    // Show first option by default
    if (teamOptions.length > 0) {
        const firstOption = teamOptions[0];
        updateInfoBox(firstOption);
        updateTeamPicture(firstOption);
    }
    optionsContainer.querySelector('.option-card').classList.add('active');

    // Add click handler for closing
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}