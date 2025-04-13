import { useState, useEffect } from 'react';
import { getGameState } from '@/gameState';
import { formatCurrency } from '@/lib/core/utils/formatUtils';
import { calculateFinancialData } from '../../services/financeService';

interface IncomeBalanceViewProps {
  period: 'weekly' | 'season' | 'year';
}

// Helper component for a single financial section
const FinancialSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border border-wine/30 rounded-md p-4 mb-4">
    <h3 className="font-semibold text-wine mb-2 uppercase text-sm tracking-wider">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

// Helper component for a key-value pair
const DataRow: React.FC<{ label: string; value: string | number; valueClass?: string }> = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between text-sm">
    <span>{label}</span>
    <span className={`font-medium ${valueClass}`}>{typeof value === 'number' ? formatCurrency(value) : value}</span>
  </div>
);

export function IncomeBalanceView({ period }: IncomeBalanceViewProps) {
  const gameState = getGameState();
  const [financialData, setFinancialData] = useState({
    income: 0,
    expenses: 0,
    netIncome: 0,
    incomeDetails: [] as { description: string; amount: number }[],
    expenseDetails: [] as { description: string; amount: number }[],
    cashBalance: 0,
    totalAssets: 0,
    fixedAssets: 0,
    currentAssets: 0,
    buildingsValue: 0,
    farmlandValue: 0,
    wineValue: 0,
    grapesValue: 0
  });

  useEffect(() => {
    const data = calculateFinancialData(period);
    setFinancialData(data);
  }, [period, gameState]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Column 1: Income Statement */}
      <div>
        <h2 className="text-xl font-semibold text-wine mb-3 text-center">Income Statement</h2>
        
        <FinancialSection title={`${period.toUpperCase()} EXPENSES`}>
          {financialData.expenseDetails.length > 0 ? (
            financialData.expenseDetails.map((item, index) => (
              <DataRow key={index} label={item.description} value={item.amount} valueClass="text-red-600" />
            ))
          ) : (
            <DataRow label={`Total ${period} Expenses`} value={0} valueClass="text-red-600" />
          )}
        </FinancialSection>

        <FinancialSection title="NET INCOME">
          <DataRow label={`${period.charAt(0).toUpperCase() + period.slice(1)} Income`} value={financialData.income} valueClass="text-emerald-600" />
          <DataRow label={`${period.charAt(0).toUpperCase() + period.slice(1)} Expenses`} value={financialData.expenses} valueClass="text-red-600" />
           <hr className="my-1 border-wine/20" />
           <DataRow label="Net Income" value={financialData.netIncome} valueClass={financialData.netIncome >= 0 ? "text-emerald-600" : "text-red-600"} />
        </FinancialSection>
      </div>

      {/* Column 2: Balance Sheet */}
      <div>
        <h2 className="text-xl font-semibold text-wine mb-3 text-center">Balance Sheet</h2>
        
        <FinancialSection title="TOTAL ASSETS">
          <DataRow label="Cash" value={financialData.cashBalance} />
          <DataRow label="Fixed Assets" value={financialData.fixedAssets} />
          <DataRow label="Current Assets" value={financialData.currentAssets} />
          <hr className="my-1 border-wine/20" />
          <DataRow label="Total Assets" value={financialData.totalAssets} />
        </FinancialSection>

        <FinancialSection title="CASH">
          <DataRow label="Available Cash" value={financialData.cashBalance} />
        </FinancialSection>
        
        <FinancialSection title="FIXED ASSETS">
          <DataRow label="Buildings" value={financialData.buildingsValue} />
          <DataRow label="Farmland" value={financialData.farmlandValue} />
           <hr className="my-1 border-wine/20" />
           <DataRow label="Total Fixed Assets" value={financialData.fixedAssets} />
        </FinancialSection>

        <FinancialSection title="CURRENT ASSETS (WINE)">
          <DataRow label="Wine Inventory" value={financialData.wineValue} />
          <DataRow label="Grape Inventory" value={financialData.grapesValue} />
           <hr className="my-1 border-wine/20" />
           <DataRow label="Total Current Assets" value={financialData.currentAssets} />
        </FinancialSection>
      </div>
    </div>
  );
} 