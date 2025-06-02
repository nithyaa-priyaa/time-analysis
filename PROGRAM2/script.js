let mc1 = [], mc2 = [], mc3 = [], mc4 = [];
let chartData = null;

document.getElementById("processBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput").files[0];
  const cmdInput = document.getElementById("cmdInput").value.trim().toUpperCase();

  if (!fileInput || !cmdInput) {
    alert("Please select a file and enter a CMD.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n");
    const cmd1List = [];
    const cmd2List = [];
    let currentCmd = "";
    let currentTime = 0;
    let lastNonFBA3 = { cmd: "", time: 0 };
    let seenFirstFBA3 = false;

    for (let line of lines) {
      line = line.trim();
      if (/CMD|Cmd/.test(line)) {
        const match = line.match(/\b([0-9A-Fa-f]{4})\b/);
        if (match) currentCmd = match[1].toUpperCase();
      }

      if (/TIME/.test(line)) {
        const timeMatch = line.match(/(\d+)/);
        if (timeMatch) {
          currentTime = parseInt(timeMatch[1]);

          if (currentCmd === cmdInput) {
            cmd1List.push({ cmd: currentCmd, time: currentTime });
          }

          if (currentCmd === "FBA3") {
            if (seenFirstFBA3) {
              cmd2List.push({ ...lastNonFBA3 });
            } else {
              seenFirstFBA3 = true;
            }
          } else {
            lastNonFBA3 = { cmd: currentCmd, time: currentTime };
          }

          currentCmd = "";
          currentTime = 0;
        }
      }
    }

    const minLen = Math.min(cmd1List.length, cmd2List.length);
    mc1 = [];
    mc2 = [];
    mc3 = [];
    mc4 = [];
    const all = [];

    for (let i = 0; i < minLen; i++) {
      const diff = Math.abs(cmd1List[i].time - cmd2List[i].time);
      all.push(diff);
      if (i % 4 === 0) mc1.push(diff);
      if (i % 4 === 1) mc2.push(diff);
      if (i % 4 === 2) mc3.push(diff);
      if (i % 4 === 3) mc4.push(diff);
    }

    displayOutput("outputAll", all);
    displayOutput("outputMC1", mc1);
    displayOutput("outputMC2", mc2);
    displayOutput("outputMC3", mc3);
    displayOutput("outputMC4", mc4);

    setupDownload("downloadAll", all, "all_output.txt");
    setupDownload("downloadMC1", mc1, "mc1.txt");
    setupDownload("downloadMC2", mc2, "mc2.txt");
    setupDownload("downloadMC3", mc3, "mc3.txt");
    setupDownload("downloadMC4", mc4, "mc4.txt");

    plotData(mc1, mc2, mc3, mc4);
  };

  reader.readAsText(fileInput);
});

function displayOutput(elementId, data) {
  document.getElementById(elementId).textContent = data.join("\n");
}

function setupDownload(buttonId, data, filename) {
  document.getElementById(buttonId).onclick = () => {
    const blob = new Blob([data.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
  };
}

function plotData(mc1, mc2, mc3, mc4) {
  const maxLen = Math.max(mc1.length, mc2.length, mc3.length, mc4.length);
  const labels = Array.from({ length: maxLen }, (_, i) => i + 1);

  const data = [
    { x: labels, y: mc1, mode: 'lines+markers', name: 'MC1', line: { color: 'red' } },
    { x: labels, y: mc2, mode: 'lines+markers', name: 'MC2', line: { color: 'green' } },
    { x: labels, y: mc3, mode: 'lines+markers', name: 'MC3', line: { color: 'blue' } },
    { x: labels, y: mc4, mode: 'lines+markers', name: 'MC4', line: { color: 'orange' } },
  ];

  const layout = {
    title: 'Minor Cycle Loads',
    xaxis: { title: 'Cycle Number' },
    yaxis: { title: 'Time Difference (μs)', zeroline: true },
    hovermode: 'x unified',
  };

  Plotly.newPlot('plotCanvas', data, layout, { responsive: true });
}

// Zoom controls for Plotly
document.getElementById("zoomIn").addEventListener("click", () => {
  Plotly.relayout('plotCanvas', {
    'xaxis.range[0]': null,
    'xaxis.range[1]': null,
    'yaxis.range[0]': null,
    'yaxis.range[1]': null
  });
  Plotly.Plots.resize('plotCanvas'); // just reset zoom (reset button does this)
});

document.getElementById("zoomOut").addEventListener("click", () => {
  // This can zoom out by extending axis ranges manually:
  Plotly.relayout('plotCanvas', {
    'xaxis.autorange': true,
    'yaxis.autorange': true
  });
});

document.getElementById("reset").addEventListener("click", () => {
  Plotly.relayout('plotCanvas', {
    'xaxis.autorange': true,
    'yaxis.autorange': true
  });
});
