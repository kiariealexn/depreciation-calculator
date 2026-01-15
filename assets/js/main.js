function handleCalculate(event) {
    event.preventDefault();
    console.log('📝 Form submitted!');
    
    // Get form values
    const assetData = {
        name: document.getElementById('assetName').value.trim(),
        cost: parseFloat(document.getElementById('assetCost').value),
        salvageValue: parseFloat(document.getElementById('salvageValue').value),
        usefulLife: parseInt(document.getElementById('usefulLife').value),
        purchaseDate: document.getElementById('purchaseDate').value
    };
    
    // Get selected methods
    const selectedMethods = Array.from(document.querySelectorAll('input[name="method"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Enhanced validation section
    const errors = [];

    if (!assetData.name) {
        errors.push("Please enter an asset name");
    }

    if (isNaN(assetData.cost) || assetData.cost <= 0) {
        errors.push("Please enter a valid positive cost amount");
    }

    if (isNaN(assetData.salvageValue) || assetData.salvageValue < 0) {
        errors.push("Salvage value cannot be negative");
    }

    if (assetData.salvageValue > assetData.cost) {
        errors.push("Salvage value cannot exceed asset cost");
    }

    if (isNaN(assetData.usefulLife) || assetData.usefulLife < 1) {
        errors.push("Useful life must be at least 1 year");
    }

    if (assetData.usefulLife > 50) {
        errors.push("Useful life cannot exceed 50 years");
    }

    // CPA Exam standard: useful life should be reasonable
    if (assetData.usefulLife > 30 && assetData.cost < 100000) {
        errors.push("Useful life seems unusually long for this asset value");
    }

    if (selectedMethods.length === 0) {
        errors.push("Please select at least one depreciation method");
    }
    
    // ==== FIX 2: Handle validation errors ====
    if (errors.length > 0) {
        showErrors(errors);
        return; // Stop execution if there are errors
    }
    
    // Clear any previous errors
    clearErrors();
    
    // Update asset summary
    updateAssetSummary(assetData);
    
    // Calculate results for selected methods
    const results = {};
    
    if (selectedMethods.includes('straightLine')) {
        results.straightLine = calculateStraightLine(assetData);
    }
    
    if (selectedMethods.includes('decliningBalance200')) {
        results.decliningBalance200 = calculateDecliningBalance(assetData, 2);
    }
    
    if (selectedMethods.includes('decliningBalance150')) {
        results.decliningBalance150 = calculateDecliningBalance(assetData, 1.5);
    }
    
    // Display results
    displayResults(results);
    
    // ==== FIX 3: Initialize charts ====
    initializeCharts(results, assetData);
} // ==== FIX 1: Added missing closing brace ====

// ===== REST OF YOUR FUNCTIONS =====

function showErrors(errors) {
    clearErrors();
    
    const errorHtml = errors.map(error => 
        `<div class="error">⚠️ ${error}</div>`
    ).join('');
    
    const errorContainer = document.createElement('div');
    errorContainer.innerHTML = errorHtml;
    errorContainer.id = 'errorContainer';
    
    // Insert after the form
    const form = document.getElementById('depreciationForm');
    form.parentNode.insertBefore(errorContainer, form.nextSibling);
    
    // Scroll to errors
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearErrors() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.remove();
    }
}

function updateAssetSummary(assetData) {
    // ==== FIX: Get assetSummary element inside function ====
    const assetSummary = document.getElementById('assetSummary');
    const depreciationBase = assetData.cost - assetData.salvageValue;
    
    assetSummary.innerHTML = `
        <h3>${assetData.name}</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Initial Cost:</span>
                <span class="summary-value">$${assetData.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Salvage Value:</span>
                <span class="summary-value">$${assetData.salvageValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Useful Life:</span>
                <span class="summary-value">${assetData.usefulLife} years</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Depreciable Base:</span>
                <span class="summary-value">$${depreciationBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
    `;
}

function displayResults(results) {
    const depreciationTable = document.getElementById('depreciationTable').querySelector('tbody');
    
    // Clear existing table rows
    depreciationTable.innerHTML = '';
    
    // Get the first method's schedule to know how many years
    const firstMethodKey = Object.keys(results)[0];
    if (!firstMethodKey) return;
    
    const yearCount = results[firstMethodKey].schedule.length;
    
    // Create header for method comparison
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th colspan="5" class="comparison-header">Depreciation Schedule Comparison</th>';
    depreciationTable.appendChild(headerRow);
    
    // Create year rows
    for (let year = 0; year < yearCount; year++) {
        const row = document.createElement('tr');
        
        let rowHTML = `<td>Year ${year + 1}</td>`;
        
        // Add data for each selected method
        Object.keys(results).forEach(methodKey => {
            const yearData = results[methodKey].schedule[year];
            if (yearData) {
                rowHTML += `
                    <td class="method-data">
                        <div class="method-label">${results[methodKey].method}</div>
                        <div>BV: $${yearData.beginningValue.toLocaleString()}</div>
                        <div>Exp: $${yearData.depreciationExpense.toLocaleString()}</div>
                        <div>Acc: $${yearData.accumulatedDepreciation.toLocaleString()}</div>
                        <div>EV: $${yearData.endingValue.toLocaleString()}</div>
                    </td>
                `;
            }
        });
        
        // If only one method selected, use the original format
        if (Object.keys(results).length === 1) {
            const yearData = results[firstMethodKey].schedule[year];
            rowHTML = `
                <td>${yearData.year}</td>
                <td>$${yearData.beginningValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>$${yearData.depreciationExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>$${yearData.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>$${yearData.endingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            `;
        }
        
        row.innerHTML = rowHTML;
        depreciationTable.appendChild(row);
    }
}

function handleReset() {
    console.log('🔄 Form reset');
    
    // ==== FIX: Get elements inside function ====
    const form = document.getElementById('depreciationForm');
    const depreciationTable = document.getElementById('depreciationTable').querySelector('tbody');
    const assetSummary = document.getElementById('assetSummary');
    const purchaseDate = document.getElementById('purchaseDate');
    
    if (form) form.reset();
    if (depreciationTable) depreciationTable.innerHTML = '';
    if (assetSummary) assetSummary.innerHTML = '<p>Enter asset details and click "Calculate" to see results</p>';
    if (purchaseDate) purchaseDate.valueAsDate = new Date();
    
    clearErrors();
}

// Temporary placeholder for Phase 3 charts
function initializeCharts(results, assetData) {
    console.log('📊 Chart data ready for Phase 3');
    console.log('Results available:', Object.keys(results));
    
    // Optional: Show a simple text chart
    const chartElement = document.getElementById('depreciationChart');
    if (chartElement && chartElement.getContext) {
        const ctx = chartElement.getContext('2d');
        ctx.clearRect(0, 0, chartElement.width, chartElement.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('📈 Charts coming in Phase 3', 
                    chartElement.width/2, 
                    chartElement.height/2);
    }
}

// ===== DOM Content Loaded =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Initializing calculator...');
    
    // DOM Elements - they only exist AFTER DOM loads
    const form = document.getElementById('depreciationForm');
    const resetBtn = document.getElementById('resetBtn');
    const purchaseDate = document.getElementById('purchaseDate');
    
    // Initialize date to today
    if (purchaseDate) {
        purchaseDate.valueAsDate = new Date();
        console.log('📅 Date initialized to today');
    }
    
    // Event Listeners - only attach if elements exist
    if (form) {
        form.addEventListener('submit', handleCalculate);
        console.log('✅ Form event listener attached');
    } else {
        console.error('❌ Form element not found!');
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
        console.log('✅ Reset button listener attached');
    }
    
    // Quick debug check
    console.log('🔧 Functions available:');
    console.log('- handleCalculate:', typeof handleCalculate);
    console.log('- calculateStraightLine:', typeof calculateStraightLine);
    console.log('- calculateDecliningBalance:', typeof calculateDecliningBalance);
});
