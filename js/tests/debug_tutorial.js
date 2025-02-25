export function analyzeStackingContext(element) {
    let context = [];
    let current = element;
    
    while (current) {
        const style = getComputedStyle(current);
        context.push({
            id: current.id || '[anonymous]',
            classes: current.className,
            creates_stacking_context: (
                style.position !== 'static' ||
                style.transform !== 'none' ||
                style.zIndex !== 'auto' ||
                style.opacity !== '1' ||
                style.filter !== 'none'
            ),
            properties: {
                position: style.position,
                zIndex: style.zIndex,
                transform: style.transform,
                opacity: style.opacity,
                filter: style.filter
            }
        });
        current = current.parentElement;
    }
    console.table(context);
}

export function analyzeStackingAndStyles(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element ${elementId} not found`);
        return;
    }

    // Get all overlays
    const tutorialOverlay = document.querySelector('.tutorial-overlay');
    const mainviewOverlay = document.querySelector('.mainview-overlay');

    console.group(`Stacking Analysis for #${elementId}`);
    
    // Element details
    console.log('Element Properties:', {
        position: getComputedStyle(element).position,
        zIndex: getComputedStyle(element).zIndex,
        backgroundColor: getComputedStyle(element).backgroundColor,
        parent: element.parentElement?.tagName,
        parentId: element.parentElement?.id || 'none'
    });

    // Overlay details
    console.log('Overlay States:', {
        tutorialOverlay: tutorialOverlay ? {
            zIndex: getComputedStyle(tutorialOverlay).zIndex,
            display: getComputedStyle(tutorialOverlay).display,
            backgroundColor: getComputedStyle(tutorialOverlay).backgroundColor
        } : 'not found',
        mainviewOverlay: mainviewOverlay ? {
            zIndex: getComputedStyle(mainviewOverlay).zIndex,
            display: getComputedStyle(mainviewOverlay).display
        } : 'not found'
    });

    console.groupEnd();
}
