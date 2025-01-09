
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
        <div class="mainview-overlay-content">
            <h1>Finance Management</h1>
            
            <!-- Income Statement Section -->
            <section id="income-statement">
                <h2>Income Statement</h2>
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
            </section>

            <!-- Balance Sheet Section -->
            <section id="balance-sheet">
                <h2>Balance Sheet</h2>
                <p>Coming Soon</p>
            </section>

            <!-- Cash Flow Section -->
            <section id="cash-flow">
                <h2>Cash Flow</h2>
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
            </section>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Initialize finance data
    loadCashFlow();
    updateIncomeStatement();
}
