function hexToBin(hex) {
    return parseInt(hex, 16).toString(2).padStart(4, '0');
}

function binToHex(bin) {
    return parseInt(bin, 2).toString(16).toUpperCase();
}

function decodeCMD() {
    const hexInput = document.getElementById("hexInput").value.trim().toUpperCase();
    const resultBox = document.getElementById("decodeResult");
    resultBox.textContent = "";

    if (hexInput.length !== 4 || !/^[0-9A-F]{4}$/i.test(hexInput)) {
        resultBox.innerHTML = "<span style='color: red;'>❌ Please enter a valid 4-digit hexadecimal CMD (e.g., FBA3)</span>";
        return;
    }

    const binary = [...hexInput].map(hexToBin).join('');

    const rt = parseInt(binary.slice(0, 5), 2);
    const txrx = parseInt(binary.slice(5, 6), 2);
    const sa = parseInt(binary.slice(6, 11), 2);
    const wc = parseInt(binary.slice(11, 16), 2);

    resultBox.innerHTML =
        `<span style='color: #7cc9c9;'>✅ Decoded CMD Word:<br>` +
        `RT Count: ${rt}<br>` +
        `Tx/Rx: ${txrx} [${txrx === 0 ? "Rx" : "Tx"}]<br>` +
        `SubAddress (SA): ${sa}<br>` +
        `WordCount (WC): ${wc}</span>`;
}

function encodeCMD() {
    const rtValue = document.getElementById("rt").value.trim();
    const saValue = document.getElementById("sa").value.trim();
    const wcValue = document.getElementById("wc").value.trim();
    const txrxValue = document.getElementById("txrxText").value.trim();
    const resultBox = document.getElementById("encodeResult");

    resultBox.innerHTML = "";

    // Check for empty fields
    if (rtValue === "") {
        resultBox.innerHTML = "<span style='color: red;'>❌ Please fill in the \"RT\" field.</span>";
        return;
    }
    if (txrxValue === "") {
        resultBox.innerHTML = "<span style='color: red;'>❌ Please fill in the \"Rx/Tx\" field.</span>";
        return;
    }
    if (saValue === "") {
        resultBox.innerHTML = "<span style='color: red;'>❌ Please fill in the \"SA\" field.</span>";
        return;
    }
    if (wcValue === "") {
        resultBox.innerHTML = "<span style='color: red;'>❌ Please fill in the \"WC\" field.</span>";
        return;
    }

    // Parse integers and validate ranges
    const rt = parseInt(rtValue, 10);
    const txrx = parseInt(txrxValue, 10);
    const sa = parseInt(saValue, 10);
    const wc = parseInt(wcValue, 10);

    if (isNaN(rt) || rt < 0 || rt > 31) {
        resultBox.innerHTML = "<span style='color: red;'>❌ RT must be an integer between 0 and 31.</span>";
        return;
    }
    if (txrx !== 0 && txrx !== 1) {
        resultBox.innerHTML = "<span style='color: red;'>❌ Rx/Tx must be 0 (Rx) or 1 (Tx).</span>";
        return;
    }
    if (isNaN(sa) || sa < 0 || sa > 31) {
        resultBox.innerHTML = "<span style='color: red;'>❌ SA must be an integer between 0 and 31.</span>";
        return;
    }
    if (isNaN(wc) || wc < 0 || wc > 31) {
        resultBox.innerHTML = "<span style='color: red;'>❌ WC must be an integer between 0 and 31.</span>";
        return;
    }

    // Compose binary string (5 + 1 + 5 + 5 = 16 bits)
    const rtBin = rt.toString(2).padStart(5, '0');
    const txrxBin = txrx.toString(2).padStart(1, '0');
    const saBin = sa.toString(2).padStart(5, '0');
    const wcBin = wc.toString(2).padStart(5, '0');

    const binary = rtBin + txrxBin + saBin + wcBin;
    const hex = parseInt(binary, 2).toString(16).toUpperCase().padStart(4, '0');

    resultBox.innerHTML = `<span style='color: #7cc9c9;'>✅ Encoded CMD Word: <code>${hex}</code></span>`;
}
