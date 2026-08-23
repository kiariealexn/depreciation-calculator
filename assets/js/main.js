function handleCalculate(event) {
    event.preventDefault();
    console.log('📝 Form submitted!');
    
    // Get form values - allow decimals
    const assetData = {
        name: document.getElementById('assetName').value.trim(),
        // Use parseFloat for all numeric values to accept decimals
        cost: parseFloat(document.getElementById('assetCost').value),
        salvageValue: parseFloat(document.getElementById('salvageValue').value),
        usefulLife: parseFloat(document.getElementById('usefulLife').value), // Changed to parseFloat
        purchaseDate: document.getElementById('purchaseDate').value
    };
    
    // Get selected methods
    const selectedMethods = Array.from(document.querySelectorAll('input[name="method"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Enhanced validation section with decimal support
    const errors = [];

    if (!assetData.name) {
        errors.push("Please enter an asset name");
    }

    // Cost validation - allow decimals
    if (isNaN(assetData.cost) || assetData.cost <= 0) {
        errors.push("Please enter a valid positive cost amount (e.g., 10000.00)");
    }

    // Salvage validation - allow decimals
    if (isNaN(assetData.salvageValue) || assetData.salvageValue < 0) {
        errors.push("Salvage value cannot be negative");
    }

    if (assetData.salvageValue > assetData.cost) {
        errors.push("Salvage value cannot exceed asset cost");
    }

    // Useful life validation - allow 1 decimal place
    if (isNaN(assetData.usefulLife) || assetData.usefulLife < 0.1) {
        errors.push("Useful life must be at least 0.1 years (minimum 1 month)");
    }

    if (assetData.usefulLife > 50) {
        errors.push("Useful life cannot exceed 50 years");
    }

    // Validate decimal precision
    const usefulLifeDecimals = assetData.usefulLife.toString().split('.')[1];
    if (usefulLifeDecimals && usefulLifeDecimals.length > 1) {
        errors.push("Useful life can only have one decimal place (e.g., 5.5 years)");
    }

    // CPA Exam standard: useful life should be reasonable
    if (assetData.usefulLife > 30 && assetData.cost < 100000) {
        errors.push("Useful life seems unusually long for this asset value");
    }

    if (selectedMethods.length === 0) {
        errors.push("Please select at least one depreciation method");
    }
    
    // Handle validation errors
    if (errors.length > 0) {
        showErrors(errors);
        return;
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
    
    // NEW: Calculate Sum-of-the-Years-Digits if selected
    if (selectedMethods.includes('sumOfYearsDigits')) {
        results.sumOfYearsDigits = calculateSumOfYearsDigits(assetData);
    }
    
    // Display results
    displayResults(results);
    
    // Initialize charts with the new charting system
    initializeAdvancedCharts(results, assetData);
} 

// ===== REST OF FUNCTIONS =====

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

/**
 * NEW: Initialize advanced depreciation comparison charts
 * Replaces the old placeholder chart system with production-grade Chart.js visualizations
 */
function initializeAdvancedCharts(results, assetData) {
    console.log('📊 Initializing advanced depreciation charts...');
    
    if (Object.keys(results).length === 0) return;
    
    // Extract chart data from results
    const chartData = extractChartData(results, assetData);
    
    if (!chartData) {
        console.error('Could not extract chart data');
        return;
    }
    
    // Initialize each chart
    initializeAnnualExpenseChart(chartData);
    initializeBookValueChart(chartData);
    initializeCumulativeDepreciationChart(chartData);
}

/**
 * Extract chart-ready data from calculation results
 */
function extractChartData(results, assetData) {
    const methodNames = [];
    const methodData = {};
    
    // Collect data from each method
    const methodMap = {
        'straightLine': 'Straight-Line',
        'decliningBalance200': 'DB 200%',
        'decliningBalance150': 'DB 150%',
        'sumOfYearsDigits': 'SYD'
    };
    
    Object.entries(results).forEach(([key, result]) => {
        const displayName = methodMap[key] || result.method;
        methodNames.push(displayName);
        methodData[displayName] = result.schedule;
    });
    
    if (methodNames.length === 0) return null;
    
    // Get year labels from the first method
    const firstMethod = Object.values(results)[0];
    const yearLabels = firstMethod.schedule.map(row => {
        if (typeof row.year === 'string' && row.year.includes('*')) {
            return row.year;
        }
        return `Year ${row.year}`;
    });
    
    return {
        yearLabels,
        methodNames,
        methodData,
        cost: assetData.cost,
        salvageValue: assetData.salvageValue,
        usefulLife: assetData.usefulLife
    };
}

// Chart instances (global scope for management)
let depreciationCharts = {
    expenseChart: null,
    bookValueChart: null,
    cumulativeChart: null
};

/**
 * Create Annual Depreciation Expense Chart
 */
function initializeAnnualExpenseChart(chartData) {
    const canvasId = 'depreciationChart';
    let canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.warn(`Canvas ${canvasId} not found, skipping annual expense chart`);
        return;
    }
    
    // Destroy existing chart if it exists
    if (depreciationCharts.expenseChart) {
        depreciationCharts.expenseChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Prepare datasets for each method
    const datasets = [];
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981']; // Blue, Red, Amber, Green
    
    let colorIndex = 0;
    chartData.methodNames.forEach(methodName => {
        const expenses = chartData.methodData[methodName].map(row => row.depreciationExpense);
        const borderColor = colors[colorIndex % colors.length];
        
        datasets.push({
            label: methodName,
            data: expenses,
            borderColor: borderColor,
            backgroundColor: borderColor + '20', // Add transparency
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true
        });
        
        colorIndex++;
    });
    
    depreciationCharts.expenseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.yearLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Annual Depreciation Expense by Method',
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { padding: 20, font: { size: 12 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Year' },
                    grid: { drawBorder: false }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Depreciation Expense ($)' },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create Book Value Over Time Chart
 */
function initializeBookValueChart(chartData) {
    // Note: For now, this prepares the structure for future expansion
    // Additional canvases can be added to HTML to display this chart
    console.log('📊 Book value chart data prepared');
}

/**
 * Create Cumulative Depreciation Chart
 */
function initializeCumulativeDepreciationChart(chartData) {
    // Note: For now, this prepares the structure for future expansion
    // Additional canvases can be added to HTML to display this chart
    console.log('📊 Cumulative depreciation chart data prepared');
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
    console.log('- calculateSumOfYearsDigits:', typeof calculateSumOfYearsDigits);
    console.log('- initializeAdvancedCharts:', typeof initializeAdvancedCharts);
});
