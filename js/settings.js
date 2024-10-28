// settings.js
import { addConsoleMessage } from '/js/console.js';

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('settings-form');
    const timeFormatSelect = document.getElementById('time-format');
    const feedback = document.getElementById('feedback');

    // Load saved settings from localStorage
    const savedFormat = localStorage.getItem('timeFormat') || '24'; // Default to 24-hour
    timeFormatSelect.value = savedFormat;

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedFormat = timeFormatSelect.value;
        localStorage.setItem('timeFormat', selectedFormat);


        // Add a console message indicating the change
        addConsoleMessage(`Time format changed to ${selectedFormat === '24' ? '24-hour' : '12-hour (AM/PM)'} format.`);
    });
});