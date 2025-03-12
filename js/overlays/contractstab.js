import { formatNumber, formatQualityDisplay, getFlagIcon, formatRelationshipDisplay } from '/js/utils.js';
import { loadPendingContracts, rejectContract } from '/js/contracts.js';
import { getCompletedContracts } from '/js/database/adminFunctions.js';
import { showAssignWineOverlay } from '/js/overlays/assignWineOverlay.js';

export function displayContractsTab() {
    const contractsTabContent = document.getElementById('contracts-tab-content');
    contractsTabContent.innerHTML = '';

    // Create pending contracts section
    const pendingContractSection = document.createElement('section');
    pendingContractSection.className = 'overlay-section card mb-4';
    
    const pendingContracts = loadPendingContracts();
    pendingContractSection.innerHTML = `
        <div class="card-header text-white d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">Pending Contracts</h3>
            <div class="contract-info">
                <span class="badge bg-secondary">${pendingContracts.length}/3 Active</span>
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
    
    historySection.innerHTML = `
        <div class="card-header text-white d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">Importer History</h3>
            <div class="contract-info">
                <span class="badge bg-secondary">${completedContracts.length} Completed</span>
            </div>
        </div>
        <div class="card-body">
            ${Array.from(importers.values()).length > 0 ? createImporterHistoryTableHTML(importers) : `
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
            detailsRow.classList.toggle('d-none');
            importerRow.classList.toggle('active');
        }
    });

    return historySection;
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
                    return `
                    <tr>
                        <td>${getFlagIcon(contract.importerCountry)}<strong>${contract.importerName || 'Unknown Importer'}</strong></td>
                        <td><span class="badge bg-secondary">${contract.importerType}</span></td>
                        <td>${formatNumber(contract.marketShare, 1)}%</td>
                        <td>${relationship.formattedText}</td>
                        <td><strong>Quality wine (min ${formatNumber(contract.minQuality * 100)}%)</strong></td>
                        <td>${formatNumber(contract.amount)} bottles</td>
                        <td>€${formatNumber(contract.contractPrice, 2)}</td>
                        <td>€${formatNumber(contract.totalValue, 2)}</td>
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
        <div class="table-responsive">
            <table class="table overlay-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Market Share</th>
                        <th>Relationship</th>
                        <th>Completed Contracts</th>
                        <th>Total Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(importers.values()).map(importer => {
                        const relationship = formatRelationshipDisplay(importer.relationship);
                        return `
                            <tr class="importer-row" data-importer-id="${importer.id}">
                                <td>${getFlagIcon(importer.country)}<strong>${importer.name}</strong></td>
                                <td><span class="badge bg-secondary">${importer.type}</span></td>
                                <td>${formatNumber(importer.marketShare, 1)}%</td>
                                <td>${relationship.formattedText}</td>
                                <td>${formatNumber(importer.contracts.length)}</td>
                                <td>€${formatNumber(importer.contracts.reduce((sum, c) => sum + c.totalValue, 0), 2)}</td>
                            </tr>
                            ${createContractDetailsRow(importer)}
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function createContractDetailsRow(importer) {
    return `
        <tr class="contract-details-row d-none" data-importer-id="${importer.id}">
            <td colspan="6">
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
                                    <td>€${formatNumber(contract.contractPrice, 2)}</td>
                                    <td>€${formatNumber(contract.totalValue, 2)}</td>
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
