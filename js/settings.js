// settings.js
import { addConsoleMessage } from '/js/console.js';

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('settings-form');
    const timeFormatSelect = document.getElementById('time-format');
    const showConsoleCheckbox = document.getElementById('show-console');
    const feedback = document.getElementById('feedback');

    // Load saved settings from localStorage
    const savedFormat = localStorage.getItem('timeFormat') || '24';
    timeFormatSelect.value = savedFormat;
    showConsoleCheckbox.checked = localStorage.getItem('showConsole') === 'true';

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedFormat = timeFormatSelect.value;
        const showConsole = showConsoleCheckbox.checked;
        localStorage.setItem('timeFormat', selectedFormat);
        localStorage.setItem('showConsole', showConsole);


        // Add a console message indicating the change
        addConsoleMessage(`Time format changed to ${selectedFormat === '24' ? '24-hour' : '12-hour (AM/PM)'} format.`);
        addConsoleMessage(`Console visibility set to ${showConsole ? 'show' : 'hide'}.`);
    });
});