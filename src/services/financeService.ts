import { getGameState, updateGameState, updatePlayerMoney } from '@/gameState';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { db } from '../firebase.config';
import { doc, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { consoleService } from '@/components/layout/Console';

export interface Transaction {
  id: string;
  date: GameDate;
  amount: number; // Positive for income, negative for expense
  description: string;
  category: string;
  recurring: boolean;
  balance: number; // Balance after transaction
}

interface FinancialData {
  income: number;
  expenses: number;
  netIncome: number;
  incomeDetails: { description: string; amount: number }[];
  expenseDetails: { description: string; amount: number }[];
  cashBalance: number;
  totalAssets: number;
  fixedAssets: number;
  currentAssets: number;
  buildingsValue: number;
  farmlandValue: number;
  wineValue: number;
  grapesValue: number;
}

// In-memory cache of transactions for performance
let transactionsCache: Transaction[] = [];

/**
 * Add a new transaction to the system
 * @param transaction Transaction data to add
 * @returns Promise resolving to the transaction ID
 */
export const addTransaction = async (
  amount: number,
  description: string,
  category: string,
  recurring = false
): Promise<string> => {
  const gameState = getGameState();
  
  if (!gameState.player) {
    throw new Error('No player found. Cannot add transaction.');
  }
  
  const companyName = gameState.player.companyName;
  
  try {
    // Calculate new balance
    const newBalance = gameState.player.money + amount;
    
    // Create transaction object
    const transaction: Omit<Transaction, 'id'> = {
      date: {
        week: gameState.week,
        season: gameState.season,
        year: gameState.currentYear
      },
      amount,
      description,
      category,
      recurring,
      balance: newBalance
    };
    
    // Update player money
    updatePlayerMoney(amount);
    
    // Add to Firestore
    const transactionsRef = collection(db, 'companies', companyName, 'transactions');
    const docRef = await addDoc(transactionsRef, transaction);
    
    // Update cache with the new transaction
    const newTransaction: Transaction = {
      id: docRef.id,
      ...transaction
    };
    
    transactionsCache.push(newTransaction);
    
    // Sort the cache by date (newest first)
    transactionsCache.sort((a, b) => {
      if (a.date.year !== b.date.year) return b.date.year - a.date.year;
      if (a.date.season !== b.date.season) {
        const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        return seasons.indexOf(b.date.season) - seasons.indexOf(a.date.season);
      }
      return b.date.week - a.date.week;
    });
    
    // Log the transaction
    if (amount >= 0) {
      consoleService.info(`Income received: ${description} (${amount})`);
    } else {
      consoleService.info(`Expense paid: ${description} (${Math.abs(amount)})`);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    consoleService.error(`Failed to record transaction: ${description}`);
    throw error;
  }
};

/**
 * Load transactions from Firestore
 * @returns Promise resolving to array of transactions
 */
export const loadTransactions = async (): Promise<Transaction[]> => {
  const gameState = getGameState();
  
  if (!gameState.player) {
    return [];
  }
  
  const companyName = gameState.player.companyName;
  
  try {
    const transactionsRef = collection(db, 'companies', companyName, 'transactions');
    // Simplify query to avoid needing a composite index
    // Instead of ordering by multiple date fields, just get all transactions
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data() as Omit<Transaction, 'id'>;
      transactions.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort transactions in memory instead of using Firestore ordering
    transactions.sort((a, b) => {
      // Sort by year (descending)
      if (a.date.year !== b.date.year) return b.date.year - a.date.year;
      
      // Sort by season (descending)
      const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
      const aSeasonIndex = seasons.indexOf(a.date.season);
      const bSeasonIndex = seasons.indexOf(b.date.season);
      if (aSeasonIndex !== bSeasonIndex) return bSeasonIndex - aSeasonIndex;
      
      // Sort by week (descending)
      return b.date.week - a.date.week;
    });
    
    // Update the cache
    transactionsCache = transactions;
    
    return transactions;
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

/**
 * Get transactions from cache or load from Firestore if cache is empty
 * @returns Array of transactions
 */
export const getTransactions = (): Transaction[] => {
  // If cache is empty, load transactions from Firestore (but return empty array for now)
  if (transactionsCache.length === 0) {
    loadTransactions().catch(console.error);
    return [];
  }
  
  return transactionsCache;
};

/**
 * Calculate financial data for income statement and balance sheet
 * @param period The time period to calculate for ('weekly', 'season', 'year')
 * @returns Financial data object
 */
export const calculateFinancialData = (period: 'weekly' | 'season' | 'year'): FinancialData => {
  const gameState = getGameState();
  const transactions = getTransactions();
  
  // Filter transactions by period
  const filteredTransactions = transactions.filter(transaction => {
    const currentDate = {
      week: gameState.week,
      season: gameState.season,
      year: gameState.currentYear
    };
    
    if (period === 'weekly') {
      return transaction.date.week === currentDate.week &&
             transaction.date.season === currentDate.season &&
             transaction.date.year === currentDate.year;
    } else if (period === 'season') {
      return transaction.date.season === currentDate.season &&
             transaction.date.year === currentDate.year;
    } else { // year
      return transaction.date.year === currentDate.year;
    }
  });
  
  // Calculate income and expenses
  let income = 0;
  let expenses = 0;
  const incomeDetails: { description: string; amount: number }[] = [];
  const expenseDetails: { description: string; amount: number }[] = [];
  
  // Group by category
  const categorizedTransactions: Record<string, { total: number; transactions: Transaction[] }> = {};
  
  filteredTransactions.forEach(transaction => {
    if (!categorizedTransactions[transaction.category]) {
      categorizedTransactions[transaction.category] = { total: 0, transactions: [] };
    }
    
    categorizedTransactions[transaction.category].total += transaction.amount;
    categorizedTransactions[transaction.category].transactions.push(transaction);
    
    if (transaction.amount >= 0) {
      income += transaction.amount;
    } else {
      expenses += Math.abs(transaction.amount);
    }
  });
  
  // Create income and expense details
  Object.entries(categorizedTransactions).forEach(([category, data]) => {
    if (data.total >= 0) {
      incomeDetails.push({
        description: category,
        amount: data.total
      });
    } else {
      expenseDetails.push({
        description: category,
        amount: Math.abs(data.total)
      });
    }
  });
  
  // Sort details by amount (highest first)
  incomeDetails.sort((a, b) => b.amount - a.amount);
  expenseDetails.sort((a, b) => b.amount - a.amount);
  
  // Calculate asset values
  const buildingsValue = gameState.buildings.reduce((sum, building) => {
    // Basic estimate for building value
    const baseValue = building.type === 'winery' ? 50000 : 
                      building.type === 'storage' ? 30000 :
                      building.type === 'cellar' ? 40000 : 20000;
    return sum + (baseValue * building.level);
  }, 0);
  
  const farmlandValue = gameState.vineyards.reduce((sum, vineyard) => {
    return sum + (vineyard.landValue || 10000);
  }, 0);
  
  const wineValue = gameState.wineBatches.reduce((sum, batch) => {
    // Estimate wine value based on stage, quality, and quantity
    const stageMultiplier = batch.stage === 'bottled' ? 5 :
                            batch.stage === 'aging' ? 3 :
                            batch.stage === 'fermentation' ? 2 : 1;
    const qualityMultiplier = batch.quality || 0.5;
    
    return sum + (batch.quantity * stageMultiplier * qualityMultiplier * 10);
  }, 0);
  
  const grapesValue = gameState.wineBatches.reduce((sum, batch) => {
    // Only count batches in grape stage
    if (batch.stage !== 'grape') return sum;
    
    const qualityMultiplier = batch.quality || 0.5;
    return sum + (batch.quantity * qualityMultiplier * 5);
  }, 0);
  
  // Calculate totals
  const cashBalance = gameState.player?.money || 0;
  const fixedAssets = buildingsValue + farmlandValue;
  const currentAssets = wineValue + grapesValue;
  const totalAssets = cashBalance + fixedAssets + currentAssets;
  
  return {
    income,
    expenses,
    netIncome: income - expenses,
    incomeDetails,
    expenseDetails,
    cashBalance,
    totalAssets,
    fixedAssets,
    currentAssets,
    buildingsValue,
    farmlandValue,
    wineValue,
    grapesValue
  };
}; 