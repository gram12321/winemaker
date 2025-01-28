
import { getFlagIconHTML } from '../utils.js';

const teamOptions = {
    'Administration Team': {
        name: 'Administration Team',
        description: 'Handle company administration and paperwork',
        flagCode: 'bookkeeping',
        teamPicture: 'placeholder.webp',
        bonus: 'Administration efficiency +10%',
        members: []
    },
    'Building & Maintenance Team': {
        name: 'Building & Maintenance Team',
        description: 'Maintain and upgrade facilities',
        flagCode: 'maintain',
        teamPicture: 'placeholder.webp',
        bonus: 'Maintenance efficiency +10%'
    },
    'Sales Team': {
        name: 'Sales Team',
        description: 'Manage your sales force',
        flagCode: 'sales',
        teamPicture: 'placeholder.webp',
        bonus: 'Sales efficiency +10%'
    },
    'Vineyard Team': {
        name: 'Vineyard Team',
        description: 'Coordinate vineyard operations',
        flagCode: 'harvesting',
        teamPicture: 'placeholder.webp',
        bonus: 'Field work efficiency +10%'
    },
    'Winery Team': {
        name: 'Winery Team',
        description: 'Oversee winery processes',
        flagCode: 'crushing',
        teamPicture: 'placeholder.webp',
        bonus: 'Winery efficiency +10%'
    }
};

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
    Object.values(teamOptions).forEach(team => {
        optionsContainer.innerHTML += createTeamOptionCard(team);
    });

    // Handle card clicks
    optionsContainer.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            optionsContainer.querySelectorAll('.option-card').forEach(c => 
                c.classList.remove('active'));
            card.classList.add('active');
            const teamName = card.dataset.team;
            updateInfoBox(teamOptions[teamName]);
            updateTeamPicture(teamOptions[teamName]);
        });
    });

    // Show first option by default
    const firstOption = Object.values(teamOptions)[0];
    updateInfoBox(firstOption);
    updateTeamPicture(firstOption);
    optionsContainer.querySelector('.option-card').classList.add('active');

    // Add click handler for closing
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}
