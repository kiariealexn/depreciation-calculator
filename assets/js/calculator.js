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

// Sum-of-the-Years-Digits Method with decimal years support
// WHY: Accelerated depreciation that frontloads cost into early years
// Example (5-year, $10k cost, $1k salvage):
//   Sum = 5+4+3+2+1 = 15
//   Year 1: (5/15) × $9,000 = $3,000
//   Year 2: (4/15) × $9,000 = $2,400
//   Year 3: (3/15) × $9,000 = $1,800 ... continues declining
function calculateSumOfYearsDigits(assetData) {
    const { cost, salvageValue, usefulLife } = assetData;
    const depreciableBase = cost - salvageValue;
    
    // Calculate sum of years digits
    // For 5-year asset: 5+4+3+2+1 = 15
    const fullYears = Math.floor(usefulLife);
    let sumOfYears = 0;
    for (let i = 1; i <= fullYears; i++) {
        sumOfYears += i;
    }
    
    // Handle partial year if usefulLife is decimal
    const partialYear = usefulLife - fullYears;
    let partialYearFraction = 0;
    if (partialYear > 0) {
        // For a partial year, add the fractional contribution
        // E.g., if 5.3 years: add 0.3 * (remaining digit)
        partialYearFraction = partialYear;
        sumOfYears += partialYearFraction;
    }
    
    const schedule = [];
    let accumulatedDepreciation = 0;
    let beginningValue = cost;
    
    for (let year = 1; year <= Math.ceil(usefulLife); year++) {
        // Calculate fraction for this year
        const isPartialYear = year > usefulLife;
        let yearDigit = fullYears - year + 1; // Year 1 gets fullYears, Year 2 gets fullYears-1, etc.
        
        // Adjust for partial year
        if (isPartialYear) {
            yearDigit = partialYearFraction;
        }
        
        // Calculate depreciation expense for this year
        const depreciationExpense = (yearDigit / sumOfYears) * depreciableBase;
        
        accumulatedDepreciation += depreciationExpense;
        const endingValue = cost - accumulatedDepreciation;
        
        // Ensure we don't go below salvage value
        const finalEndingValue = Math.max(endingValue, salvageValue);
        const adjustedAccumulation = cost - finalEndingValue;
        
        schedule.push({
            year: year + (isPartialYear ? '*' : ''), // Mark partial years
            beginningValue: parseFloat(beginningValue.toFixed(2)),
            depreciationExpense: parseFloat(depreciationExpense.toFixed(2)),
            accumulatedDepreciation: parseFloat(adjustedAccumulation.toFixed(2)),
            endingValue: parseFloat(finalEndingValue.toFixed(2))
        });
        
        beginningValue = finalEndingValue;
        
        // Stop if we've reached salvage value
        if (finalEndingValue <= salvageValue) {
            break;
        }
    }
    
    return {
        method: 'Sum-of-the-Years-Digits',
        schedule,
        totalDepreciation: parseFloat((cost - Math.max(schedule[schedule.length - 1].endingValue, salvageValue)).toFixed(2)),
        sumOfYears: sumOfYears
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

// Test function for Sum-of-the-Years-Digits
function testSumOfYearsDigits() {
    console.log('🧪 Testing Sum-of-the-Years-Digits Method');
    
    const testAsset = {
        cost: 10000,
        salvageValue: 1000,
        usefulLife: 5
    };
    
    const result = calculateSumOfYearsDigits(testAsset);
    
    console.log('Asset:', testAsset);
    console.log('Sum of Years (expected 15):', result.sumOfYears);
    console.log('Year 1 Depreciation (expected $3,000):', result.schedule[0]?.depreciationExpense);
    console.log('Year 2 Depreciation (expected $2,400):', result.schedule[1]?.depreciationExpense);
    console.log('Total Schedule:', result.schedule);
    
    // Quick validation
    const year1Valid = Math.abs(result.schedule[0]?.depreciationExpense - 3000) < 100;
    const year2Valid = Math.abs(result.schedule[1]?.depreciationExpense - 2400) < 100;
    
    console.log(year1Valid && year2Valid ? '✅ Test PASSED' : '❌ Test FAILED');
    return result;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateStraightLine,
        calculateDecliningBalance,
        calculateSumOfYearsDigits,
        testDecliningBalance,
        testSumOfYearsDigits
    };
}
