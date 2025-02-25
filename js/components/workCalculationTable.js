import { formatNumber } from '../utils.js';
import { DENSITY_BASED_TASKS, TASKS } from '../constants/constants.js';

export function createWorkCalculationTable(data) {
    const { 
        acres, 
        density, 
        tasks = [], 
        totalWork,
        amount,
        unit,
        location = 'field', // 'field' or 'winery'
        methodModifier = 0,
        methodName = null,
        altitude, 
        altitudeEffect, 
        minAltitude, 
        maxAltitude, 
        medianAltitude, 
        robustness, 
        fragilityEffect,
        maxWork // Add this new property
    } = data;

    const showDensity = location === 'field' && tasks.some(task => DENSITY_BASED_TASKS.includes(task));
    const taskDisplayNames = tasks.map(taskCode => TASKS[taskCode]?.name || taskCode).join(', ');
    const isAboveMedian = altitude > medianAltitude;
    const effectDescription = isAboveMedian ? 'more' : 'less';

    return `
        <div class="work-preview">
            <div class="work-stats">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tbody>
                            ${location === 'field' ? `
                                <tr>
                                    <td>Field Size:</td>
                                    <td><span id="field-size">${formatNumber(acres, acres < 10 ? 2 : 0)}</span> acres</td>
                                </tr>
                            ` : ''}
                            ${amount !== undefined ? `
                                <tr>
                                    <td>Amount:</td>
                                    <td>
                                        ${typeof amount === 'number' 
                                            ? `<span id="process-amount">${formatNumber(amount)}</span> ${unit}`
                                            : `${amount} ${unit}`}
                                    </td>
                                </tr>
                            ` : ''}
                            ${tasks.length > 0 ? `
                                <tr>
                                    <td>Task:</td>
                                    <td><span id="selected-tasks">${taskDisplayNames}</span></td>
                                </tr>
                            ` : ''}
                            ${showDensity && density ? `
                                <tr>
                                    <td>Plant Density:</td>
                                    <td><span id="density">${formatNumber(density)}</span> vines/acre</td>
                                </tr>
                            ` : ''}
                            ${altitude ? `
                            <tr>
                                <td>Altitude:</td>
                                <td>${altitude}m (${minAltitude}-${maxAltitude}m region})
                                    <br>
                                    <small class="text-muted">
                                        ${formatNumber(Math.abs(altitudeEffect * 100))}% 
                                        ${effectDescription} work 
                                        (${isAboveMedian ? 'above' : 'below'} median)
                                    </small>
                                </td>
                            </tr>
                            ` : ''}
                            ${robustness !== undefined ? `
                            <tr>
                                <td>Grape Robustness:</td>
                                <td>${formatNumber(robustness * 100)}% robust
                                    <br>
                                    <small class="text-muted">
                                        ${formatNumber(fragilityEffect * 100)}% work modifier 
                                        (based on density)
                                    </small>
                                </td>
                            </tr>
                            ` : ''}
                            ${methodName ? `
                                <tr>
                                    <td>Method:</td>
                                    <td>${methodName}
                                        ${methodModifier !== 0 ? `
                                            <br>
                                            <small class="text-muted">
                                                ${methodModifier > 0 ? '+' : ''}${formatNumber(methodModifier * 100)}% work modifier
                                            </small>
                                        ` : ''}
                                    </td>
                                </tr>
                            ` : ''}
                            <tr class="table-primary">
                                <td><strong>Total Work:</strong></td>
                                <td><strong>
                                    ${maxWork ? 
                                        `<span id="total-work">${formatNumber(totalWork)} - ${formatNumber(maxWork)}</span> units` :
                                        `<span id="total-work">${formatNumber(totalWork)}</span> units`
                                    }
                                </strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
