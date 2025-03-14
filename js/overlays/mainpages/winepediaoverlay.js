import { showMainViewOverlay } from '../overlayUtils.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import tutorialManager from '/js/tutorial.js';
import { allResources } from '/js/resource.js';
import { initializeImporters, calculateImporterRelationship } from '/js/classes/importerClass.js';
import { getColorClass } from '/js/utils.js';

export function showWinepediaOverlay() {
    const overlay = showMainViewOverlay(createWinepediaOverlayHTML());
    setupWinepediaEventListeners(overlay);

    if (tutorialManager.shouldShowTutorial('WINEPEDIA')) {
        tutorialManager.showTutorial('WINEPEDIA');
    }
}

function setupWinepediaEventListeners(overlay) {
    // Add click handlers for grape cards
    const grapeCards = overlay.querySelectorAll('.grape-card');
    grapeCards.forEach(card => {
        card.addEventListener('click', () => {
            const grapeName = card.querySelector('h3').textContent;
            const grapeResource = allResources.find(r => r.name === grapeName);
            if (grapeResource) {
                showResourceInfoOverlay(grapeResource.name);
            }
        });
    });

    // Setup tab navigation
    const tabs = overlay.querySelectorAll('.winepedia-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;

            // Update active tab
            overlay.querySelectorAll('.winepedia-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

                        // Update active content
            overlay.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function createWinepediaOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Winepedia</h2>

            <div class="tabs-container mb-4">
                <div class="tabs">
                    <button class="winepedia-tab active" data-target="grapeVarieties">Grape Varieties</button>
                    <button class="winepedia-tab" data-target="wineRegions">Wine Regions</button>
                    <button class="winepedia-tab" data-target="winemaking">Winemaking</button>
                    <button class="winepedia-tab" data-target="importers">Importers</button>
                </div>
            </div>

            <div class="tab-content active" id="grapeVarieties">
                <div class="grape-varieties-grid">
                    ${createGrapeVarietiesContent()}
                </div>
            </div>

            <div class="tab-content" id="wineRegions">
                <h3>Wine Regions</h3>
                <p>Content coming soon...</p>
            </div>

            <div class="tab-content" id="winemaking">
                <h3>Winemaking Process</h3>
                <p>Content coming soon...</p>
            </div>

            <div class="tab-content" id="importers">
                <div class="importers-grid">
                    ${createImportersContent()}
                </div>
            </div>
        </div>
    `;
}

export function refreshImporterRelationships() {
    // Check if the importers table exists and is visible
    const importersTable = document.getElementById('importers-table');
    if (!importersTable) return;
    
    const importersTab = document.getElementById('importers');
    if (!importersTab || !importersTab.classList.contains('active')) return;
    
    // Get all table rows
    const rows = importersTable.querySelectorAll('tbody tr');
    
    // Update each row's relationship cell directly
    rows.forEach(row => {
        // Only process if we have enough cells
        if (row.cells.length < 6) return;
        
        // Get the market share cell (index 2)
        const marketShareText = row.cells[2].textContent.trim();
        // Parse the market share (removing the % sign)
        const marketShare = parseFloat(marketShareText.replace('%', ''));
        
        if (!isNaN(marketShare)) {
            // Calculate new relationship value directly
            const relationshipValue = calculateImporterRelationship(marketShare);
            
            // Update the relationship cell (index 5)
            const relationshipCell = row.cells[5];
            relationshipCell.innerHTML = formatRelationship(relationshipValue);
        }
    });
}

// Helper function for relationship display, extracted for reuse
function formatRelationship(value) {
    // Normalize relationship to 0-1 range for getColorClass
    const normalizedValue = value ? Math.min(value / 100, 1) : 0;
    const colorClass = getColorClass(normalizedValue);
    
    // Round to one decimal place
    const formattedValue = value ? value.toFixed(1) : '0.0';   
    return `<span class="${colorClass}">${formattedValue}</span>`;
}

function createImportersContent() {
    const importers = initializeImporters();
    let currentSort = { key: null, direction: 'asc' };

    setTimeout(() => {
        // Setup sorting
        const headers = document.querySelectorAll('.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const key = header.dataset.sort;
                if (currentSort.key === key) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.key = key;
                    currentSort.direction = 'asc';
                }
                
                // Update arrows
                headers.forEach(h => h.classList.remove('asc', 'desc'));
                header.classList.add(currentSort.direction);
                
                // Sort table
                const table = document.getElementById('importers-table');
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                const sortedRows = rows.sort((a, b) => {
                    let aVal = a.cells[Array.from(a.parentNode.parentNode.querySelector('thead tr').cells)
                        .findIndex(cell => cell.querySelector(`[data-sort="${key}"]`))].textContent.trim();
                    let bVal = b.cells[Array.from(b.parentNode.parentNode.querySelector('thead tr').cells)
                        .findIndex(cell => cell.querySelector(`[data-sort="${key}"]`))].textContent.trim();
                    
                    // Convert to numbers if possible
                    if (!isNaN(parseFloat(aVal))) {
                        aVal = parseFloat(aVal);
                        bVal = parseFloat(bVal);
                    }
                    
                    return currentSort.direction === 'asc' 
                        ? (aVal > bVal ? 1 : -1)
                        : (aVal < bVal ? 1 : -1);
                });
                
                // Update table
                const tbody = table.querySelector('tbody');
                sortedRows.forEach(row => tbody.appendChild(row));
            });
        });

        const countryFilter = document.getElementById('country-filter');
        if (countryFilter) {
            countryFilter.addEventListener('change', (e) => {
                const selectedCountry = e.target.value;
                const table = document.getElementById('importers-table');
                const rows = table.getElementsByTagName('tr');

                for (let i = 1; i < rows.length; i++) {
                    const countryCell = rows[i].cells[0];
                    const countryName = countryCell.textContent.trim();
                    rows[i].style.display = !selectedCountry || countryName.includes(selectedCountry) ? '' : 'none';
                }
            });
        }
    }, 100);

    const headers = [
        { label: 'Country', key: 'country' },
        { label: 'Name', key: 'name' },  // Added name column
        { label: 'Type', key: 'type' },
        { label: 'Market Share', key: 'marketShare', format: (value) => `${value.toFixed(1)}%` },
        { label: 'Purchasing Power', key: 'purchasingPower', format: (value) => `${(value * 100).toFixed(0)}%` },
        { label: 'Wine Tradition', key: 'wineTradition', format: (value) => `${(value * 100).toFixed(0)}%` },
        { label: 'Relationship', key: 'relationship' }
    ];

    let tableHtml = `
        <div class="data-table-container">
            <div class="filters d-flex gap-2 mb-3">
                <select id="country-filter" class="form-control form-control-sm d-inline-block w-auto">
                    <option value="">All Countries</option>
                    ${[...new Set(importers.map(imp => imp.country))].map(country => 
                        `<option value="${country}">${country}</option>`
                    ).join('')}
                </select>
            </div>
            <table class="data-table" id="importers-table">
                <thead>
                    <tr>
                        ${headers.map((header) => 
                            `<th><span class="sortable" data-sort="${header.key}">${header.label}</span></th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Simple list of importers without grouping
    importers.forEach(importer => {
        const relationshipValue = importer.relationship || 0;
        
        tableHtml += `
            <tr>
                <td><span class="flag-icon flag-icon-${getCountryCode(importer.country)}"></span> ${importer.country}</td>
                <td>${importer.name}</td>
                <td>${importer.type}</td>
                <td>${importer.marketShare.toFixed(1)}%</td>
                <td>${(importer.purchasingPower * 100).toFixed(0)}%</td>
                <td>${(importer.wineTradition * 100).toFixed(0)}%</td>
                <td>${formatRelationship(relationshipValue)}</td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHtml;
}

function getCountryCode(country) {
    const countryCodeMap = {
        'France': 'fr',
        'Germany': 'de',
        'Italy': 'it',
        'Spain': 'es',
        'United States': 'us'
    };
    return countryCodeMap[country] || 'unknown';
}

function getGrapeDescription(grape) {
    const descriptions = {
        'Barbera': 'A versatile grape known for high acidity and moderate tannins, producing medium-bodied wines.',
        'Chardonnay': 'A noble grape variety producing aromatic, medium-bodied wines with moderate acidity.',
        'Pinot Noir': 'A delicate grape creating light-bodied, aromatic wines with high acidity and soft tannins.',
        'Primitivo': 'A robust grape yielding full-bodied, aromatic wines with natural sweetness and high tannins.',
        'Sauvignon Blanc': 'A crisp grape variety producing aromatic, light-bodied wines with high acidity.'
    };
    return descriptions[grape.name] || 'A unique grape variety with distinctive characteristics.';
}

function createGrapeVarietiesContent() {
    return allResources.map(grape => `
        <div class="grape-card">
            <div class="grape-header">
                <img src="/assets/icon/grape/icon_${grape.name.toLowerCase()}.webp" 
                     alt="${grape.name}" 
                     class="grape-icon"
                     onerror="this.src='/assets/pic/grapes.webp'">
                <h3>${grape.name}</h3>
            </div>
            <hr>
            <div class="grape-description">
                <p>${getGrapeDescription(grape)}</p>
            </div>
        </div>
    `).join('');
}
