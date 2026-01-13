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

// Declining Balance Method (200% and 150%)
function calculateDecliningBalance(assetData, rateMultiplier = 2) {
    const { cost, salvageValue, usefulLife } = assetData;
    const depreciationRate = rateMultiplier / usefulLife;
    
    const schedule = [];
    let accumulatedDepreciation = 0;
    let beginningValue = cost;
    
    for (let year = 1; year <= usefulLife; year++) {
        // Calculate depreciation for this year
        let depreciationExpense = beginningValue * depreciationRate;
        
        // Ensure we don't depreciate below salvage value
        const projectedEndingValue = beginningValue - depreciationExpense;
        
        if (projectedEndingValue < salvageValue) {
            // For the final year, only depreciate down to salvage value
            depreciationExpense = beginningValue - salvageValue;
        }
        
        // If depreciation would be negative (book value already at/below salvage), set to 0
        if (depreciationExpense < 0) {
            depreciationExpense = 0;
        }
        
        accumulatedDepreciation += depreciationExpense;
        const endingValue = cost - accumulatedDepreciation;
        
        // Ensure ending value doesn't go below salvage
        const finalEndingValue = Math.max(endingValue, salvageValue);
        
        schedule.push({
            year,
            beginningValue: parseFloat(beginningValue.toFixed(2)),
            depreciationExpense: parseFloat(depreciationExpense.toFixed(2)),
            accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
            endingValue: parseFloat(finalEndingValue.toFixed(2))
        });
        
        beginningValue = finalEndingValue;
        
        // If we've reached salvage value, stop calculating
        if (finalEndingValue <= salvageValue) {
            // Fill remaining years with zero depreciation
            while (schedule.length < usefulLife) {
                schedule.push({
                    year: schedule.length + 1,
                    beginningValue: parseFloat(salvageValue.toFixed(2)),
                    depreciationExpense: 0,
                    accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
                    endingValue: parseFloat(salvageValue.toFixed(2))
                });
            }
            break;
        }
    }
    
    return {
        method: rateMultiplier === 2 ? '200% Declining Balance' : '150% Declining Balance',
        schedule,
        totalDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
        rateMultiplier
    };
}

// Test function for Declining Balance
function testDecliningBalance() {
    console.log('🧪 Testing 200% Declining Balance Method');
    
    const testAsset = {
        cost: 10000,
        salvageValue: 1000,
        usefulLife: 5
    };
    
    const result = calculateDecliningBalance(testAsset, 2);
    
    console.log('Asset:', testAsset);
    console.log('Year 1 Depreciation (expected ~$4,000):', result.schedule[0]?.depreciationExpense);
    console.log('Year 2 Depreciation (expected ~$2,400):', result.schedule[1]?.depreciationExpense);
    console.log('Total Schedule:', result.schedule);
    
    // Quick validation
    const year1Valid = Math.abs(result.schedule[0]?.depreciationExpense - 4000) < 100;
    const year2Valid = Math.abs(result.schedule[1]?.depreciationExpense - 2400) < 100;
    
    console.log(year1Valid && year2Valid ? '✅ Test PASSED' : '❌ Test FAILED');
    return result;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateStraightLine,
        calculateDecliningBalance,
        calculateSumOfYearsDigits
    };
}


