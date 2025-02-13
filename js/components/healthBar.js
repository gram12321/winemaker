import { formatNumber } from '../utils.js';

export function createHealthBar(data) {
    const { currentHealth, newHealth } = data;
    
    return `
        <div class="health-bar-container">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <label>Farmland Health:</label>
                <span class="current-health">${formatNumber(currentHealth * 100)}%</span>
            </div>
            <div class="health-bar">
                <div class="health-bar-base" style="width: ${currentHealth * 100}%"></div>
                <div class="health-bar-current" style="width: ${currentHealth * 100}%"></div>
                <div class="health-bar-improvement"></div>
            </div>
            <div class="text-end mt-1">
                <span class="health-improvement"></span>
            </div>
        </div>
    `;
}

export function updateHealthBar(healthBar, currentHealth, newHealth) {
    if (!healthBar) return;

    const difference = newHealth - currentHealth;
    const currentHealthSpan = healthBar.querySelector('.current-health');
    const currentHealthBar = healthBar.querySelector('.health-bar-current');
    const improvementBar = healthBar.querySelector('.health-bar-improvement');
    const improvementSpan = healthBar.querySelector('.health-improvement');

    if (currentHealthSpan) {
        currentHealthSpan.textContent = `${formatNumber(newHealth * 100)}%`;
    }

    if (currentHealthBar) {
        currentHealthBar.style.width = `${currentHealth * 100}%`;
    }

    if (improvementBar) {
        improvementBar.style.width = `${Math.abs(difference) * 100}%`;
        improvementBar.style.left = difference < 0 ? 
            `${newHealth * 100}%` : 
            `${currentHealth * 100}%`;
        improvementBar.style.backgroundColor = difference >= 0 ? 
            '#28a745' : '#dc3545';
    }

    if (improvementSpan) {
        improvementSpan.textContent = difference !== 0 
            ? `${difference > 0 ? '+' : ''}${formatNumber(difference * 100)}%` 
            : '';
        improvementSpan.style.color = difference >= 0 ? '#28a745' : '#dc3545';
    }
}
