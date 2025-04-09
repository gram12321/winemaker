import React from 'react';
import { formatNumber } from '@/lib/core/utils/formatUtils';

export interface WorkFactor {
  label: string;
  value: string | number;
  unit?: string;
  modifier?: number;      // e.g., 0.15 or -0.12
  modifierLabel?: string; // e.g., "skill level effect", "altitude effect"
  isPrimary?: boolean;    // Optional flag for primary rows like Amount/Task
}

interface WorkCalculationTableProps {
  factors: WorkFactor[];
  totalWork: number;
}

export const WorkCalculationTable: React.FC<WorkCalculationTableProps> = ({ factors, totalWork }) => {
  const renderModifier = (modifier: number, label?: string) => {
    if (modifier === 0) return null;
    const sign = modifier > 0 ? '+' : '';
    const percentage = formatNumber(modifier * 100, 0); // Format as integer percentage
    return (
      <small className="block text-muted text-xs">
        {sign}{percentage}% work modifier {label ? `(${label})` : ''}
      </small>
    );
  };

  return (
    <div className="work-calculation-table text-sm">
      {factors.map((factor, index) => (
        <div 
          key={index} 
          className={`flex justify-between py-1 ${factor.isPrimary ? 'font-medium' : 'text-gray-700'} border-b border-gray-100 last:border-b-0`}
        >
          <span className="w-2/5 pr-2">{factor.label}:</span>
          <span className="w-3/5 text-right">
            {typeof factor.value === 'number' ? formatNumber(factor.value, 2) : factor.value}
            {factor.unit && ` ${factor.unit}`}
            {factor.modifier !== undefined && renderModifier(factor.modifier, factor.modifierLabel)}
          </span>
        </div>
      ))}
      {/* Total Work Row */}
      <div className="flex justify-between py-1 font-bold text-base mt-2 border-t pt-2">
        <span className="w-2/5 pr-2">Total Work:</span>
        <span className="w-3/5 text-right">
          {formatNumber(totalWork, 0)} units
        </span>
      </div>
    </div>
  );
};

export default WorkCalculationTable; 