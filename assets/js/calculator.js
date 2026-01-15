// Pure calculation functions - no DOM manipulation
// Straight-Line Method with decimal years support
function calculateStraightLine(assetData) {
    const { cost, salvageValue, usefulLife } = assetData;
    const depreciableBase = cost - salvageValue;
    const annualDepreciation = depreciableBase / usefulLife;
    
    const schedule = [];
    let accumulatedDepreciation = 0;
    let beginningValue = cost;
    
    // Handle partial years - create schedule for each year segment
    for (let year = 1; year <= Math.ceil(usefulLife); year++) {
        // For partial last year
        const isPartialYear = year > usefulLife;
        const depreciationExpense = isPartialYear 
            ? depreciableBase - accumulatedDepreciation
            : annualDepreciation;
        
        accumulatedDepreciation += depreciationExpense;
        const endingValue = cost - accumulatedDepreciation;
        
        schedule.push({
            year: year + (isPartialYear ? '*' : ''), // Mark partial years
            beginningValue: parseFloat(beginningValue.toFixed(2)),
            depreciationExpense: parseFloat(depreciationExpense.toFixed(2)),
            accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
            endingValue: parseFloat(Math.max(endingValue, salvageValue).toFixed(2))
        });
        
        beginningValue = Math.max(endingValue, salvageValue);
        
        // Stop if we've reached the end
        if (isPartialYear) break;
    }
    
    return {
        method: 'Straight-Line',
        schedule,
        totalDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
        annualDepreciation: parseFloat(annualDepreciation.toFixed(2))
    };
}

// Declining Balance Method with decimal years support
function calculateDecliningBalance(assetData, rateMultiplier = 2) {
    const { cost, salvageValue, usefulLife } = assetData;
    const depreciationRate = rateMultiplier / usefulLife;
    
    const schedule = [];
    let accumulatedDepreciation = 0;
    let beginningValue = cost;
    let yearCounter = 1;
    
    while (yearCounter <= Math.ceil(usefulLife) && beginningValue > salvageValue) {
        // Calculate depreciation for this year
        let depreciationExpense = beginningValue * depreciationRate;
        
        // Adjust for partial last year
        const isPartialYear = yearCounter > usefulLife;
        if (isPartialYear) {
            depreciationExpense = beginningValue - salvageValue;
        }
        
        // Ensure we don't depreciate below salvage value
        const projectedEndingValue = beginningValue - depreciationExpense;
        
        if (projectedEndingValue < salvageValue) {
            depreciationExpense = beginningValue - salvageValue;
        }
        
        // If depreciation would be negative, set to 0
        if (depreciationExpense < 0) {
            depreciationExpense = 0;
        }
        
        accumulatedDepreciation += depreciationExpense;
        const endingValue = cost - accumulatedDepreciation;
        
        // Ensure ending value doesn't go below salvage
        const finalEndingValue = Math.max(endingValue, salvageValue);
        
        schedule.push({
            year: yearCounter + (isPartialYear ? '*' : ''), // Mark partial years
            beginningValue: parseFloat(beginningValue.toFixed(2)),
            depreciationExpense: parseFloat(depreciationExpense.toFixed(2)),
            accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
            endingValue: parseFloat(finalEndingValue.toFixed(2))
        });
        
        beginningValue = finalEndingValue;
        yearCounter++;
        
        // Stop if we've reached salvage value
        if (finalEndingValue <= salvageValue) {
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


