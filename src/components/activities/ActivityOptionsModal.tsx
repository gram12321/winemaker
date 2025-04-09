import React from 'react';
import { WorkCategory } from '../../lib/game/workCalculator';

export type ActivityOptionType = 'number' | 'select' | 'text' | 'checkbox' | 'range' | 'checkbox-group';

export interface ActivityOptionField {
  id: string;
  label: string;
  type: ActivityOptionType;
  defaultValue?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  tooltip?: string;
  required?: boolean;
  checkboxOptions?: { value: string; label: string; description?: string }[];
}

export interface ActivityWorkEstimate {
  totalWork: number;
  timeEstimate: string;
  costEstimate?: number;
}

interface ActivityOptionsModalProps {
  title: string;
  subtitle?: string;
  category: WorkCategory | string;
  fields: ActivityOptionField[];
  workEstimate: ActivityWorkEstimate;
  onClose: () => void;
  onSubmit: (options: Record<string, any>) => void;
  submitLabel?: string;
  canSubmit?: (options: Record<string, any>) => boolean;
  warningMessage?: string;
  disabledMessage?: string;
  options: Record<string, any>;
  onOptionsChange: (options: Record<string, any>) => void;
}

/**
 * Activity Options Modal Component
 * Displays options for starting or configuring an activity
 * Generic enough to work with any activity category
 */
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
  disabledMessage = 'Cannot start activity with current options',
  options,
  onOptionsChange
}) => {
  const handleChange = (id: string, value: any, type: ActivityOptionType = 'text') => {
    let newStateValue;
    if (type === 'checkbox-group') {
      const currentArray = (options[id] || []) as string[];
      const checked = value.checked;
      const itemValue = value.itemValue;
      if (checked) {
        newStateValue = [...currentArray, itemValue];
      } else {
        newStateValue = currentArray.filter(v => v !== itemValue);
      }
    } else {
      newStateValue = value;
    }
    onOptionsChange({ ...options, [id]: newStateValue });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Make sure options are formatted correctly before submission
    const formattedOptions = formatOptionsForSubmission(options);
    
    // Add the category as a field in the options for reference
    formattedOptions.category = category;
    
    onSubmit(formattedOptions);
  };
  
  // Format options for submission, ensuring proper types and removing invalid/empty values
  const formatOptionsForSubmission = (rawOptions: Record<string, any>): Record<string, any> => {
    const formatted: Record<string, any> = {};
    
    // Process each field based on its type and requirements
    fields.forEach(field => {
      const value = rawOptions[field.id];
      
      // Skip undefined or null values
      if (value === undefined || value === null) return;
      
      // Handle different field types
      switch (field.type) {
        case 'number':
        case 'range':
          // Ensure numbers are properly parsed
          formatted[field.id] = parseFloat(value);
          break;
        case 'checkbox':
          // Ensure booleans are proper booleans
          formatted[field.id] = Boolean(value);
          break;
        default:
          // For text and select, just use the value directly
          formatted[field.id] = value;
      }
    });
    
    return formatted;
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
        {/* Revert to single-column layout */}
        <div className="space-y-4 mb-6">
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
                    >
                      ⓘ
                    </button>
                  </div>
                )}
              </div>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  id={field.id}
                  className="w-full p-2 border rounded"
                  value={options[field.id] as string}
                  onChange={e => handleChange(field.id, e.target.value, 'text')}
                  required={field.required}
                />
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  id={field.id}
                  className="w-full p-2 border rounded"
                  value={options[field.id] as number}
                  onChange={e => handleChange(field.id, parseFloat(e.target.value), 'number')}
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
                    onChange={e => handleChange(field.id, parseFloat(e.target.value), 'range')}
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
                  onChange={e => handleChange(field.id, e.target.value, 'select')}
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
                    onChange={e => handleChange(field.id, e.target.checked, 'checkbox')}
                  />
                </div>
              )}
              
              {field.type === 'checkbox-group' && field.checkboxOptions && (
                <div className="space-y-2 mt-1">
                  {field.checkboxOptions.map(option => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${field.id}-${option.value}`}
                        name={field.id}
                        value={option.value}
                        checked={(options[field.id] as string[] | undefined || []).includes(option.value)}
                        onChange={e => handleChange(
                          field.id, 
                          { checked: e.target.checked, itemValue: option.value }, 
                          'checkbox-group'
                        )}
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine"
                      />
                      <label htmlFor={`${field.id}-${option.value}`} className="text-sm text-gray-700">
                        {option.label}
                        {option.description && <span className="text-xs text-gray-500 ml-1">({option.description})</span>}
                      </label>
                    </div>
                  ))
                  }
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