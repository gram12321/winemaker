import { formatNumber } from './utils.js';
import { renderCompanyInfo } from './company.js';
import { getTransactions, getMoney, getGameState, loadBuildings, getFarmlands, storeTransactions, updateMoney, getRecurringTransactions, updateRecurringTransactions } from './database/adminFunctions.js';
import { Building } from './classes/buildingClasses.js'
import { inventoryInstance } from './resource.js';
import { calculateWinePrice } from './sales.js';
import { saveCompanyInfo } from './database/initiation.js';

/**
 * Loads and renders the cash flow table with transaction history
 */
export function loadCashFlow() {
  const cashFlowTableBody = document.getElementById('cash-flow-table')?.querySelector('tbody');
  if (!cashFlowTableBody) return;

  // Clear existing content
  cashFlowTableBody.innerHTML = '';
  
  // Get transactions from storage
  const transactions = getTransactions();
  
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
export function updateIncomeStatement(period = 'weekly') {
  const transactions = getTransactions();
  const { week, season, year } = getGameState();

  // Filter transactions based on selected period
  const periodTransactions = filterTransactionsByPeriod(transactions, period, { week, season, year });
  
  // Calculate income and expenses for the period
  const periodIncome = periodTransactions.reduce((sum, t) => 
      t.type === 'Income' ? sum + t.amount : sum, 0);
  const periodExpenses = periodTransactions.reduce((sum, t) => 
      t.type === 'Expense' ? sum + Math.abs(t.amount) : sum, 0);

  // Update period labels based on selected time period - Add null checks
  const periodLabel = getPeriodLabel(period);
  const incomeLabel = document.querySelector('.stat-card:nth-child(1) .stat-label');
  const expenseLabel = document.querySelector('.stat-card:nth-child(2) .stat-label');
  
  if (incomeLabel) incomeLabel.textContent = `${periodLabel} Income`;
  if (expenseLabel) expenseLabel.textContent = `${periodLabel} Expenses`;

  // Update values - Add null checks for all DOM updates
  const elements = {
      weeklyIncome: document.getElementById('weekly-income'),
      weeklyExpenses: document.getElementById('weekly-expenses'),
      netIncome: document.getElementById('net-income'),
      netIncomeWeekly: document.getElementById('net-income-weekly'),
      netIncomeExpenses: document.getElementById('net-income-expenses')
  };

  // Safe update helper
  const safeUpdateElement = (element, value) => {
      if (element) element.textContent = `€${formatNumber(value)}`;
  };

  // Update all values safely
  safeUpdateElement(elements.weeklyIncome, periodIncome);
  safeUpdateElement(elements.weeklyExpenses, periodExpenses);
  safeUpdateElement(elements.netIncome, periodIncome - periodExpenses);
  safeUpdateElement(elements.netIncomeWeekly, periodIncome);
  safeUpdateElement(elements.netIncomeExpenses, periodExpenses);

  // Update balance sheet
  const currentMoney = getMoney();
  const buildings = loadBuildings();
  const ownedFarmlands = getFarmlands();
  
  // Calculate fixed assets (buildings + farmland)
  const buildingValue = buildings.reduce((sum, building) => {
    const buildingInstance = new Building(building.name, building.level);
    let totalValue = buildingInstance.baseCost;
    
    // Add upgrade costs for each level
    for(let i = 1; i < building.level; i++) {
      buildingInstance.level = i;
      totalValue += buildingInstance.getUpgradeCost();
    }
    
    // Add value of tools in the building
    if (building.tools && Array.isArray(building.tools)) {
      // Sum up each individual tool's cost, even if same type
      totalValue += building.tools.reduce((toolSum, tool) => toolSum + tool.cost, 0);
    }
    
    return sum + totalValue;
  }, 0);
  
  const farmlandValue = ownedFarmlands.reduce((sum, f) => sum + ((f.landvalue || 0) * f.acres), 0);
  const fixedAssets = buildingValue + farmlandValue;
  
  // Update balance sheet display
  // Calculate wine inventory value - Fix the calculation
  const wineInventoryValue = inventoryInstance.items
    .filter(item => item.state === 'Bottles' || item.state === 'Grapes') // Include both bottles and grapes
    .reduce((sum, item) => {
        // Get the farmland data safely
        const farmland = ownedFarmlands.find(f => f.name === item.fieldName);
        
        let value = 0;
        // Pass the item itself as second parameter to calculateWinePrice
        const basePrice = calculateWinePrice(item.quality, item);
        
        if (item.state === 'Bottles') {
            value = basePrice * item.amount;
        } else if (item.state === 'Grapes') {
            // Value grapes at a fraction of potential wine value (considering processing costs and risks)
            value = (basePrice * 0.25) * item.amount;
        }
        return sum + value;
    }, 0);

  document.getElementById('cash-balance').textContent = `€${formatNumber(currentMoney)}`;
  document.getElementById('fixed-assets').textContent = `€${formatNumber(fixedAssets)}`;
  document.getElementById('current-assets').textContent = `€${formatNumber(wineInventoryValue)}`;
  document.getElementById('total-assets').textContent = `€${formatNumber(currentMoney + fixedAssets + wineInventoryValue)}`;

  // Update Total Assets details
  document.getElementById('total-assets-cash').textContent = `€${formatNumber(currentMoney)}`;
  document.getElementById('total-assets-fixed').textContent = `€${formatNumber(fixedAssets)}`;
  document.getElementById('total-assets-current').textContent = `€${formatNumber(wineInventoryValue)}`;
  
  // Update Cash details
  document.getElementById('cash-available').textContent = `€${formatNumber(currentMoney)}`;

  // Update detailed breakdowns
  const buildingsValue = buildingValue;
  const farmlandsValue = farmlandValue;
  document.getElementById('buildings-value').textContent = `€${formatNumber(buildingsValue)}`;
  document.getElementById('farmland-value').textContent = `€${formatNumber(farmlandsValue)}`;

  const bottlesValue = calculateWineValueByType('Bottles', wineInventoryValue);
  const grapesValue = calculateWineValueByType('Grapes', wineInventoryValue);
  document.getElementById('bottles-value').textContent = `€${formatNumber(bottlesValue)}`;
  document.getElementById('grapes-value').textContent = `€${formatNumber(grapesValue)}`;

  // Update transaction details for the selected period
  updateTransactionDetails(periodTransactions);
}

function filterTransactionsByPeriod(transactions, period, currentDate) {
  const { week, season, year } = currentDate;

  switch (period) {
      case 'weekly':
          return transactions.filter(t => 
              t.date === `Week ${week}, ${season}, ${year}`
          );
      
      case 'season':
          return transactions.filter(t => 
              t.date.includes(`${season}, ${year}`)
          );
      
      case 'year':
          return transactions.filter(t => 
              t.date.includes(`${year}`)
          );
      
      default:
          return transactions;
  }
}

function getPeriodLabel(period) {
  switch (period) {
      case 'weekly':
          return 'Weekly';
      case 'season':
          return 'Seasonal';
      case 'year':
          return 'Annual';
      default:
          return 'Weekly';
  }
}

function updateTransactionDetails(transactions) {
  const incomeDetails = document.getElementById('weeklyIncomeDetails');
  const expenseDetails = document.getElementById('weeklyExpensesDetails');
  
  const incomeTransactions = transactions.filter(t => t.type === 'Income');
  const expenseTransactions = transactions.filter(t => t.type === 'Expense');

  incomeDetails.innerHTML = createTransactionList(incomeTransactions);
  expenseDetails.innerHTML = createTransactionList(expenseTransactions);
}

function createTransactionList(transactions) {
    return transactions.map(t => `
        <div>
            <span>${t.description}</span>
            <span class="${t.type === 'Income' ? 'transaction-income' : 'transaction-expense'}">
                €${formatNumber(Math.abs(t.amount))}
            </span>
        </div>
    `).join('');
}

function calculateWineValueByType(type, totalValue) {
  return inventoryInstance.items
      .filter(item => item.state === type)
      .reduce((sum, item) => {
          const basePrice = calculateWinePrice(item.quality, item);
          return sum + (type === 'Bottles' ? basePrice * item.amount : basePrice * 0.25 * item.amount);
      }, 0);
}

export function addTransaction(type, description, amount) {
  const transactions = getTransactions();
  const { week, season, year } = getGameState();
  const date = `Week ${week}, ${season}, ${year}`;

  // Add new transaction
  transactions.push({ date, type, description, amount });
  storeTransactions(transactions);
  updateMoney(amount);

  // Update UI and save
  renderCompanyInfo();
  saveCompanyInfo();
}


export function processRecurringTransactions(currentWeek) {
  const recurringTransactions = getRecurringTransactions();

  recurringTransactions.forEach(transaction => {
    if (currentWeek >= transaction.nextDueWeek) {
      addTransaction(transaction.type, transaction.description, transaction.amount);
      transaction.nextDueWeek += transaction.frequencyInWeeks;
      if (transaction.nextDueWeek > 12) transaction.nextDueWeek -= 12;
    }
  });

  updateRecurringTransactions(recurringTransactions);
}


export function addRecurringTransaction(type, description, amount, frequencyInWeeks) {
  const recurringTransactions = getRecurringTransactions();
  const { week } = getGameState();
  const nextDueWeek = week + frequencyInWeeks;

  // Check if transaction already exists
  const existingIndex = recurringTransactions.findIndex(t =>     t.type === type && t.description === description);  if (existingIndex !== -1) {    recurringTransactions[existingIndex] = {       type, description, amount, frequencyInWeeks, nextDueWeek     };  } else {    recurringTransactions.push({       type, description, amount, frequencyInWeeks, nextDueWeek     });  }  updateRecurringTransactions(recurringTransactions);}