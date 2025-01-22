
// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Add panel collapse functionality
            const toggleButton = document.querySelector('.toggle-panel');
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const panel = document.getElementById('panel-wrapper');
                    if (panel) {
                        panel.classList.toggle('collapsed');
                        document.body.classList.toggle('panel-collapsed');
                        localStorage.setItem('panelCollapsed', panel.classList.contains('collapsed'));
                    }
                });
            }

            // Set initial collapse state from localStorage
            const panel = document.getElementById('panel-wrapper');
            if (panel && localStorage.getItem('panelCollapsed') === 'true') {
                panel.classList.add('collapsed');
            }
        });
}

export { initializePanel };
