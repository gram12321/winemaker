
import { formatNumber } from '/js/utils.js';
import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';

export function showFinanceOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content container-fluid p-4">
            <h1 class="text-center mb-4">Finance Management</h1>
            
            <div class="row">
                <!-- Income Statement Section -->
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h2 class="h5 mb-0">Income Statement</h2>
                        </div>
                        <div class="card-body">
                            <div id="weekly-income-statement">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Weekly Income:</span>
                                    <span id="weekly-income" class="text-success">0</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Weekly Expenses:</span>
                                    <span id="weekly-expenses" class="text-danger">0</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between font-weight-bold">
                                    <span>Net Income:</span>
                                    <span id="net-income">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Balance Sheet Preview -->
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h2 class="h5 mb-0">Balance Sheet</h2>
                        </div>
                        <div class="card-body">
                            <p class="text-muted">Coming Soon</p>
                        </div>
                    </div>
                </div>

                <!-- Cash Flow Section -->
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h2 class="h5 mb-0">Cash Flow</h2>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="cash-flow-table" class="table table-bordered table-hover table-sm">
                                    <thead class="thead-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Amount (€)</th>
                                            <th>Balance (€)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Initialize finance data
    loadCashFlow();
    updateIncomeStatement();
}
