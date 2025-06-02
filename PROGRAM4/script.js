// script.js for Program 4 - Time Difference of Multiple CMDs
// Following the logic of your C code and program2 UI/plot style from your GitHub repo

const fileInput = document.getElementById("fileInput");
const cmdInput = document.getElementById("cmdInput");
const processBtn = document.getElementById("processBtn");
const previewContainer = document.getElementById("previewContainer");
const filterButtonsContainer = document.getElementById("filterButtons");
const plotContainer = document.getElementById("plotContainer");

let cmdData = {}; // { CMD: [diffTimes] }
let selectedCmds = new Set();
let allCmds = [];

function toUpperCaseSafe(str) {
  return str.trim().toUpperCase();
}

function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

function parseCmdInput(input) {
  // split by comma or space, filter valid alphanum tokens, uppercase
  let tokens = input.split(/[\s,]+/);
  let cmds = tokens
    .map(t => t.trim())
    .filter(t => t.length > 0 && /^[0-9A-Za-z]+$/.test(t))
    .map(t => t.toUpperCase());
  return [...new Set(cmds)]; // unique cmds only
}

// Parse the input file content to extract time differences per CMD
function parseFileContent(content, cmds) {
  // Your C logic:
  // scan lines for CMD lines (contain CMD or Cmd), extract CMD word uppercase
  // scan lines for TIME lines (contain TIME or Time), extract time (int)
  // When CMD matches target, collect time values
  // Compute absolute differences of consecutive time values
  // return { cmd: [diff1, diff2, ...] }

  const lines = content.split(/\r?\n/);
  const data = {};

  cmds.forEach(cmd => {
    data[cmd] = [];
  });

  let currentCmd = "";
  let currentTime = null;
  let cmdTimes = {};
  cmds.forEach(cmd => {
    cmdTimes[cmd] = [];
  });

  for (let line of lines) {
    line = line.trim();
    if (line.toUpperCase().includes("CMD")) {
      // Extract CMD word (second token after CMD1 or CMD)
      // Example line: CMD1 FBA3 01-T-03-00
      const parts = line.split(/\s+/);
      // Find token after CMD or CMD1
      let idx = parts.findIndex(p => /^CMD\d*$/i.test(p));
      if (idx !== -1 && parts.length > idx + 1) {
        currentCmd = parts[idx + 1].toUpperCase();
      } else {
        currentCmd = "";
      }
      currentTime = null; // reset
    } else if (line.toUpperCase().includes("TIME")) {
      // Extract TIME integer (remove "μs" suffix if present)
      // Example: TIME 00542754 μs
      const parts = line.split(/\s+/);
      let timeStr = parts.find(p => /^\d+$/.test(p));
      if (!timeStr) {
        // fallback: second token usually time
        timeStr = parts[1];
      }
      if (timeStr) {
        currentTime = parseInt(timeStr, 10);
      } else {
        currentTime = null;
      }

      if (
        currentCmd &&
        currentTime !== null &&
        cmds.includes(currentCmd)
      ) {
        cmdTimes[currentCmd].push(currentTime);
      }
      // Reset currentCmd to avoid matching next time with previous cmd
      currentCmd = "";
      currentTime = null;
    }
  }

  // Now compute diffs per CMD
  cmds.forEach(cmd => {
    let times = cmdTimes[cmd];
    if (times.length < 2) {
      data[cmd] = [];
      return;
    }
    let diffs = [];
    for (let i = 1; i < times.length; i++) {
      diffs.push(Math.abs(times[i] - times[i - 1]));
    }
    data[cmd] = diffs;
  });

  return data;
}

// Create download link for a text file from string content
function createDownloadLink(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  return URL.createObjectURL(blob);
}

// Render output preview boxes with download buttons, 3 per row
function renderOutputPreviews(dataObj) {
  previewContainer.innerHTML = "";

  allCmds = Object.keys(dataObj);
  selectedCmds = new Set(allCmds);

  allCmds.forEach(cmd => {
    const diffs = dataObj[cmd];
    let textContent = "";
    if (diffs.length === 0) {
      textContent = `No time differences found for CMD ${cmd}.`;
    } else {
      textContent = diffs.map((d, i) => `Diff${i + 1}: ${d}`).join("\n");
    }

    // Create preview box
    const box = document.createElement("div");
    box.className = "preview-box";
    box.dataset.cmd = cmd;

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `CMD: ${cmd} (${diffs.length} diffs)`;
    box.appendChild(title);

    // Download button top right
    const dlBtn = document.createElement("button");
    dlBtn.className = "download-btn";
    dlBtn.textContent = "Download";
    dlBtn.title = `Download output for CMD ${cmd}`;
    dlBtn.addEventListener("click", () => {
      const filename = `output_${cmd}.txt`;
      const url = createDownloadLink(filename, textContent);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
    box.appendChild(dlBtn);

    // Preformatted text area for preview
    const pre = document.createElement("pre");
    pre.textContent = textContent;
    box.appendChild(pre);

    previewContainer.appendChild(box);
  });
}

// Render filter buttons for CMDs + All button, 3 per row grid
function renderFilterButtons(cmds) {
  filterButtonsContainer.innerHTML = "";

  function createBtn(label, active = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (active) btn.classList.add("active");
    return btn;
  }

  cmds.forEach(cmd => {
    const btn = createBtn(cmd, true);
    btn.addEventListener("click", () => {
      toggleFilter(cmd);
    });
    filterButtonsContainer.appendChild(btn);
  });

  // All button at end
  const allBtn = createBtn("All", true);
  allBtn.addEventListener("click", () => {
    // Activate all
    selectedCmds = new Set(cmds);
    updateFilterButtons();
    renderPlots(cmdData, selectedCmds);
    // Show all preview boxes
    document.querySelectorAll(".preview-box").forEach(box => {
      box.style.display = "block";
    });
  });
  filterButtonsContainer.appendChild(allBtn);

  // Store buttons references for toggling
  filterButtonsContainer.buttons = filterButtonsContainer.querySelectorAll("button");
}

function updateFilterButtons() {
  const buttons = filterButtonsContainer.querySelectorAll("button");
  buttons.forEach(btn => {
    if (btn.textContent === "All") {
      btn.classList.toggle("active", selectedCmds.size === allCmds.length);
    } else {
      btn.classList.toggle("active", selectedCmds.has(btn.textContent));
    }
  });
}

// Toggle filter for a single CMD
function toggleFilter(cmd) {
  if (selectedCmds.has(cmd)) {
    selectedCmds.delete(cmd);
  } else {
    selectedCmds.add(cmd);
  }
  if (selectedCmds.size === 0) {
    // Prevent no selection, revert
    selectedCmds.add(cmd);
  }

  updateFilterButtons();

  // Show/hide preview boxes
  document.querySelectorAll(".preview-box").forEach(box => {
    if (selectedCmds.has(box.dataset.cmd)) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });

  renderPlots(cmdData, selectedCmds);
}

// Render plots for selected CMDs using Plotly
function renderPlots(dataObj, cmdsToShow) {
  plotContainer.innerHTML = "";

  if (cmdsToShow.size === 0) {
    plotContainer.innerHTML = "<p>No CMD selected.</p>";
    return;
  }

  // For each CMD, create trace
  const traces = [];
  const colors = [
    "#00ccff", "#ff6f61", "#ffc107", "#4caf50", "#e91e63", "#9c27b0", "#3f51b5",
    "#ff5722", "#795548", "#607d8b", "#009688", "#cddc39", "#673ab7", "#f44336"
  ];

  let colorIndex = 0;

  cmdsToShow.forEach(cmd => {
    const diffs = dataObj[cmd] || [];
    if (diffs.length === 0) return;

    traces.push({
      x: diffs.map((_, i) => i + 1),
      y: diffs,
      mode: "lines+markers",
      name: `CMD ${cmd}`,
      line: { color: colors[colorIndex % colors.length], width: 3 },
      marker: { size: 8 }
    });
    colorIndex++;
  });

  if (traces.length === 0) {
    plotContainer.innerHTML = "<p>No time difference data to plot.</p>";
    return;
  }

  const layout = {
    paper_bgcolor: "#1e1e1e",
    plot_bgcolor: "#121212",
    font: { color: "#00ccff", size: 13 },
    margin: { t: 40, b: 50, l: 60, r: 20 },
    title: {
      text: "Time Differences Between Consecutive Occurrences of CMDs",
      font: { size: 18, color: "#00ccff" }
    },
    xaxis: {
      title: "Difference Number",
      gridcolor: "#333",
      zerolinecolor: "#555"
    },
    yaxis: {
      title: "Time Difference (units as in input)",
      gridcolor: "#333",
      zerolinecolor: "#555"
    },
    legend: {
      x: 1,
      xanchor: "right",
      y: 1
    }
  };

  Plotly.newPlot(plotContainer, traces, layout, { responsive: true });
}

// Main button handler
processBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select an input file (mulcmdtime.txt).");
    return;
  }
  const cmdStr = cmdInput.value;
  if (!cmdStr.trim()) {
    alert("Please enter one or more CMDs.");
    return;
  }
  const cmds = parseCmdInput(cmdStr);
  if (cmds.length === 0) {
    alert("No valid CMDs found in input.");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    cmdData = parseFileContent(content, cmds);
    renderOutputPreviews(cmdData);
    renderFilterButtons(cmds);
    renderPlots(cmdData, new Set(cmds));
  };
  reader.readAsText(file);
});
