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

    // Ensure btn class is always included
    const btnClasses = `btn ${buttonClass} ${buttonIdentifier}`.trim();

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
                        <button class="${btnClasses}">${buttonText}</button>
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
    labelClass = '',
    styled = true  // Changed default to true
}) {
    return `
        <div class="${styled ? 'checkbox-styled' : 'form-check mb-3'}">
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
        <div class="info-box">
            <span><strong>${label}:</strong> </span>
            <span ${id ? `id="${id}"` : ''}>${value}</span>
        </div>
    `;
}

function createTextCenter({
    text,
    mutedText = null,
    className = '',
    format = null, // Add format parameter to handle different formatting functions
    formatOptions = {}, // Add options for formatting
    isHeadline = false,  // Add parameter for headlines
    headlineLevel = 5,   // Default to h5 (bootstrap's preferred size for sections)
    noMargin = true      // Default to no margin for consistency
}) {
    // Format the text if a format function is provided
    const formattedText = format ? format(text, formatOptions) : text;
    
    // If it's a headline, wrap in appropriate h-tag with bootstrap classes
    const content = isHeadline 
        ? `<h${headlineLevel} class="h${headlineLevel} ${noMargin ? 'mb-0' : ''}">${formattedText}</h${headlineLevel}>`
        : `<div>${formattedText}</div>`;
    
    return `
        <div class="text-center ${className}">
            ${content}
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

function createInfoTable({
    rows = [],
    className = 'data-table',
    tableClassName = 'table'
}) {
    return `
        <table class="${tableClassName} ${className}">
            <tbody>
                ${rows.map(row => {
                    if (row.tooltip) {
                        return createTooltipRow(row);
                    }
                    if (row.icon) {
                        return createIconRow(row);
                    }
                    return createBasicRow(row);
                }).join('')}
            </tbody>
        </table>
    `;
}

function createBasicRow({ label, value, valueClass = '' }) {
    return `
        <tr>
            <td>${label}</td>
            <td${valueClass ? ` class="${valueClass}"` : ''}>${value}</td>
        </tr>
    `;
}

function createTooltipRow({ label, value, valueClass = '', tooltip }) {
    return `
        <tr>
            <td>${label}</td>
            <td class="${valueClass} overlay-tooltip" title="${tooltip}">${value}</td>
        </tr>
    `;
}

function createIconRow({ label, icon, value, valueClass = '', id = '' }) {
    return `
        <tr>
            <td>
                ${createIconLabel({ icon, text: label })}
            </td>
            <td${valueClass ? ` class="${valueClass}"` : ''}${id ? ` id="${id}"` : ''}>${value}</td>
        </tr>
    `;
}

function createIconLabel({ 
    icon, 
    text, 
    iconClass = 'characteristic-icon',
    iconPath = '/assets/icon/small'
}) {
    return `
        <div class="icon-label">
            <img src="${iconPath}/${icon}.png" 
                 alt="${text}" 
                 class="${iconClass}">
            ${text}
        </div>
    `;
}

function createRegionalSection({
    title,
    countries,
    createContent,
    defaultCountry = 0
}) {
    const countryButtons = countries.map(country => 
        `<button class="btn btn-secondary btn-sm toggle-country" data-country="${country}">${country}</button>`
    ).join('');

    const regionsContent = countries.map((country, index) => `
        <div class="country-section" id="regions-${country.replace(/\s+/g, '-')}" 
             style="display: ${index === defaultCountry ? 'block' : 'none'};">
            ${createContent(country)}
        </div>`
    ).join('');

    return `
        <div class="info-section">
            <div class="text-center">
                <div><h4>${title}</h4></div>
            </div>
            <div class="country-buttons">${countryButtons}</div>
            <div class="mt-3">${regionsContent}</div>
        </div>`;
}

function createMultipleBtnSection({
    title,
    buttons,
    createContent,
    defaultButton = 0,
    btnStyle = 'btn-secondary btn-sm',
    btnGroupClass = 'section-btn-group',    // More generic name
    contentClass = 'section-content'         // More generic name
}) {
    const buttonElements = buttons.map(btn => 
        `<button class="btn ${btnStyle}" data-section="${btn}">${btn}</button>`
    ).join('');

    const sections = buttons.map((btn, index) => `
        <div class="${contentClass}" id="section-${btn.replace(/\s+/g, '-')}" 
             style="display: ${index === defaultButton ? 'block' : 'none'};">
            ${createContent(btn)}
        </div>`
    ).join('');

    return `
        <div class="info-section">
            <div class="text-center">
                <div><h4>${title}</h4></div>
            </div>
            <div class="${btnGroupClass}">${buttonElements}</div>
            <div class="mt-3">${sections}</div>
        </div>`;
}

export {
    createSlider,
    createCheckbox,
    createSelect,
    createInfoBox,
    createTextCenter,
    createTable,
    createMethodSelector,
    createInfoTable,
    createIconLabel,
    createRegionalSection,
    createMultipleBtnSection
};
