// Pure calculation functions - no DOM manipulation

function calculateStraightLine(assetData) {
    const { cost, salvageValue, usefulLife } = assetData;
    const depreciableBase = cost - salvageValue;
    const annualDepreciation = depreciableBase / usefulLife;
    
    const schedule = [];
    let accumulatedDepreciation = 0;
    let beginningValue = cost;
    
    for (let year = 1; year <= usefulLife; year++) {
        // For the last year, adjust depreciation to ensure ending value = salvage value
        const isLastYear = year === usefulLife;
        const depreciationExpense = isLastYear 
            ? depreciableBase - accumulatedDepreciation
            : annualDepreciation;
        
        accumulatedDepreciation += depreciationExpense;
        const endingValue = cost - accumulatedDepreciation;
        
        schedule.push({
            year,
            beginningValue: parseFloat(beginningValue.toFixed(2)),
            depreciationExpense: parseFloat(depreciationExpense.toFixed(2)),
            accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
            endingValue: parseFloat(endingValue.toFixed(2))
        });
        
        beginningValue = endingValue;
    }
    
    return {
        method: 'Straight-Line',
        schedule,
        totalDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
        annualDepreciation: parseFloat(annualDepreciation.toFixed(2))
    };
}

// TODO: Add these functions in Phase 2
function calculateDecliningBalance(assetData, rateMultiplier = 2) {
    // To be implemented in Phase 2
    return { method: 'Declining Balance', schedule: [] };
}

function calculateSumOfYearsDigits(assetData) {
    // To be implemented in Phase 2
    return { method: 'Sum-of-Years-Digits', schedule: [] };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateStraightLine,
        calculateDecliningBalance,
        calculateSumOfYearsDigits
    };
}