// Helper: convert CMD to uppercase (4 chars max)
function sanitizeCmd(cmd) {
  return cmd.trim().toUpperCase().slice(0, 4);
}

// Parse input file text into array of {cmd, time}
function parseFileContent(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  let currentCmd = "";
  let currentTime = null;

  for (let line of lines) {
    line = line.trim();
    if (/^(CMD|Cmd)/.test(line)) {
      // Extract CMD after CMD1 or CMD etc.
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        currentCmd = sanitizeCmd(parts[1]);
      }
    } else if (/^TIME/.test(line)) {
      // Extract TIME as integer, ignoring μs suffix
      const m = line.match(/^TIME\s+(\d+)/);
      if (m) {
        currentTime = parseInt(m[1], 10);
        if (currentCmd && currentTime !== null) {
          entries.push({ cmd: currentCmd, time: currentTime });
          currentCmd = "";
          currentTime = null;
        }
      }
    }
  }
  return entries;
}

// Group entries into minor cycles split by first CMD encountered (e.g. FBA3)
function groupIntoMinorCycles(entries, minorCycleCount) {
  if (entries.length === 0) return [];

  const startCmd = entries[0].cmd;
  const minorCycles = [];
  let currentCycle = [];
  let cycleNumber = 1;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    // If startCmd found again and not first entry -> new minor cycle
    if (e.cmd === startCmd && i !== 0) {
      minorCycles.push(currentCycle);
      currentCycle = [];
      cycleNumber++;
      if (cycleNumber > minorCycleCount) break;
    }
    currentCycle.push(e);
  }
  if (currentCycle.length > 0 && cycleNumber <= minorCycleCount) {
    minorCycles.push(currentCycle);
  }
  return minorCycles;
}

// Generate output text for each minor cycle with time differences
function generateMinorCycleOutput(minorCycles) {
  const outputs = [];

  for (let i = 0; i < minorCycles.length; i++) {
    const cycle = minorCycles[i];
    let text = `MINOR CYCLE ${i + 1}\nCMD TIME TIME DIFFERENCE\n`;
    let prevTime = null;

    for (let j = 0; j < cycle.length; j++) {
      const { cmd, time } = cycle[j];
      let diff = 0;
      if (j === 0) {
        diff = 0;
        prevTime = time;
      } else {
        diff = Math.abs(time - prevTime);
        prevTime = time;
      }
      text += `${cmd.padEnd(7)} ${time.toString().padStart(7)} ${diff.toString().padStart(14)}\n`;
    }
    outputs.push(text);
  }
  return outputs;
}

// Create and append preview box with download button
function createPreviewBox(text, title, containerId) {
  const container = document.getElementById(containerId);
  const box = document.createElement("div");
  box.className = "preview-box";

  // Create download button
  const dlBtn = document.createElement("button");
  dlBtn.className = "download-btn";
  dlBtn.textContent = "Download";
  dlBtn.title = `Download ${title}`;
  dlBtn.onclick = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create pre element for text preview
  const pre = document.createElement("pre");
  pre.textContent = text;

  box.appendChild(dlBtn);
  box.appendChild(pre);
  container.appendChild(box);
  return box;
}

// Plot all minor cycles with buttons to toggle visibility
function plotMinorCycles(minorCycles) {
  const plotDiv = document.getElementById("plotArea");
  const controlsDiv = document.getElementById("plotControls");
  controlsDiv.innerHTML = "";

  // Prepare traces for Plotly
  const traces = minorCycles.map((cycle, idx) => {
    const x = cycle.map((_, i) => i + 1);
    const y = cycle.map((e, j) => {
      if (j === 0) return 0;
      return Math.abs(cycle[j].time - cycle[j - 1].time);
    });
    return {
      x,
      y,
      mode: "lines+markers",
      name: `Minor Cycle ${idx + 1}`,
      visible: true,
      line: { width: 2 },
    };
  });

  // Plot initial all visible
  Plotly.newPlot(plotDiv, traces, {
    title: "Time Differences per Minor Cycle",
    xaxis: { title: "Index in Minor Cycle" },
    yaxis: { title: "Absolute Time Difference (μs)" },
    legend: { orientation: "h", y: -0.2 },
    margin: { t: 40, b: 40 },
    plot_bgcolor: "#121212",
    paper_bgcolor: "#121212",
    font: { color: "#e0e0e0" },
  });

  // Create buttons for toggling minor cycles
  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = "active";
  allBtn.onclick = () => {
    // Show all traces
    const update = { visible: true };
    Plotly.restyle(plotDiv, update);
    setActiveButton(allBtn, controlsDiv);
  };
  controlsDiv.appendChild(allBtn);

  minorCycles.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = `Cycle ${i + 1}`;
    btn.onclick = () => {
      // Show only this cycle
      const visibilities = minorCycles.map((_, idx) => idx === i);
      Plotly.restyle(plotDiv, "visible", visibilities);
      setActiveButton(btn, controlsDiv);
    };
    controlsDiv.appendChild(btn);
  });

  function setActiveButton(activeBtn, container) {
    const buttons = container.querySelectorAll("button");
    buttons.forEach((b) => b.classList.remove("active"));
    activeBtn.classList.add("active");
  }
}

document.getElementById("processBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const minorCycleCountInput = document.getElementById("minorCycleCount");
  const status = document.getElementById("status");
  const combinedText = document.getElementById("combinedText");
  const minorCyclesContainer = document.getElementById("minorCyclesContainer");

  if (fileInput.files.length === 0) {
    alert("Please select an input text file.");
    return;
  }
  const minorCycleCount = parseInt(minorCycleCountInput.value, 10);
  if (isNaN(minorCycleCount) || minorCycleCount < 1) {
    alert("Please enter a valid number of minor cycles (>=1).");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    status.textContent = "Parsing input file...";
    const text = e.target.result;
    const entries = parseFileContent(text);

    if (entries.length === 0) {
      status.textContent = "No valid CMD-TIME entries found in file.";
      return;
    }
    status.textContent = `Found ${entries.length} CMD entries. Grouping into minor cycles...`;

    // Group minor cycles by startCmd (first CMD) occurrences, up to minorCycleCount
    const minorCycles = groupIntoMinorCycles(entries, minorCycleCount);

    status.textContent = `Grouped into ${minorCycles.length} minor cycles. Generating outputs...`;

    // Generate text outputs per minor cycle
    const outputs = generateMinorCycleOutput(minorCycles);

    // Show combined output in one block
    const combinedOutput = outputs.join("\n");
    combinedText.textContent = combinedOutput;

    // Add download for combined output
    document.getElementById("downloadCombined").onclick = () => {
      const blob = new Blob([combinedOutput], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Combined_MinorCycles_Output.txt";
      a.click();
      URL.revokeObjectURL(url);
    };

    // Clear previous minor cycles preview
    minorCyclesContainer.innerHTML = "";

    // Create preview boxes for each minor cycle (3 per row by CSS grid)
    outputs.forEach((txt, idx) => {
      const box = document.createElement("div");
      box.className = "preview-box";

      const dlBtn = document.createElement("button");
      dlBtn.className = "download-btn";
      dlBtn.textContent = "Download";
      dlBtn.title = `Download Minor Cycle ${idx + 1} Output`;
      dlBtn.onclick = () => {
        const blob = new Blob([txt], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `MinorCycle_${idx + 1}_Output.txt`;
        a.click();
        URL.revokeObjectURL(url);
      };

      const pre = document.createElement("pre");
      pre.textContent = txt;

      box.appendChild(dlBtn);
      box.appendChild(pre);

      minorCyclesContainer.appendChild(box);
    });

    // Plot minor cycles time differences
    plotMinorCycles(minorCycles);

    status.textContent = "Processing complete.";
  };

  reader.readAsText(file);
});