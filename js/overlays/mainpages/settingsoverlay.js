
import { showMainViewOverlay } from '../overlayUtils.js';
import tutorialManager from '/js/tutorial.js';
import { addConsoleMessage } from '/js/console.js';

export function showSettingsOverlay() {
    const overlay = showMainViewOverlay(createSettingsOverlayHTML());
    setupSettingsEventListeners(overlay);
}

function createSettingsOverlayHTML() {
    return `
        <div class="mainview-overlay-content">
            <h1>Settings</h1>
            <form id="settings-form" class="mt-4">
                <div class="form-group">
                    <label for="time-format">Time Format:</label>
                    <select id="time-format" class="form-control">
                        <option value="12">12-hour (AM/PM)</option>
                        <option value="24">24-hour</option>
                    </select>
                </div>
                <div class="form-group mt-3">
                    <input type="checkbox" id="show-console" />
                    <label for="show-console">Show Console</label>
                </div>
                <div class="form-group mt-3">
                    <label for="land-unit">Land Unit:</label>
                    <select id="land-unit" class="form-control">
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                    </select>
                </div>
                <div class="form-group mt-3">
                    <label for="enable-tutorials">Tutorial Messages:</label>
                    <div>
                        <input type="checkbox" id="enable-tutorials" />
                        <label for="enable-tutorials">Show tutorial messages</label>
                    </div>
                    <button type="button" class="btn btn-secondary mt-2" onclick="tutorialManager.resetTutorials()">
                        Reset Tutorial Progress
                    </button>
                </div>
                <button type="submit" class="btn btn-primary">Save Settings</button>
            </form>
            <p id="feedback" class="mt-2"></p>
        </div>
    `;
}

function setupSettingsEventListeners(overlay) {
    const form = overlay.querySelector('#settings-form');
    const timeFormatSelect = overlay.querySelector('#time-format');
    const showConsoleCheckbox = overlay.querySelector('#show-console');
    const unitSelect = overlay.querySelector('#land-unit');
    const enableTutorialsCheckbox = overlay.querySelector('#enable-tutorials');

    // Load saved settings
    timeFormatSelect.value = localStorage.getItem('timeFormat') || '24';
    showConsoleCheckbox.checked = localStorage.getItem('showConsole') === 'true';
    unitSelect.value = localStorage.getItem('landUnit') || 'acres';
    enableTutorialsCheckbox.checked = localStorage.getItem('tutorialsEnabled') !== 'false';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        localStorage.setItem('timeFormat', timeFormatSelect.value);
        localStorage.setItem('showConsole', showConsoleCheckbox.checked);
        localStorage.setItem('landUnit', unitSelect.value);

        if (enableTutorialsCheckbox.checked) {
            tutorialManager.enableTutorials();
        } else {
            tutorialManager.disableAllTutorials();
        }

        addConsoleMessage(`Settings saved successfully`);
    });
}
