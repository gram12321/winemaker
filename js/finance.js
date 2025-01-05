import { formatNumber } from './utils.js';  // Ensure correct path
import { renderCompanyInfo } from './database/loadSidebar.js';

// Function to load cash flow data dynamically into the table
export function loadCashFlow() {
  const cashFlowTableBody = document.getElementById('cash-flow-table').querySelector('tbody');
  cashFlowTableBody.innerHTML = '';  // Clear existing entries
    
  // Retrieve transactions from localStorage
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let runningBalance = 0;
    
  // Compute each transaction's impact on the balance in original order first
  const balanceAfterTransactions = transactions.map(transaction => {
    runningBalance += transaction.amount;  // Directly use the signed amount
    return runningBalance;  // Keep the balance after each transaction
  });
    
  // Iterate over the transactions in reverse order for display
  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];
    const formattedAmount = formatNumber(Math.abs(transaction.amount));
    const amountClass = transaction.amount > 0 ? 'transaction-income' : 'transaction-expense';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>${transaction.description}</td>
      <td class="${amountClass}">€${formattedAmount}</td>
      <td>€${formatNumber(balanceAfterTransactions[i])}</td>
    `;
    cashFlowTableBody.appendChild(row);
  }
}

// Function to update the income statement
export function updateIncomeStatement() {
    // Retrieve transactions from localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const weeklyIncome = transactions.filter(t => t.type === 'Income').reduce((sum, i) => sum + i.amount, 0);
    const weeklyExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, i) => sum + Math.abs(i.amount), 0);
    const netIncome = weeklyIncome - weeklyExpenses;

    document.getElementById('weekly-income').textContent = `€${formatNumber(weeklyIncome)}`;
    document.getElementById('weekly-expenses').textContent = `€${formatNumber(weeklyExpenses)}`;
    document.getElementById('net-income').textContent = `€${formatNumber(netIncome)}`;
}

// Function to add a transaction entry with a specific date format
export function addTransaction(type, description, amount) {
    // Retrieve existing transactions
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Format the custom date based on the game's week, season, and year
    const week = localStorage.getItem('week');
    const season = localStorage.getItem('season');
    const year = localStorage.getItem('year');
    const date = `Week ${week}, ${season}, ${year}`;

    // Add the new transaction
    transactions.push({
        date,
        type,
        description,
        amount,
    });

    // Store the updated transactions back to local storage
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update the player's balance
    const currentMoney = parseInt(localStorage.getItem('money'), 10) || 0;
    const newMoney = currentMoney + amount;
    localStorage.setItem('money', newMoney);

    // Optionally update any related UI directly here
    renderCompanyInfo();
}

// Add a recurring transaction with frequency in weeks
export function addRecurringTransaction(type, description, amount, frequencyInWeeks) {
    let recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
    const currentWeek = parseInt(localStorage.getItem('week'), 10) || 1;
    // Check if the transaction already exists
    const transactionIndex = recurringTransactions.findIndex(transaction =>
        transaction.type === type && transaction.description === description
    );
    if (transactionIndex !== -1) {
        // Update the existing transaction
        recurringTransactions[transactionIndex].amount = amount;
        recurringTransactions[transactionIndex].frequencyInWeeks = frequencyInWeeks;
        recurringTransactions[transactionIndex].nextDueWeek = currentWeek + frequencyInWeeks;
        console.log(`Updated recurring transaction: ${description}`);
    } else {
        // Add the new recurring transaction if it doesn't exist
        recurringTransactions.push({
            type,
            description,
            amount,
            frequencyInWeeks,
            nextDueWeek: currentWeek + frequencyInWeeks
        });
    }
    // Save the transactions back to localStorage
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}


// Function to process recurring transactions
export function processRecurringTransactions(currentWeek) {
    const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];

    recurringTransactions.forEach(transaction => {

        if (currentWeek >= transaction.nextDueWeek) {
            // Record the transaction
            addTransaction(transaction.type, transaction.description, transaction.amount);

            // Schedule the next occurrence
            transaction.nextDueWeek += transaction.frequencyInWeeks;

            // Wrap `nextDueWeek` if it goes beyond week 12
            if (transaction.nextDueWeek > 12) {
                transaction.nextDueWeek -= 12;
            }
        }
    });

    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}

