// Global variable to store data
let globalData = null;

// Constants for the sample data URL
const SAMPLE_DATA_URL = "https://2u-data-curriculum-team.s3.amazonaws.com/dataviz-classroom/v1.1/14-Interactive-Web-Visualizations/02-Homework/samples.json";

// Event listener for loading sample data button
document.getElementById('loadSampleBtn').addEventListener('click', function() {
    // Show loading indicator
    document.getElementById('loadingIndicator').style.display = 'block';
    
    // Fetch sample data
    fetch(SAMPLE_DATA_URL)
        .then(response => response.json())
        .then(data => {
            globalData = data;
            // Hide loading indicator
            document.getElementById('loadingIndicator').style.display = 'none';
            // Initialize dashboard with the loaded data
            initializeDashboard();
        })
        .catch(error => {
            alert('Error loading sample data: ' + error.message);
            document.getElementById('loadingIndicator').style.display = 'none';
        });
});

// Initialize the dashboard with loaded data
function initializeDashboard() {
    if (!globalData) return;
 
    // Populate the dropdown
    let selector = d3.select("#selDataset");
    selector.html(""); // Clear existing options
 
    globalData.names.forEach((sample) => {
        selector
            .append("option")
            .text(sample)
            .property("value", sample);
    });
 
    // Use the first sample to build initial plots
    const firstSample = globalData.names[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
}
 
// Function to build metadata panel
function buildMetadata(sample) {
    if (!globalData) return;
 
    let metadata = globalData.metadata;
    let resultArray = metadata.filter(sampleObj => sampleObj.id == sample);
    let result = resultArray[0];
    let PANEL = d3.select("#sample-metadata");
 
    // Clear existing metadata
    PANEL.html("");
 
    // Add each key-value pair
    Object.entries(result).forEach(([key, value]) => {
        PANEL.append("h6").text(`${key.toUpperCase()}: ${value}`);
    });
 
    // Build gauge chart
    buildGaugeChart(result.wfreq);
}
 
// Function to build gauge chart
function buildGaugeChart(wfreq) {
    let gaugeData = [{
        domain: { x: [0, 1], y: [0, 1] },
        value: wfreq,
        title: { text: "Belly Button Washing Frequency<br>Scrubs per Week" },
        type: "indicator",
        mode: "gauge+number",
        gauge: {
            axis: { range: [null, 9] },
            bar: { color: "darkblue" },
            steps: [
                { range: [0, 1], color: "#f8f3ec" },
                { range: [1, 2], color: "#f4f1e4" },
                { range: [2, 3], color: "#e9e6ca" },
                { range: [3, 4], color: "#e5e7b2" },
                { range: [4, 5], color: "#d5e49d" },
                { range: [5, 6], color: "#b7cc8f" },
                { range: [6, 7], color: "#8cbf88" },
                { range: [7, 8], color: "#8abb8f" },
                { range: [8, 9], color: "#85b48a" }
            ],
            threshold: {
                line: { color: "red", width: 4 },
                thickness: 0.75,
                value: wfreq
            }
        }
    }];
 
    let gaugeLayout = {
        width: 350,
        height: 300,
        margin: { t: 25, r: 25, l: 25, b: 25 }
    };
 
    Plotly.newPlot('gauge', gaugeData, gaugeLayout);
}
 
// Function to build all charts
function buildCharts(sample) {
    if (!globalData) return;
 
    let samples = globalData.samples;
    let resultArray = samples.filter(sampleObj => sampleObj.id == sample);
    let result = resultArray[0];
 
    let otu_ids = result.otu_ids;
    let otu_labels = result.otu_labels;
    let sample_values = result.sample_values;
 
    // Bar Chart
    let barData = [{
        y: otu_ids.slice(0, 10).map(otuID => `OTU ${otuID}`).reverse(),
        x: sample_values.slice(0, 10).reverse(),
        text: otu_labels.slice(0, 10).reverse(),
        type: "bar",
        orientation: "h",
        marker: {
            color: 'rgb(31, 119, 180)',
            opacity: 0.8
        }
    }];
 
    let barLayout = {
        title: "Top 10 Bacteria Cultures Found",
        margin: { t: 30, l: 150 },
        xaxis: { title: "Sample Values" },
        yaxis: { automargin: true }
    };
 
    Plotly.newPlot("bar", barData, barLayout);
 
    // Bubble Chart
    let bubbleData = [{
        x: otu_ids,
        y: sample_values,
        text: otu_labels,
        mode: 'markers',
        marker: {
            size: sample_values,
            color: otu_ids,
            colorscale: 'Earth'
        }
    }];
 
    let bubbleLayout = {
        title: 'Bacteria Cultures Per Sample',
        xaxis: { title: 'OTU ID' },
        yaxis: { title: 'Sample Values' },
        showlegend: false,
        height: 500,
        width: 1000
    };
 
    Plotly.newPlot('bubble', bubbleData, bubbleLayout);
 
    // Pie Chart
    let pieData = [{
        values: sample_values.slice(0, 5),
        labels: otu_ids.slice(0, 5).map(id => `OTU ${id}`),
        text: otu_labels.slice(0, 5),
        type: 'pie',
        hoverinfo: 'label+percent+text'
    }];
 
    let pieLayout = {
        title: 'Top 5 Bacteria Distribution'
    };
 
    Plotly.newPlot('pie', pieData, pieLayout);
}

// Function to handle dropdown changes
function optionChanged(newSample) {
    buildCharts(newSample);
    buildMetadata(newSample);
}
