import React, { useState } from 'react';
import { WorkCategory } from '../../lib/game/workCalculator';

export type ActivityOptionType = 'number' | 'select' | 'text' | 'checkbox' | 'range';

export interface ActivityOptionField {
  id: string;
  label: string;
  type: ActivityOptionType;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  tooltip?: string;
  required?: boolean;
}

export interface ActivityWorkEstimate {
  totalWork: number;
  timeEstimate: string;
  costEstimate?: number;
}

interface ActivityOptionsModalProps {
  title: string;
  subtitle?: string;
  category: WorkCategory;
  fields: ActivityOptionField[];
  workEstimate: ActivityWorkEstimate;
  onClose: () => void;
  onSubmit: (options: Record<string, any>) => void;
  submitLabel?: string;
  canSubmit?: (options: Record<string, any>) => boolean;
  warningMessage?: string;
  disabledMessage?: string;
}

export const ActivityOptionsModal: React.FC<ActivityOptionsModalProps> = ({
  title,
  subtitle,
  category,
  fields,
  workEstimate,
  onClose,
  onSubmit,
  submitLabel = 'Start Activity',
  canSubmit,
  warningMessage,
  disabledMessage = 'Cannot start activity with current options'
}) => {
  // Initialize state with default values from fields
  const initialValues = fields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue !== undefined ? field.defaultValue : '';
    return acc;
  }, {} as Record<string, any>);
  
  const [options, setOptions] = useState<Record<string, any>>(initialValues);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  
  const handleChange = (id: string, value: any) => {
    setOptions(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(options);
  };
  
  const isSubmitDisabled = canSubmit ? !canSubmit(options) : false;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      
      {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="relative">
              <div className="flex items-center mb-1">
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.tooltip && (
                  <div className="relative ml-2">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 text-sm"
                      onMouseEnter={() => setTooltipVisible(field.id)}
                      onMouseLeave={() => setTooltipVisible(null)}
                    >
                      ⓘ
                    </button>
                    
                    {tooltipVisible === field.id && (
                      <div className="absolute z-10 w-64 p-2 text-xs bg-gray-800 text-white rounded shadow-lg -bottom-2 left-6">
                        {field.tooltip}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  id={field.id}
                  className="w-full p-2 border rounded"
                  value={options[field.id] as string}
                  onChange={e => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  id={field.id}
                  className="w-full p-2 border rounded"
                  value={options[field.id] as number}
                  onChange={e => handleChange(field.id, parseFloat(e.target.value))}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required={field.required}
                />
              )}
              
              {field.type === 'range' && (
                <div>
                  <input
                    type="range"
                    id={field.id}
                    className="w-full"
                    value={options[field.id] as number}
                    onChange={e => handleChange(field.id, parseFloat(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{field.min}</span>
                    <span>{field.max}</span>
                  </div>
                </div>
              )}
              
              {field.type === 'select' && field.options && (
                <select
                  id={field.id}
                  className="w-full p-2 border rounded"
                  value={options[field.id] as string | number}
                  onChange={e => handleChange(field.id, e.target.value)}
                  required={field.required}
                >
                  {field.options.map(option => (
                    <option key={option.value.toString()} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={field.id}
                    className="mr-2"
                    checked={options[field.id] as boolean}
                    onChange={e => handleChange(field.id, e.target.checked)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Work Estimate Section */}
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-medium mb-2">Work Estimate</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">Total Work Required:</p>
              <p className="font-medium">{workEstimate.totalWork} units</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Estimate:</p>
              <p className="font-medium">{workEstimate.timeEstimate}</p>
            </div>
            {workEstimate.costEstimate !== undefined && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Cost Estimate:</p>
                <p className="font-medium">€{workEstimate.costEstimate.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Warning Message */}
        {warningMessage && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
            {warningMessage}
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className={`px-4 py-2 rounded shadow-sm text-white ${
              isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-wine hover:bg-wine-dark'
            }`}
            disabled={isSubmitDisabled}
            title={isSubmitDisabled ? disabledMessage : ''}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityOptionsModal; 