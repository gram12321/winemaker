import { formatNumber, formatQualityDisplay, getFlagIcon, formatRelationshipDisplay } from '/js/utils.js';
import { loadPendingContracts, rejectContract } from '/js/contracts.js';
import { getCompletedContracts } from '/js/database/adminFunctions.js';
import { showAssignWineOverlay } from '/js/overlays/assignWineOverlay.js';
import { CONTRACT_GENERATION } from '/js/constants/constants.js';

// Global variables to track current sorting state
let currentImporterSort = { key: 'totalValue', direction: 'desc' };
let filteredImporters = [];

export function displayContractsTab() {
    const contractsTabContent = document.getElementById('contracts-tab-content');
    if (!contractsTabContent) {
        console.error("Cannot find contracts-tab-content element");
        return;
    }
    
    contractsTabContent.innerHTML = '';

    // Create pending contracts section
    const pendingContractSection = document.createElement('section');
    pendingContractSection.className = 'overlay-section card mb-4';
    
    const pendingContracts = loadPendingContracts();
    pendingContractSection.innerHTML = `
        <div class="card-header text-white d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">Pending Contracts</h3>
            <div class="contract-info">
                <span class="badge bg-secondary">${pendingContracts.length}/${CONTRACT_GENERATION.MAX_PENDING_CONTRACTS} Active</span>
            </div>
        </div>
        <div class="card-body" id="pending-contracts-body">
            ${pendingContracts.length > 0 ? createContractsTableHTML(pendingContracts, true) : `
                <div class="alert alert-info text-center">
                    <p>No pending contracts available.</p>
                    <p class="small mt-2">Contracts are offered by importers based on your reputation and relationship.</p>
                </div>
            `}
        </div>
    `;

    // Add pending contracts section to the content
    contractsTabContent.appendChild(pendingContractSection);

    // Add event listeners after the content is in the DOM
    if (pendingContracts.length > 0) {
        setupContractEventListeners(pendingContracts);
    }

    // Create and add importer history section
    const historySection = createImporterHistorySection();
    contractsTabContent.appendChild(historySection);
    
    // Initialize sorting and filtering for history section
    setupImporterHistorySortingAndFiltering();
}

function setupContractEventListeners(pendingContracts) {
    // Add fulfill contract button listeners
    document.querySelectorAll('.fulfill-contract-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showAssignWineOverlay(pendingContracts[index], index);
        });
    });

    // Add reject contract button listeners
    document.querySelectorAll('.reject-contract-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (rejectContract(index)) {
                displayContractsTab(); // Refresh the display after rejection
            }
        });
    });
}

function createImporterHistorySection() {
    const historySection = document.createElement('section');
    historySection.className = 'overlay-section card';
    
    const completedContracts = getCompletedContracts();
    const importers = groupContractsByImporter(completedContracts);
    filteredImporters = Array.from(importers.values());
    
    // Apply initial sorting (default by total value descending)
    filteredImporters = sortImporters(filteredImporters, currentImporterSort.key, currentImporterSort.direction);
    
    // Get unique importer names for dropdown
    const importerNames = [...new Set(filteredImporters.map(imp => imp.name))].sort();
    
    historySection.innerHTML = `
        <div class="card-header text-white d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">Importer History <span class="badge bg-secondary ms-2">${completedContracts.length} Total</span></h3>
            <div class="filters d-flex gap-2">
                <select id="importer-name-filter" class="form-control form-control-sm d-inline-block w-auto">
                    <option value="">All Importers</option>
                    ${importerNames.map(name => 
                        `<option value="${name}">${name}</option>`
                    ).join('')}
                </select>
                <select id="importer-type-filter" class="form-control form-control-sm d-inline-block w-auto">
                    <option value="">All Types</option>
                    ${[...new Set(filteredImporters.map(imp => imp.type))].map(type => 
                        `<option value="${type}">${type}</option>`
                    ).join('')}
                </select>
                <select id="importer-country-filter" class="form-control form-control-sm d-inline-block w-auto">
                    <option value="">All Countries</option>
                    ${[...new Set(filteredImporters.map(imp => imp.country))].map(country => 
                        `<option value="${country}">${country}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div class="card-body">
            ${filteredImporters.length > 0 ? `
                <div class="table-responsive" id="importer-history-table-container">
                    ${createImporterHistoryTableHTML(filteredImporters)}
                </div>
            ` : `
                <div class="alert alert-info text-center">
                    <p>No completed contracts yet.</p>
                    <p class="small mt-2">Complete contracts to build relationships with importers.</p>
                </div>
            `}
        </div>
    `;

    // Add click handlers for expanding/collapsing importer details
    historySection.addEventListener('click', (e) => {
        const importerRow = e.target.closest('.importer-row');
        if (importerRow) {
            const importerId = importerRow.dataset.importerId;
            const detailsRow = historySection.querySelector(`.contract-details-row[data-importer-id="${importerId}"]`);
            if (detailsRow) {
                detailsRow.classList.toggle('d-none');
                importerRow.classList.toggle('active');
            }
        }
    });

    return historySection;
}

function setupImporterHistorySortingAndFiltering() {
    // Skip if there are no filtered importers
    if (filteredImporters.length === 0) return;
    
    // Setup sorting
    const sortHeaders = document.querySelectorAll('.importer-sort');
    sortHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            
            // Toggle direction if clicking the same header
            if (currentImporterSort.key === sortKey) {
                currentImporterSort.direction = currentImporterSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentImporterSort.key = sortKey;
                // Default direction based on column type
                currentImporterSort.direction = ['totalValue', 'contractsCount', 'marketShare', 'relationship'].includes(sortKey) ? 'desc' : 'asc';
            }
            
            // Update sort indicators
            sortHeaders.forEach(h => {
                h.classList.remove('asc', 'desc');
                if (h.dataset.sort === currentImporterSort.key) {
                    h.classList.add(currentImporterSort.direction);
                }
            });
            
            // Apply filters and sorting
            applyImporterFiltersAndSort();
        });
    });
    
    // Setup filtering with dropdown for name
    const nameFilter = document.getElementById('importer-name-filter');
    const typeFilter = document.getElementById('importer-type-filter');
    const countryFilter = document.getElementById('importer-country-filter');
    
    if (nameFilter) nameFilter.addEventListener('change', applyImporterFiltersAndSort);
    if (typeFilter) typeFilter.addEventListener('change', applyImporterFiltersAndSort);
    if (countryFilter) countryFilter.addEventListener('change', applyImporterFiltersAndSort);
    
    // Set initial sort indicators
    const initialSortHeader = document.querySelector(`.importer-sort[data-sort="${currentImporterSort.key}"]`);
    if (initialSortHeader) {
        initialSortHeader.classList.add(currentImporterSort.direction);
    }
}

function applyImporterFiltersAndSort() {
    const nameFilter = document.getElementById('importer-name-filter')?.value || '';
    const typeFilter = document.getElementById('importer-type-filter')?.value || '';
    const countryFilter = document.getElementById('importer-country-filter')?.value || '';
    const completedContracts = getCompletedContracts();
    const importers = groupContractsByImporter(completedContracts);
    
    // Apply filters
    filteredImporters = Array.from(importers.values()).filter(importer => {
        // Changed to exact match for dropdown selection
        const nameMatch = !nameFilter || importer.name === nameFilter;
        const typeMatch = !typeFilter || importer.type === typeFilter;
        const countryMatch = !countryFilter || importer.country === countryFilter;
        return nameMatch && typeMatch && countryMatch;
    });
    
    // Apply sorting
    filteredImporters = sortImporters(filteredImporters, currentImporterSort.key, currentImporterSort.direction);
    
    // Update the table
    const tableContainer = document.getElementById('importer-history-table-container');
    if (tableContainer) {
        tableContainer.innerHTML = createImporterHistoryTableHTML(filteredImporters);
    }
    
    // Restore event listeners for expanding rows
    const historySection = document.querySelector('.overlay-section.card:last-child');
    if (historySection) {
        historySection.addEventListener('click', (e) => {
            const importerRow = e.target.closest('.importer-row');
            if (importerRow) {
                const importerId = importerRow.dataset.importerId;
                const detailsRow = historySection.querySelector(`.contract-details-row[data-importer-id="${importerId}"]`);
                if (detailsRow) {
                    detailsRow.classList.toggle('d-none');
                    importerRow.classList.toggle('active');
                }
            }
        });
    }
}

function sortImporters(importers, key, direction) {
    return [...importers].sort((a, b) => {
        let aValue, bValue;
        
        switch (key) {
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'country':
                aValue = a.country;
                bValue = b.country;
                break;
            case 'marketShare':
                aValue = a.marketShare;
                bValue = b.marketShare;
                break;
            case 'relationship':
                aValue = a.relationship;
                bValue = b.relationship;
                break;
            case 'contractsCount':
                aValue = a.contracts.length;
                bValue = b.contracts.length;
                break;
            case 'totalValue':
                aValue = a.contracts.reduce((sum, c) => sum + c.totalValue, 0);
                bValue = b.contracts.reduce((sum, c) => sum + c.totalValue, 0);
                break;
            default:
                aValue = a.name;
                bValue = b.name;
        }
        
        // For string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        // For numeric comparison
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
}

function createContractsTableHTML(contracts, isPending = true) {
    return `
        <table class="table overlay-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Market Share</th>
                    <th>Relationship</th>
                    <th>Requirements</th>
                    <th>Amount</th>
                    <th>Price/Bottle</th>
                    <th>Total Value</th>
                    ${isPending ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${contracts.map((contract, index) => {
                    const relationship = formatRelationshipDisplay(contract.relationship);
                    
                    // Generate requirements text based on contract requirements
                    let requirementsHTML = '';
                    
                    if (!contract.requirements || contract.requirements.length === 0) {
                        requirementsHTML = '<strong>No specific requirements</strong>';
                    } else {
                        // Add safety checks for each requirement
                        requirementsHTML = contract.requirements.map(req => {
                            // Check if getDisplayHTML exists
                            if (req && typeof req.getDisplayHTML === 'function') {
                                return req.getDisplayHTML();
                            } else if (req && req.type) {
                                // Fallback display for requirements without methods
                                if (req.type === 'quality' && req.value) {
                                    return `<strong>Quality (min ${(req.value * 100).toFixed(0)}%)</strong>`;
                                } else if (req.type === 'vintage') {
                                    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : 2023;
                                    const reqYear = gameYear - req.value;
                                    return `<strong>Vintage ${reqYear} or older (${req.value} years)</strong>`;
                                }
                            }
                            return '<strong>Unknown requirement</strong>';
                        }).join('<br>');
                    }
                    
                    return `
                    <tr>
                        <td>${getFlagIcon(contract.importerCountry)}<strong>${contract.importerName || 'Unknown Importer'}</strong></td>
                        <td><span class="badge bg-secondary">${contract.importerType}</span></td>
                        <td>${formatNumber(contract.marketShare, 2)}%</td>
                        <td>${relationship.formattedText}</td>
                        <td>${requirementsHTML}</td>
                        <td>${formatNumber(contract.amount)} bottles</td>
                        <td>€${formatNumber(contract.contractPrice, 0)}</td>
                        <td>€${formatNumber(contract.totalValue, 0)}</td>
                        ${isPending ? `
                            <td>
                                <button class="btn btn-success btn-sm mb-2 w-100 fulfill-contract-btn" data-index="${index}">Select Wine</button>
                                <button class="btn btn-danger btn-sm w-100 reject-contract-btn" data-index="${index}">Reject</button>
                            </td>
                        ` : ''}
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;
}

function createImporterHistoryTableHTML(importers) {
    return `
        <table class="table overlay-table">
            <thead>
                <tr>
                    <th><span class="importer-sort sortable" data-sort="name">Name</span></th>
                    <th><span class="importer-sort sortable" data-sort="type">Type</span></th>
                    <th><span class="importer-sort sortable" data-sort="country">Country</span></th>
                    <th><span class="importer-sort sortable" data-sort="marketShare">Market Share</span></th>
                    <th><span class="importer-sort sortable" data-sort="relationship">Relationship</span></th>
                    <th><span class="importer-sort sortable" data-sort="contractsCount">Completed Contracts</span></th>
                    <th><span class="importer-sort sortable" data-sort="totalValue">Total Value</span></th>
                </tr>
            </thead>
            <tbody>
                ${importers.map(importer => {
                    const relationship = formatRelationshipDisplay(importer.relationship);
                    const totalValue = importer.contracts.reduce((sum, c) => sum + c.totalValue, 0);
                    return `
                        <tr class="importer-row" data-importer-id="${importer.id}">
                            <td>${getFlagIcon(importer.country)}<strong>${importer.name}</strong></td>
                            <td><span class="badge bg-secondary">${importer.type}</span></td>
                            <td>${importer.country}</td>
                            <td>${formatNumber(importer.marketShare, 2)}%</td>
                            <td>${relationship.formattedText}</td>
                            <td>${formatNumber(importer.contracts.length)}</td>
                            <td>€${formatNumber(totalValue, 0)}</td>
                        </tr>
                        ${createContractDetailsRow(importer)}
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function createContractDetailsRow(importer) {
    return `
        <tr class="contract-details-row d-none" data-importer-id="${importer.id}">
            <td colspan="7">
                <div class="contract-details">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Wines Used</th>
                                <th>Amount</th>
                                <th>Price/Bottle</th>
                                <th>Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${importer.contracts.map(contract => `
                                <tr>
                                    <td>${new Date(contract.completedDate).toLocaleDateString()}</td>
                                    <td>
                                        ${contract.usedWines ? 
                                            contract.usedWines.map(wine => 
                                                `<div class="mb-1">[${wine.name}, ${wine.vintage}, ${wine.fieldName}] - ${formatQualityDisplay(wine.quality)} (${wine.amount} bottles)</div>`
                                            ).join('') 
                                            : '<span class="text-muted">No wine details recorded</span>'
                                        }
                                    </td>
                                    <td>${formatNumber(contract.amount)} bottles</td>
                                    <td>€${formatNumber(contract.contractPrice, 0)}</td>
                                    <td>€${formatNumber(contract.totalValue, 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    `;
}

function groupContractsByImporter(contracts) {
    const importers = new Map();
    
    contracts.forEach(contract => {
        const importerId = `${contract.importerName}-${contract.importerType}-${contract.importerCountry}`;
        if (!importers.has(importerId)) {
            importers.set(importerId, {
                id: importerId,
                name: contract.importerName,
                type: contract.importerType,
                country: contract.importerCountry,
                marketShare: contract.marketShare,
                relationship: contract.relationship,
                contracts: []
            });
        }
        importers.get(importerId).contracts.push(contract);
        
        // Sort contracts by date (newest first)
        importers.get(importerId).contracts.sort((a, b) => 
            new Date(b.completedDate) - new Date(a.completedDate)
        );
    });
    
    return importers;
}
