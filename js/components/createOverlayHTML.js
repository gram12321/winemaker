import { getFlagIconHTML } from '../utils.js';

export function createOverlayHTML({ 
    title,
    farmland = null,
    content,
    buttonText = 'Submit',
    buttonClass = 'btn-primary',
    buttonIdentifier = 'action-btn',
    warningMessage = null,
    isModal = false  // Add new parameter to determine if this is for a modal
}) {
    const headerTitle = farmland ? 
        `${title} ${getFlagIconHTML(farmland.country)} ${farmland.name}` : 
        title;

    // For modal overlays, don't wrap in overlay-content/container
    const innerContent = `
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
    `;

    return isModal ? innerContent : `
        <div class="overlay-content overlay-container">
            ${innerContent}
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

function createMethodSelector({
    title = 'Select Method',
    methods = [],
    defaultMethod = null,
    showSkipOption = false,
    skipOptionText = 'Skip (not recommended)',
    containerClass = '',
    skipOptionId = 'skip-method',  // Add this parameter
    methodRadioName = 'method-select',  // Add this parameter
    customMethodContent = item => '' // Allow custom content injection
}) {
    const methodItems = methods.map(item => `
        <div class="method-item ${item.disabled ? 'disabled' : ''} ${item.name === defaultMethod ? 'selected' : ''}" 
             data-method="${item.name}"
             title="${item.disabled ? item.disabledReason || 'Not available' : ''}">
            <div class="method-item-content">
                ${item.iconPath ? `<img src="${item.iconPath}" alt="${item.name}">` : ''}
                <span class="method-name">${item.name}</span>
                ${item.stats ? `<span class="method-stats">${item.stats}</span>` : ''}
                ${customMethodContent(item)}
            </div>
            <input type="radio" 
                   name="${methodRadioName}" 
                   value="${item.name}" 
                   ${item.disabled ? 'disabled' : ''}
                   ${item.name === defaultMethod ? 'checked' : ''}>
        </div>
    `).join('');

    return `
        <div class="text-center">
            <h3 class="h5 mb-0">${title}</h3>
        </div>
        <div class="card-body text-center">
            <div class="method-selector">
                ${methodItems}
            </div>
            ${showSkipOption ? `
                <div class="skip-option">
                    <input type="checkbox" id="${skipOptionId}" name="${skipOptionId}">
                    <label for="${skipOptionId}">${skipOptionText}</label>
                </div>
            ` : ''}
        </div>
    `;
}

export {
    createSlider,
    createCheckbox,
    createSelect,
    createInfoBox,
    createTextCenter,
    createTable,
    createMethodSelector
};
