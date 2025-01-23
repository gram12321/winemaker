
// Common overlay utility functions 
export function hideOverlay(overlay) {
    if (!overlay) return;
    
    // If it's a string, assume it's a selector
    if (typeof overlay === 'string') {
        const elements = document.querySelectorAll(overlay);
        elements.forEach(el => hideOverlay(el));
        return;
    }

    // Handle different overlay types
    if (overlay.classList.contains('mainview-overlay')) {
        overlay.remove();
    } else {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        if (overlay.querySelector('.overlay-content')) {
            overlay.querySelector('.overlay-content').innerHTML = '';
        }
    }
}

export function showMainViewOverlay(overlayContent) {
    hideOverlay('.mainview-overlay'); // Use new consolidated function
    
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');
    overlay.innerHTML = overlayContent;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.style.display = 'block';
    });
    
    return overlay;
}

export function showModalOverlay(overlayId, content) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        const contentDiv = overlay.querySelector('.overlay-content') || overlay;
        contentDiv.innerHTML = content;
        overlay.classList.add('active');
        overlay.style.display = 'block';
    }
    return overlay;
}

// Standard overlay utility functions
export function showStandardOverlay(content) {
    const overlayContainer = document.createElement('div');
    overlayContainer.classList.add('overlay');
    overlayContainer.innerHTML = `
        <div class="overlay-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(overlayContainer);
    requestAnimationFrame(() => {
        overlayContainer.classList.add('active');
    });
    
    return overlayContainer;
}

export function setupStandardOverlayClose(overlayContainer) {
    const closeButton = overlayContainer.querySelector('.close-btn');
    if (closeButton) {
        closeButton.addEventListener('click', () => hideOverlay(overlayContainer));
    }
    overlayContainer.addEventListener('click', (event) => {
        if (event.target === overlayContainer) {
            hideOverlay(overlayContainer);
        }
    });
}

// Alias for backward compatibility
export const removeOverlay = hideOverlay;
export const hideAllOverlays = () => hideOverlay('.mainview-overlay');
