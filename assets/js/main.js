// DOM Elements
const form = document.getElementById('depreciationForm');
const resetBtn = document.getElementById('resetBtn');
const depreciationTable = document.getElementById('depreciationTable').querySelector('tbody');
const assetSummary = document.getElementById('assetSummary');

// Initialize date to today
document.getElementById('purchaseDate').valueAsDate = new Date();

// Event Listeners
form.addEventListener('submit', handleCalculate);
resetBtn.addEventListener('click', handleReset);

function handleCalculate(event) {
    event.preventDefault();
    
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
    
    // Validate inputs
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
    
    if (assetData.cost <= assetData.salvageValue) {
        errors.push("Cost must be greater than salvage value");
    }
    
    if (isNaN(assetData.usefulLife) || assetData.usefulLife < 1 || assetData.usefulLife > 50) {
        errors.push("Useful life must be between 1 and 50 years");
    }
    
    if (selectedMethods.length === 0) {
        errors.push("Please select at least one depreciation method");
    }
    
    if (errors.length > 0) {
        showErrors(errors);
        return;
    }
    
    // Clear any previous errors
    clearErrors();
    
    // Update asset summary
    updateAssetSummary(assetData);
    
    // Calculate and display results
    const results = {};
    
    if (selectedMethods.includes('straightLine')) {
        results.straightLine = calculateStraightLine(assetData);
    }
    
    // TODO: Add other methods in Phase 2 & 3
    
    // Display results
    displayResults(results.straightLine || { schedule: [] });
    
    // TODO: Initialize charts in Phase 3
}

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
    // Clear existing table rows
    depreciationTable.innerHTML = '';
    
    // Create new rows
    results.schedule.forEach(yearData => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${yearData.year}</td>
            <td>$${yearData.beginningValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$${yearData.depreciationExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$${yearData.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$${yearData.endingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        `;
        
        depreciationTable.appendChild(row);
    });
}

function handleReset() {
    form.reset();
    depreciationTable.innerHTML = '';
    assetSummary.innerHTML = '<p>Enter asset details and click "Calculate" to see results</p>';
    document.getElementById('purchaseDate').valueAsDate = new Date();
    
    // TODO: Clear charts in Phase 3
}