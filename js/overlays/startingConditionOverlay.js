import { storeCompanyName } from '../database/adminFunctions.js';
import { getFlagIconHTML } from '../utils.js';

const startingConditions = {
    'France': {
        name: 'France',
        description: 'Start your winery in the beautiful French countryside',
        startingMoney: 1000000,
        flagCode: 'fr',
        familyPicture: 'pierrecamille.webp'
    },
    'Italy': {
        name: 'Italy',
        description: 'Begin your journey in the rolling hills of Italy',
        startingMoney: 5000000,
        flagCode: 'it',
        familyPicture: 'robertobianca.webp'
    },
    'Germany': {
        name: 'Germany',
        description: 'Establish your vineyard in the Rhine Valley',
        startingMoney: 3000000,
        flagCode: 'de',
        familyPicture: 'placeholder.webp' // Need to add actual image
    },
    'Spain': {
        name: 'Spain',
        description: 'Create your bodega in the Spanish wine country',
        startingMoney: 2000000,
        flagCode: 'es',
        familyPicture: 'placeholder.webp' // Need to add actual image
    },
    'United States': {
        name: 'United States',
        description: 'Build your winery in Napa Valley, California',
        startingMoney: 7000000,
        flagCode: 'us',
        familyPicture: 'placeholder.webp' // Need to add actual image
    }
};

function createStartingConditionCard(condition) {
    return `
        <div class="option-card" data-country="${condition.name}">
            <div class="option-header">
                ${getFlagIconHTML(condition.name)}
                <h4>${condition.name}</h4>
            </div>
            <div class="option-description">
                ${condition.description}
            </div>
        </div>
    `;
}

function updateInfoBox(condition) {
    const infoBox = document.querySelector('.options-info-box');
    infoBox.innerHTML = `
        <div class="info-header">
            ${getFlagIconHTML(condition.name)}
            <h4>${condition.name} Details</h4>
        </div>
        <div class="info-content">
            <div class="info-row">
                <span class="info-label">Starting Money:</span>
                <span class="info-value">€${condition.startingMoney.toLocaleString()}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${condition.description}</span>
            </div>
        </div>
    `;
}

function updateFamilyPicture(condition) {
    const pictureBox = document.querySelector('.options-picture');
    pictureBox.innerHTML = `
        
        <img src="assets/storypic/${condition.familyPicture}" 
             alt="${condition.name} family" 
             class="family-image">
    `;
}

export function showStartingConditionOverlay(companyName) {
    const overlay = document.getElementById('startingConditionOverlay');
    const optionsContainer = overlay.querySelector('.options-container');
    const mainContent = document.querySelector('.login-box');

    // Fade out main content
    mainContent.classList.add('fade-out');

    // Clear existing content and remove any existing start button
    optionsContainer.innerHTML = '';
    const existingStartButton = overlay.querySelector('.start-button-container');
    if (existingStartButton) {
        existingStartButton.remove();
    }

    // Add options
    Object.values(startingConditions).forEach(condition => {
        optionsContainer.innerHTML += createStartingConditionCard(condition);
    });

    // Create start button container
    const startButton = document.createElement('div');
    startButton.className = 'start-button-container';
    overlay.querySelector('.card-body').appendChild(startButton);

    // Add click handlers
    optionsContainer.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            optionsContainer.querySelectorAll('.option-card').forEach(c => 
                c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
            // Update info box and family picture
            const country = card.dataset.country;
            updateInfoBox(startingConditions[country]);
            updateFamilyPicture(startingConditions[country]);
            // Update start button text
            startButton.innerHTML = `
                <button class="btn btn-primary confirm-selection" data-country="${country}">
                    Start in ${country}
                </button>
            `;
        });
    });

    // Show first option by default
    const firstOption = Object.values(startingConditions)[0];
    updateInfoBox(firstOption);
    updateFamilyPicture(firstOption);
    optionsContainer.querySelector('.option-card').classList.add('active');
    startButton.innerHTML = `
        <button class="btn btn-primary confirm-selection" data-country="${firstOption.name}">
            Start in ${firstOption.name}
        </button>
    `;

    // Show the overlay with fade effect
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.transition = 'opacity 0.3s ease';
    });

    // Add click handler for closing on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            hideStartingConditionOverlay();
        }
    });
}

function hideStartingConditionOverlay() {
    const overlay = document.getElementById('startingConditionOverlay');
    const mainContent = document.querySelector('.login-box');

    // Fade out overlay
    overlay.style.opacity = '0';
    
    // Remove fade from main content
    mainContent.classList.remove('fade-out');
    
    // Hide overlay after animation
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}
