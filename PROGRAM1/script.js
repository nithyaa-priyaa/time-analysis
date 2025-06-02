const plotDiv = document.getElementById('plot');
const statusDiv = document.getElementById('status');
const outputPreview = document.getElementById('outputPreview');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');

const panBtn = document.getElementById('panBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');

let currentMode = 'pan'; // default

// Setup initial mode on load
window.onload = () => {
  setMode('pan');
};

function setMode(mode) {
  currentMode = mode;

  panBtn.classList.toggle('active', mode === 'pan');
  zoomInBtn.classList.toggle('active', mode === 'zoom-in');
  zoomOutBtn.classList.toggle('active', mode === 'zoom-out');

  // Remove all cursor classes
  plotDiv.classList.remove('pan', 'zoom-in', 'zoom-out');

  if (mode === 'pan') {
    plotDiv.classList.add('pan');
    Plotly.relayout(plotDiv, { dragmode: 'pan' });
  } else if (mode === 'zoom-in') {
    plotDiv.classList.add('zoom-in');
    Plotly.relayout(plotDiv, { dragmode: 'zoom' });
  } else if (mode === 'zoom-out') {
    plotDiv.classList.add('zoom-out');
    Plotly.relayout(plotDiv, { dragmode: 'zoom' });
  }
}

// Buttons event listeners
panBtn.addEventListener('click', () => setMode('pan'));
zoomInBtn.addEventListener('click', () => setMode('zoom-in'));
zoomOutBtn.addEventListener('click', () => setMode('zoom-out'));
resetViewBtn.addEventListener('click', () => {
  Plotly.relayout(plotDiv, {
    'xaxis.autorange': true,
    'yaxis.autorange': true
  });
});

// Processing the input file and plotting
document.getElementById('processBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('inputFile');
  const cmd1Input = document.getElementById('cmd1').value.trim().toUpperCase();
  const cmd2Input = document.getElementById('cmd2').value.trim().toUpperCase();

  downloadSection.style.display = 'none';
  outputPreview.textContent = '';
  plotDiv.innerHTML = '';
  statusDiv.style.color = 'white';
  statusDiv.textContent = '';

  if (!fileInput.files.length) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Please upload an input file.';
    return;
  }
  if (!cmd1Input || !cmd2Input) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Please enter both CMD codes.';
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onerror = () => {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Error reading file.';
  };

  reader.onload = () => {
    const text = reader.result;
    const lines = text.split(/\r?\n/);

    function lineHasCmd(line) {
      return line.toUpperCase().includes("CMD");
    }

    const cmd1Times = [];
    const cmd2Times = [];

    let currentCmd = null;
    let currentTime = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        currentCmd = null;
        currentTime = null;
        continue;
      }

      if (lineHasCmd(line)) {
        const parts = line.split(/\s+/);
        let cmdWord = null;
        for (let j = 0; j < parts.length; j++) {
          if (parts[j].toUpperCase().startsWith("CMD")) {
            if (j + 1 < parts.length) {
              cmdWord = parts[j + 1].toUpperCase();
              break;
            }
          }
        }
        currentCmd = cmdWord;
      } else if (line.toUpperCase().startsWith("TIME")) {
        const match = line.match(/TIME\s+(\d+)/i);
        if (match) {
          currentTime = parseInt(match[1], 10);
        }

        if (currentCmd && currentTime !== null) {
          if (currentCmd === cmd1Input) {
            cmd1Times.push(currentTime);
          } else if (currentCmd === cmd2Input) {
            cmd2Times.push(currentTime);
          }
        }
      }
    }

    if (cmd1Times.length === 0) {
      statusDiv.style.color = 'red';
      statusDiv.textContent = `No occurrences of CMD1 (${cmd1Input}) found.`;
      return;
    }
    if (cmd2Times.length === 0) {
      statusDiv.style.color = 'red';
      statusDiv.textContent = `No occurrences of CMD2 (${cmd2Input}) found.`;
      return;
    }

    const minLen = Math.min(cmd1Times.length, cmd2Times.length);
    const differences = [];
    for (let i = 0; i < minLen; i++) {
      differences.push(Math.abs(cmd1Times[i] - cmd2Times[i]));
    }

    const outputData = differences.map(d => d.toString()).join('\n');
    outputPreview.textContent = outputData;

    const blob = new Blob([outputData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    downloadBtn.href = url;
    downloadSection.style.display = 'block';

    statusDiv.style.color = 'lime';
    statusDiv.textContent = `Processing complete! Found ${differences.length} pairs.`;

    // Plot using Plotly
    const trace = {
      x: [...Array(differences.length).keys()].map(i => i + 1),
      y: differences,
      mode: 'lines+markers',
      marker: { color: '#60a5fa' },
      line: { color: '#60a5fa' },
      type: 'scatter',
      name: 'Absolute Time Differences'
    };

    const layout = {
      plot_bgcolor: '#121212',
      paper_bgcolor: '#121212',
      font: { color: '#eee' },
      xaxis: {
        title: 'Pair Index',
        showgrid: true,
        zeroline: false,
        color: '#eee'
      },
      yaxis: {
        title: 'Time Difference',
        showgrid: true,
        zeroline: false,
        color: '#eee'
      },
      dragmode: currentMode === 'pan' ? 'pan' : 'zoom',
      margin: { t: 30 }
    };

    Plotly.newPlot(plotDiv, [trace], layout, {responsive: true});
  };

  reader.readAsText(file);
});
