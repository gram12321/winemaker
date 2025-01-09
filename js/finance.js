
// Import required utilities and functions
import { formatNumber } from './utils.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { saveCompanyInfo } from './database/adminFunctions.js';

/**
 * Loads and renders the cash flow table with transaction history
 */
export function loadCashFlow() {
  const cashFlowTableBody = document.getElementById('cash-flow-table')?.querySelector('tbody');
  if (!cashFlowTableBody) return;

  // Clear existing content
  cashFlowTableBody.innerHTML = '';
  
  // Get transactions from storage
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  
  // Calculate running balance for each transaction
  let runningBalance = 0;
  const balances = transactions.map(transaction => {
    runningBalance += transaction.amount;
    return runningBalance;
  });

  // Render transactions in reverse chronological order
  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>${transaction.description}</td>
      <td class="text-${transaction.amount > 0 ? 'success' : 'danger'}">
        €${formatNumber(Math.abs(transaction.amount))}
      </td>
      <td>€${formatNumber(balances[i])}</td>
    `;
    cashFlowTableBody.appendChild(row);
  }
}

/**
 * Updates the income statement display with current financial data
 */
export function updateIncomeStatement() {
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  
  // Calculate total income and expenses
  const weeklyIncome = transactions.reduce((sum, t) => 
    t.type === 'Income' ? sum + t.amount : sum, 0);
  const weeklyExpenses = transactions.reduce((sum, t) => 
    t.type === 'Expense' ? sum + Math.abs(t.amount) : sum, 0);

  // Update display with Bootstrap classes
  document.getElementById('weekly-income').textContent = `€${formatNumber(weeklyIncome)}`;
  document.getElementById('weekly-expenses').textContent = `€${formatNumber(weeklyExpenses)}`;
  document.getElementById('net-income').textContent = `€${formatNumber(weeklyIncome - weeklyExpenses)}`;
}

/**
 * Adds a new transaction to the system
 * @param {string} type - Transaction type (Income/Expense)
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 */
export function addTransaction(type, description, amount) {
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  const date = `Week ${localStorage.getItem('week')}, ${localStorage.getItem('season')}, ${localStorage.getItem('year')}`;

  // Add new transaction
  transactions.push({ date, type, description, amount });
  localStorage.setItem('transactions', JSON.stringify(transactions));

  // Update company money
  const currentMoney = parseInt(localStorage.getItem('money'), 10) || 0;
  localStorage.setItem('money', currentMoney + amount);

  // Update UI and save
  renderCompanyInfo();
  saveCompanyInfo();
}

/**
 * Processes recurring transactions based on current week
 * @param {number} currentWeek - Current game week
 */
export function processRecurringTransactions(currentWeek) {
  const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];

  recurringTransactions.forEach(transaction => {
    if (currentWeek >= transaction.nextDueWeek) {
      addTransaction(transaction.type, transaction.description, transaction.amount);
      transaction.nextDueWeek += transaction.frequencyInWeeks;
      if (transaction.nextDueWeek > 12) transaction.nextDueWeek -= 12;
    }
  });

  localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}

/**
 * Adds or updates a recurring transaction
 * @param {string} type - Transaction type
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @param {number} frequencyInWeeks - Frequency of recurrence
 */
export function addRecurringTransaction(type, description, amount, frequencyInWeeks) {
  const recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
  const currentWeek = parseInt(localStorage.getItem('week'), 10) || 1;
  const nextDueWeek = currentWeek + frequencyInWeeks;

  // Check if transaction already exists
  const existingIndex = recurringTransactions.findIndex(t => 
    t.type === type && t.description === description);

  if (existingIndex !== -1) {
    recurringTransactions[existingIndex] = { 
      type, description, amount, frequencyInWeeks, nextDueWeek 
    };
  } else {
    recurringTransactions.push({ 
      type, description, amount, frequencyInWeeks, nextDueWeek 
    });
  }

  localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}
