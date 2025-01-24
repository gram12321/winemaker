
// Common overlay utility functions 
export function hideOverlay(overlay) {
    if (!overlay) return;
    
    // If it's a string, assume it's a selector
    if (typeof overlay === 'string') {
        const elements = document.querySelectorAll(overlay);
        elements.forEach(el => hideOverlay(el));
        return;
    }

    // Clean up any existing overlays of the same type
    const overlayClass = overlay.classList[0];
    if (overlayClass) {
        document.querySelectorAll(`.${overlayClass}`).forEach(el => {
            if (el !== overlay && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    // Handle different overlay types
    if (overlay.classList.contains('mainview-overlay')) {
        overlay.remove();
    } else {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
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
    // Create a modal overlay for warnings and confirmations
    const overlay = document.createElement('div');
    overlay.classList.add('overlay', 'modal-overlay');
    overlay.id = overlayId;
    
    overlay.innerHTML = `
        <div class="overlay-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    return overlay;
}

// Standard overlay for major features (planting, harvesting, etc)
export function showStandardOverlay(content) {
    const overlayContainer = document.createElement('div');
    overlayContainer.classList.add('overlay', 'standard-overlay');
    
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
