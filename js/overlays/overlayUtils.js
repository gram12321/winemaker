
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
        overlay.innerHTML = content;
        overlay.classList.add('active');
    }
    return overlay;
}

// Alias for backward compatibility
export const removeOverlay = hideOverlay;
export const hideAllOverlays = () => hideOverlay('.mainview-overlay');
