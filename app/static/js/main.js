const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const loader = document.getElementById('loader');
const results = document.getElementById('results');

// Event Listeners for Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(255, 255, 255, 0.9)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
    dropZone.style.background = 'rgba(255, 255, 255, 0.5)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
    dropZone.style.background = 'rgba(255, 255, 255, 0.5)';

    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG).');
        return;
    }

    // Show Loader, Hide Results
    loader.style.display = 'block';
    results.style.display = 'none';
    dropZone.style.display = 'none'; // Hide upload to focus on results

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            renderResults(data);
        } else {
            alert('Error analyzing report: ' + (data.detail || 'Unknown error'));
            dropZone.style.display = 'block';
        }

    } catch (error) {
        console.error('Error:', error);
        alert('An network error occurred.');
        dropZone.style.display = 'block';
    } finally {
        loader.style.display = 'none';
    }
}

let healthChartInstance = null;

function renderResults(data) {
    // Summary
    document.getElementById('summaryContent').innerHTML = `<p>${data.summary}</p>`;

    // Suggestions
    let suggestionsHtml = '<ul>';
    if (Array.isArray(data.suggestions)) {
        data.suggestions.forEach(s => suggestionsHtml += `<li>${s}</li>`);
    } else {
        suggestionsHtml += `<li>${data.suggestions}</li>`;
    }
    suggestionsHtml += '</ul>';
    document.getElementById('suggestionsContent').innerHTML = suggestionsHtml;

    // Table
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    // For Chart Keys/Values
    const chartLabels = [];
    const chartValues = [];
    const chartColors = [];

    if (data.extracted_data && Array.isArray(data.extracted_data)) {
        data.extracted_data.forEach(item => {
            const tr = document.createElement('tr');

            let statusClass = 'badge-normal';
            let statusColor = '#36A2EB'; // Blue for normal

            if (item.status?.toLowerCase().includes('high')) {
                statusClass = 'badge-danger';
                statusColor = '#FF6384'; // Red for High
            }
            if (item.status?.toLowerCase().includes('low')) {
                statusClass = 'badge-warning';
                statusColor = '#FF9F40'; // Orange for Low
            }

            // Populate Table with Impact & Advice
            tr.innerHTML = `
                <td><strong>${item.parameter}</strong></td>
                <td>${item.value}</td>
                <td>${item.reference_range}</td>
                <td><span class="badge ${statusClass}">${item.status}</span></td>
                <td style="font-size: 0.9em;">
                    <strong>Impact:</strong> ${item.impact || 'N/A'}<br>
                    <div style="margin-top: 4px;"><strong>Advice:</strong> ${item.advice || 'N/A'}</div>
                </td>
            `;
            tbody.appendChild(tr);

            // Prepare Chart Data (only if numerical value exists)
            if (item.numerical_value !== null && item.numerical_value !== undefined) {
                chartLabels.push(item.parameter);
                chartValues.push(item.numerical_value);
                chartColors.push(statusColor);
            }
        });

        renderChart(chartLabels, chartValues, chartColors);
    }

    results.style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function renderChart(labels, values, colors) {
    const ctx = document.getElementById('healthChart').getContext('2d');

    // Destroy previous chart if exists
    if (healthChartInstance) {
        healthChartInstance.destroy();
    }

    healthChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Measured Values',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.2', '1')), // Solid borders
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Value' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Key Health Parameters Overview'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}
