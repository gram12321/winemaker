import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/core/utils/formatUtils';
import { getTransactions, Transaction } from '../../services/financeService';
import { formatGameDate } from '@/lib/core/constants/gameConstants';

export function CashFlowView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load transactions when component mounts or game state changes
    const loadedTransactions = getTransactions();
    setTransactions(loadedTransactions);
  }, [getTransactions]); // Re-run effect if getTransactions changes (or gameState)

  return (
    <div>
      <h2 className="text-xl font-semibold text-wine mb-3">Cash Flow Statement</h2>
      
      {transactions.length > 0 ? (
        <div className="border border-wine/30 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-wine-light/10">
              <TableRow>
                <TableHead className="text-wine">Date</TableHead>
                <TableHead className="text-wine">Type</TableHead>
                <TableHead className="text-wine">Description</TableHead>
                <TableHead className="text-right text-wine">Amount (€)</TableHead>
                <TableHead className="text-right text-wine">Balance (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index} className="hover:bg-wine-light/5">
                  <TableCell className="text-sm">{formatGameDate(transaction.date)}</TableCell>
                  <TableCell>
                    <span className={`text-sm ${transaction.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {transaction.amount >= 0 ? "Income" : "Expense"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{transaction.description}</TableCell>
                  <TableCell className={`text-sm text-right ${transaction.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 border border-wine/30 rounded-md">
          No transactions found. Your cash flow history will appear here.
        </div>
      )}
    </div>
  );
} 