export function calculateCrushingCharacteristics(baseCharacteristics, params) {
    const { destemming } = params;
    
    // Deep clone the base characteristics to avoid modifying the original
    const crushedCharacteristics = { ...baseCharacteristics };
    
    console.log('\n=== Crushing Characteristics Calculation ===');
    console.log('Initial Characteristics:', baseCharacteristics);
    console.log('Destemming:', destemming);

    // Apply modifications based on destemming
    if (destemming) {
        console.log('\nApplying destemming modifications:');
        
        // With destemming - increase positive characteristics
        logCharacteristicChange('body', crushedCharacteristics.body, 
            Math.min(1, crushedCharacteristics.body + 0.1));
        crushedCharacteristics.body = Math.min(1, crushedCharacteristics.body + 0.1);
        
        logCharacteristicChange('tannins', crushedCharacteristics.tannins, 
            Math.min(1, crushedCharacteristics.tannins + 0.15));
        crushedCharacteristics.tannins = Math.min(1, crushedCharacteristics.tannins + 0.15);
        
        logCharacteristicChange('spice', crushedCharacteristics.spice, 
            Math.min(1, crushedCharacteristics.spice + 0.1));
        crushedCharacteristics.spice = Math.min(1, crushedCharacteristics.spice + 0.1);
    } else {
        console.log('\nApplying no-destemming penalties:');
        
        // Without destemming - decrease certain characteristics
        logCharacteristicChange('aroma', crushedCharacteristics.aroma, 
            Math.max(0, crushedCharacteristics.aroma - 0.15));
        crushedCharacteristics.aroma = Math.max(0, crushedCharacteristics.aroma - 0.15);
        
        logCharacteristicChange('tannins', crushedCharacteristics.tannins, 
            Math.max(0, crushedCharacteristics.tannins - 0.1));
        crushedCharacteristics.tannins = Math.max(0, crushedCharacteristics.tannins - 0.1);
    }

    console.log('\nFinal Characteristics:', crushedCharacteristics);
    return crushedCharacteristics;
}

function logCharacteristicChange(characteristic, oldValue, newValue) {
    const change = newValue - oldValue;
    const changeSymbol = change >= 0 ? '↑' : '↓';
    const changeAbs = Math.abs(change);
    console.log(`${characteristic}: ${oldValue.toFixed(3)} -> ${newValue.toFixed(3)} ${changeSymbol}${(changeAbs * 100).toFixed(1)}%`);
}
