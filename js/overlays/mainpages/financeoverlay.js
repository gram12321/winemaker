
import { formatNumber } from '/js/utils.js';
import { loadCashFlow, updateIncomeStatement } from '/js/finance.js';

export function showFinanceOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Finance Management</h1>
            
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

            <!-- Income Statement Section -->
            <section id="income-statement">
                <h2>Income Statement</h2>
                <div id="weekly-income-statement">
                    <p>Weekly Income: <span id="weekly-income">0</span></p>
                    <p>Weekly Expenses: <span id="weekly-expenses">0</span></p>
                    <p>Net Income: <span id="net-income">0</span></p>
                </div>
            </section>

            <!-- Balance Sheet Section -->
            <section id="balance-sheet">
                <h2>Balance Sheet</h2>
                <p>Coming Soon</p>
            </section>
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Initialize finance data
    loadCashFlow();
    updateIncomeStatement();
}
