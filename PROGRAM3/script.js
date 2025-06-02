let mcData = [[], [], [], []];

document.getElementById('processBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const cmdInput = document.getElementById('cmdInput').value.trim().toUpperCase();
  const status = document.getElementById('status');
  const allDiffOutput = document.getElementById('allDiffOutput');
  const plotDiv = document.getElementById('plotDiv');
  const mcPreviews = document.getElementById('mcPreviews');

  allDiffOutput.value = '';
  plotDiv.innerHTML = '';
  mcPreviews.innerHTML = '';
  mcData = [[], [], [], []];
  status.textContent = '';

  if (!fileInput.files[0]) {
    alert('Please select an input file.');
    return;
  }
  if (!cmdInput) {
    alert('Please enter a CMD code.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    try {
      const { allDiffs, MC } = processCmdDifferences(text, cmdInput);
      if (allDiffs.length < 2) {
        status.textContent = 'Not enough occurrences of CMD found to calculate differences.';
        return;
      }
      mcData = MC;
      allDiffOutput.value = allDiffs.join('\n');
      plotMinorCycles(MC);
      status.textContent = 'Processing complete. View/download MC1-MC4 or check the plot below.';
    } catch (err) {
      status.textContent = 'Error processing file: ' + err.message;
    }
  };
  reader.readAsText(fileInput.files[0]);
});

document.querySelectorAll('.mc-btn').forEach(button => {
  button.addEventListener('click', () => {
    const index = parseInt(button.dataset.index);
    const previewDiv = document.createElement('div');
    previewDiv.className = 'mc-preview';
    previewDiv.innerHTML = `
      <a class="download-top" href="${createBlobLink(mcData[index])}" download="MC${index + 1}.txt">Download</a>
      ${mcData[index].join('\n')}
    `;
    const previews = document.getElementById('mcPreviews');
    previews.innerHTML = ''; // replace previous
    previews.appendChild(previewDiv);
  });
});

function createBlobLink(content) {
  const blob = new Blob([content.join('\n')], { type: 'text/plain' });
  return URL.createObjectURL(blob);
}

function processCmdDifferences(text, cmdInput) {
  const lines = text.split(/\r?\n/);
  let cmdTimes = [];
  let currentCmd = '';
  let currentTime = null;

  for (let line of lines) {
    line = line.trim();
    if (line.toUpperCase().startsWith('CMD')) {
      const parts = line.split(/\s+/);
      currentCmd = parts.length > 1 ? parts[1].toUpperCase() : '';
    } else if (line.toUpperCase().startsWith('TIME')) {
      const parts = line.split(/\s+/);
      if (parts.length > 1) {
        const t = parseInt(parts[1]);
        if (!isNaN(t)) {
          currentTime = t;
          if (currentCmd === cmdInput) {
            cmdTimes.push(currentTime);
          }
          currentCmd = '';
          currentTime = null;
        }
      }
    }
  }

  let allDiffs = [];
  for (let i = 1; i < cmdTimes.length; i++) {
    allDiffs.push(Math.abs(cmdTimes[i] - cmdTimes[i - 1]));
  }

  let MC = [[], [], [], []];
  for (let i = 0; i < allDiffs.length; i++) {
    MC[i % 4].push(allDiffs[i]);
  }

  return { allDiffs, MC };
}

function plotMinorCycles(MC) {
  const traces = MC.map((arr, i) => ({
    x: arr.map((_, idx) => idx + 1),
    y: arr,
    type: 'scatter',
    mode: 'lines+markers',
    name: `MC${i + 1}`,
    xaxis: 'x' + (i + 1),
    yaxis: 'y' + (i + 1)
  }));

  const layout = {
    grid: { rows: 4, columns: 1, pattern: 'independent', roworder: 'top to bottom' },
    height: 700,
    title: 'Minor Cycles Time Differences (MC1 to MC4)',
    showlegend: false,
    margin: { t: 50, b: 40, l: 50, r: 30 },
    xaxis: { title: 'Occurrence Number' },
    yaxis: { title: 'Time Difference (μs)' },
    xaxis2: { title: 'Occurrence Number' },
    yaxis2: { title: 'Time Difference (μs)' },
    xaxis3: { title: 'Occurrence Number' },
    yaxis3: { title: 'Time Difference (μs)' },
    xaxis4: { title: 'Occurrence Number' },
    yaxis4: { title: 'Time Difference (μs)' }
  };

  Plotly.newPlot('plotDiv', traces, layout, { responsive: true });
}
