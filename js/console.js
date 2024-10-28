// js/console.js

let consoleMessages = JSON.parse(localStorage.getItem('consoleMessages')) || [];

function getTimestamp() {
    const timeFormat = localStorage.getItem('timeFormat') || '24'; // Default to 24-hour if not set
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: timeFormat === '12'
    };
    return new Date().toLocaleTimeString('en-GB', options);
}

function addConsoleMessage(message, isHTML = false) {
    const timestamp = getTimestamp();
    const messageHTML = isHTML ? `[${timestamp}] ${message}` : `[${timestamp}] ${message}`;

    consoleMessages.push(messageHTML);
    localStorage.setItem('consoleMessages', JSON.stringify(consoleMessages)); // Store messages in localStorage
    updateConsoleOutputs();

    // Re-attach events after rendering new messages
    attachSummaryClickEvent();
}

function updateConsoleOutputs() {
    const consoleOutputs = document.querySelectorAll('.console-output');

    consoleOutputs.forEach(consoleOutput => {
        consoleOutput.innerHTML = ''; // Clear current messages
        consoleMessages.slice(-5).forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.innerHTML = message;
            consoleOutput.appendChild(messageElement);
        });
        consoleOutput.scrollTop = consoleOutput.scrollHeight; // Scroll to the bottom
    });
}

function attachSummaryClickEvent() {
    document.querySelectorAll('.consumption-summary').forEach(summaryElement => {
        summaryElement.removeEventListener('click', handleConsumptionSummaryClick);
        summaryElement.addEventListener('click', handleConsumptionSummaryClick);
    });
}

export function getIconHtml(iconName) {
    const basePath = '/assets/icon/small/';
    return `<img src="${basePath}${iconName}" alt="${iconName.split('.')[0]} Icon" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;">`;
}

// Load console messages when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateConsoleOutputs();
    attachSummaryClickEvent(); // Attach any existing messages on load
});


export function initializeConsole() {
    const showConsole = localStorage.getItem('showConsole') !== 'false'; // Default to show if not set

    if (showConsole) {
        return fetch('/html/consolePanel.html')
            .then(response => response.text())
            .then(data => {
                const consoleContainer = document.createElement('div');
                consoleContainer.innerHTML = data;
                document.body.appendChild(consoleContainer);

                // Initialize console to display initial messages
                updateConsoleOutputs();
            })
            .catch(error => console.error('Error loading console panel:', error));
    }
}

export { addConsoleMessage };