import { getFlagIconHTML } from '../utils.js';

export function createOverlayHTML({ 
    title,
    farmland = null,  // Make farmland optional
    content,
    buttonText = 'Submit',
    buttonClass = 'btn-primary',
    buttonIdentifier = 'action-btn',
    warningMessage = null
}) {
    const headerTitle = farmland ? 
        `${title} ${getFlagIconHTML(farmland.country)} ${farmland.name}` : 
        title;

    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">${headerTitle}</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    ${warningMessage ? `
                        <div class="alert alert-warning">
                            <strong>Warning:</strong> 
                            <br>
                            ${warningMessage}
                        </div>
                    ` : ''}
                    ${content}
                    ${buttonText ? `
                        <div class="d-flex justify-content-center mt-4">
                            <button class="btn ${buttonClass} ${buttonIdentifier}">${buttonText}</button>
                        </div>
                    ` : ''}
                </div>
            </section>
        </div>
    `;
}

// Helper functions for common UI elements
function createSlider({ 
    id, 
    label, 
    min = 0, 
    max = 100, 
    step = 1, 
    value = 50,
    disabled = false,
    showValue = true,
    lowLabel = '',
    highLabel = '',
    valuePrefix = '',
    valueSuffix = ''
}) {
    return `
        <div class="form-group">
            ${label ? `<label for="${id}" class="form-label">${label}</label>` : ''}
            <div class="d-flex align-items-center">
                ${lowLabel ? `<span class="mr-2">${lowLabel}</span>` : ''}
                <input type="range" class="custom-range" id="${id}"
                    min="${min}" max="${max}" step="${step}" value="${value}"
                    ${disabled ? 'disabled' : ''}>
                ${highLabel ? `<span class="ml-2">${highLabel}</span>` : ''}
            </div>
            ${showValue ? `
            <div class="text-center">
                ${valuePrefix}<span id="${id}-value">${value}</span>${valueSuffix}
            </div>` : ''}
        </div>
    `;
}

function createCheckbox({
    id,
    label,
    disabled = false,
    checked = false,
    labelClass = ''
}) {
    return `
        <div class="form-check mb-3">
            <input type="checkbox" class="form-check-input" id="${id}"
                ${disabled ? 'disabled' : ''}
                ${checked ? 'checked' : ''}>
            <label class="form-check-label ${labelClass}" for="${id}">
                ${label}
            </label>
        </div>
    `;
}

function createSelect({
    id,
    label,
    options = [],
    selectedValue = ''
}) {
    const optionsHtml = options.map(opt => 
        `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`
    ).join('');

    return `
        <div class="form-group">
            <label for="${id}" class="form-label">${label}</label>
            <select class="form-control form-control-sm" id="${id}">
                ${optionsHtml}
            </select>
        </div>
    `;
}

function createInfoBox({
    label,
    value,
    id = null
}) {
    return `
        <div class="planting-overlay-info-box">
            <span>${label}: </span>
            <span ${id ? `id="${id}"` : ''}>${value}</span>
        </div>
    `;
}

function createTextCenter({
    text,
    mutedText = null,
    className = ''
}) {
    return `
        <div class="text-center ${className}">
            <div>${text}</div>
            ${mutedText ? `<div class="text-muted">${mutedText}</div>` : ''}
        </div>
    `;
}

function createTable({
    headers = [],
    id = '',
    className = '',
    tableClassName = 'table table-bordered'
}) {
    return `
        <table class="${tableClassName} ${className}">
            <thead>
                <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody ${id ? `id="${id}"` : ''}>
            </tbody>
        </table>
    `;
}

export {
    createSlider,
    createCheckbox,
    createSelect,
    createInfoBox,
    createTextCenter,
    createTable
};
