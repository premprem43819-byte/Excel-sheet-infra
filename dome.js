"use strict";

const DRAFT_KEY = "sri_sawdamman_material_input_v1";
const MIN_ROWS = 12;

const tbody = document.getElementById("tbody");
const grandTotalEl = document.getElementById("grandTotal");
const statusDot = document.getElementById("statusDot");
const statusTxt = document.getElementById("statusText");
const printArea = document.getElementById("printArea");

const docDateInput = document.getElementById("docDate");
const dayText = document.getElementById("dayText");
const weekText = document.getElementById("weekText");
const monthText = document.getElementById("monthText");

let selectedDate = new Date();
function pad(n) {
  return String(n).padStart(2, "0");}
function money(v) {
  return "₹ " + (+v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function dateToDMY(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function dmyToDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || "").trim());
  if (!m) return null;

  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (
    d.getFullYear() !== +m[3] ||
    d.getMonth() !== +m[2] - 1 ||
    d.getDate() !== +m[1]
  ) {
    return null;
  }

  return d;
}

function formatDateValue(v) {
  const digits = String(v || "").replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);

  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

function autoSlashDate(input) {
  input.value = formatDateValue(input.value);
}

function todayDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayName(d) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
}

function monthName(d) {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ][d.getMonth()];
}

/* Week 1 to Week 4 for every month:
   1–7 = Week 1
   8–14 = Week 2
   15–21 = Week 3
   22–Month End = Week 4
*/
function monthWeekName(d) {
  const date = d.getDate();

  if (date <= 7) return "Week 1";
  if (date <= 14) return "Week 2";
  if (date <= 21) return "Week 3";

  return "Week 4";
}

function updateDateNavigation(save = true) {
  docDateInput.value = dateToDMY(selectedDate);
  dayText.textContent = dayName(selectedDate);
  weekText.textContent = monthWeekName(selectedDate);
  monthText.textContent = monthName(selectedDate);

  if (save) saveDraft();
}

function setStatus(msg, cls = "") {
  statusTxt.textContent = msg;
  statusDot.className = "status-dot" + (cls ? " " + cls : "");
}

let toastTimer;

function showToast(msg, cls = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "show" + (cls ? " " + cls : "");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
  }, 2400);
}

function parseNum(v) {
  return parseFloat(String(v || "").replace(/[^0-9.]/g, "")) || 0;
}

function makeRow(data = {}) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="sn">1</td>
    <td>
      <input type="text" class="rdate" placeholder="DD/MM/YYYY" maxlength="10" inputmode="numeric" autocomplete="off" value="${esc(data.date || "")}">
    </td>
    <td>
      <input type="text" class="rmat" placeholder="Material…" value="${esc(data.material || "")}">
    </td>
    <td>
      <input type="number" class="rqty" placeholder="0" min="0" step="0.01" inputmode="decimal" value="${esc(data.qty || "")}">
    </td>
    <td>
      <input type="number" class="rprice" placeholder="0.00" min="0" step="0.01" inputmode="decimal" value="${esc(data.price || "")}">
    </td>
    <td class="rtotal empty">—</td>
    <td class="rdel">
      <button class="dbtn" type="button">×</button>
    </td>
  `;

  bindRow(tr);
  return tr;
}

function addRow(data = {}) {
  tbody.appendChild(makeRow(data));
  renumber();
  updateTotals();
}

function renumber() {
  [...tbody.rows].forEach((row, i) => {
    row.querySelector(".sn").textContent = i + 1;
  });
}

function rowHasData(row) {
  return [...row.querySelectorAll("input")].some(input => input.value.trim());
}

function updateTotals() {
  let grand = 0;

  [...tbody.rows].forEach(row => {
    const q = parseNum(row.querySelector(".rqty").value);
    const p = parseNum(row.querySelector(".rprice").value);
    const total = q * p;
    const totalCell = row.querySelector(".rtotal");

    if (total > 0) {
      totalCell.textContent = money(total);
      totalCell.className = "rtotal";
      grand += total;
    } else {
      totalCell.textContent = "—";
      totalCell.className = "rtotal empty";
    }
  });

  grandTotalEl.textContent = money(grand);
}

function bindRow(row) {
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      if (input.classList.contains("rdate")) autoSlashDate(input);
      updateTotals();
      debouncedSave();
    });

    input.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;

      e.preventDefault();

      const allInputs = [...document.querySelectorAll("#receiptTable input")];
      const i = allInputs.indexOf(input);

      if (i >= 0 && i < allInputs.length - 1) {
        allInputs[i + 1].focus();
      }
    });
  });

  row.querySelector(".dbtn").addEventListener("click", () => {
    if (tbody.rows.length === 1) {
      row.querySelectorAll("input").forEach(i => (i.value = ""));
    } else {
      row.remove();
    }

    renumber();
    updateTotals();
    saveDraft();
  });
}

function readInfo() {
  const info = {};

  document.querySelectorAll("[data-key]").forEach(el => {
    info[el.dataset.key] = el.value;
  });

  info.day = dayName(selectedDate);
  info.week = monthWeekName(selectedDate);
  info.month = monthName(selectedDate);

  return info;
}

function writeInfo(info = {}) {
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.dataset.key;

    if (Object.prototype.hasOwnProperty.call(info, key)) {
      el.value = info[key];
    }
  });

  if (info.docDate) {
    const d = dmyToDate(info.docDate);

    if (d) {
      selectedDate = d;
    }
  }

  updateDateNavigation(false);
}

function readRows(all = true) {
  return [...tbody.rows]
    .map(row => ({
      date: row.querySelector(".rdate").value.trim(),
      material: row.querySelector(".rmat").value.trim(),
      qty: row.querySelector(".rqty").value.trim(),
      price: row.querySelector(".rprice").value.trim()
    }))
    .filter(row => all || row.date || row.material || row.qty || row.price);
}

function saveDraft() {
  try {
    setStatus("Saving…", "saving");

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        info: readInfo(),
        rows: readRows(true),
        selectedDate: dateToDMY(selectedDate),
        ts: Date.now()
      })
    );

    setStatus("Saved", "saved");
  } catch (e) {
    setStatus("Save failed");
  }
}

const debouncedSave = debounce(saveDraft, 450);

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);

    if (data.selectedDate) {
      const d = dmyToDate(data.selectedDate);
      if (d) selectedDate = d;
    }

    if (data.info) writeInfo(data.info);

    tbody.innerHTML = "";

    if (Array.isArray(data.rows) && data.rows.length) {
      data.rows.forEach(row => addRow(row));
    }

    while (tbody.rows.length < MIN_ROWS) {
      addRow();
    }

    updateTotals();
    setStatus("Draft restored", "saved");
    return true;
  } catch (e) {
    return false;
  }
}

function clearAll() {
  if (!confirm("Clear all receipt data?")) return;

  localStorage.removeItem(DRAFT_KEY);
  selectedDate = todayDate();

  writeInfo({
    from: "",
    to: "",
    docDate: dateToDMY(selectedDate),
    voucherNo: "",
    vehicleNo: "",
    driverName: "",
    place1: "Kendaigoundanur",
    place2: "Sullerumbu",
    place3: "Dindigul, Tamilnadu 624710",
    cell1: "7904689983",
    cell2: "6369477188"
  });

  tbody.innerHTML = "";

  for (let i = 0; i < MIN_ROWS; i++) {
    addRow();
  }

  updateTotals();
  saveDraft();
  showToast("Receipt cleared", "ok");
}

document.getElementById("addRowBtn").addEventListener("click", () => {
  addRow({ date: dateToDMY(selectedDate) });
  saveDraft();

  setTimeout(() => {
    tbody.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
});

document.getElementById("clearBtn").addEventListener("click", clearAll);

document.getElementById("prevDay").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  updateDateNavigation();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  selectedDate = todayDate();
  updateDateNavigation();
});

document.getElementById("nextDay").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  updateDateNavigation();
});

document.getElementById("prevWeek").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 7);
  updateDateNavigation();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 7);
  updateDateNavigation();
});

document.getElementById("prevMonth").addEventListener("click", () => {
  selectedDate.setMonth(selectedDate.getMonth() - 1);
  updateDateNavigation();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  selectedDate.setMonth(selectedDate.getMonth() + 1);
  updateDateNavigation();
});

docDateInput.addEventListener("input", () => {
  autoSlashDate(docDateInput);

  const d = dmyToDate(docDateInput.value);
  if (d) {
    selectedDate = d;
    updateDateNavigation();
  }

  debouncedSave();
});

document.addEventListener("input", e => {
  if (e.target.matches("[data-key]") && e.target.id !== "docDate") {
    debouncedSave();
  }
});

/* PRINT + PDF */

const PRINT_CSS = `
@page {
  size: A4 portrait;
  margin: 5mm;
}

html,
body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  color: #000 !important;
  font-family: Arial, "Nirmala UI", Latha, sans-serif !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

* {
  box-sizing: border-box !important;
  color: #000 !important;
  background: #fff !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.pp {
  width: 200mm;
  height: 287mm;
  min-height: 287mm;
  margin: 0 auto;
  border: 1.2px solid #000;
  display: flex;
  flex-direction: column;
  overflow: visible;
  background: #fff;
}

.pp-title {
  text-align: center;
  padding: 14px 4px 10px;
  border-bottom: 1.2px solid #000;
  overflow: visible;
}

.pp-title h1 {
  margin: 0;
  padding-top: 4px;
  font-size: 36px;
  line-height: 1.35;
  font-style: italic;
  font-weight: 950;
  overflow: visible;
}

.pp-title .sub {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 1.4px;
}

.pp table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.pp td,
.pp th {
  border: 0.9px solid #000;
  padding: 4px 5px;
  font-size: 17px;
  line-height: 1.15;
  vertical-align: middle;
  word-break: normal;
  overflow-wrap: normal;
}

.pp th,
.pp-lbl {
  text-align: center;
  font-weight: 950;
  white-space: nowrap;
}

.pp-meta td {
  height: 8mm;
  font-size: 16px;
}

.pp-info td {
  height: 9mm;
  font-size: 18px;
}

.pp-mat {
  text-align: center;
  font-size: 18px !important;
  font-weight: 950;
  letter-spacing: 0.8px;
}

.pp-dwm {
  text-align: center;
  font-size: 17px !important;
  font-weight: 900;
}

.pp-items th {
  height: 8mm;
  font-size: 19px;
}

.pp-items td {
  height: 11mm;
  font-size: 18px;
}

.pp-items td:nth-child(1),
.pp-items td:nth-child(2),
.pp-items td:nth-child(4),
.pp-items td:nth-child(5),
.pp-items td:nth-child(6) {
  text-align: center;
}

.pp-total {
  margin-top: auto;
}

.pp-gl {
  text-align: center !important;
  font-size: 21px !important;
  font-weight: 950;
}

.pp-gt {
  text-align: center !important;
  font-size: 22px !important;
  font-weight: 950;
}

.pp-sign td {
  height: 19mm;
  text-align: center;
  vertical-align: top;
  font-size: 17px !important;
  font-weight: 950;
  padding-top: 5px;
}

@media print {
  body {
    padding: 0 !important;
  }

  .pp {
    margin: 0 !important;
  }

  .screen-note {
    display: none !important;
  }
}
`;

function buildPrintBody() {
  updateTotals();

  const info = readInfo();
  const rows = readRows(false);

  const rowsHTML = rows
    .map((row, i) => {
      const q = parseNum(row.qty);
      const p = parseNum(row.price);
      const total = q * p;

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(row.date)}</td>
          <td>${esc(row.material)}</td>
          <td>${esc(row.qty)}</td>
          <td>${esc(row.price)}</td>
          <td>${total > 0 ? money(total) : ""}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="pp">
      <div class="pp-title">
        <h1>Sri Sawdamman Infra</h1>
        <div class="sub">MATERIAL INPUT RECEIPT</div>
      </div>

      <table class="pp-meta">
        <tr>
          <td class="pp-lbl" style="width:8%">Date :</td>
          <td style="width:18%">${esc(info.docDate)}</td>
          <td class="pp-lbl" style="width:10%">Voucher :</td>
          <td style="width:14%">${esc(info.voucherNo)}</td>
          <td class="pp-lbl" style="width:10%">Vehicle :</td>
          <td style="width:16%">${esc(info.vehicleNo)}</td>
          <td class="pp-lbl" style="width:9%">Driver :</td>
          <td style="width:15%">${esc(info.driverName)}</td>
        </tr>
      </table>

      <table class="pp-info">
        <tr>
          <td class="pp-lbl" style="width:20mm">From :</td>
          <td>${esc(info.from)}</td>
          <td rowspan="5" style="width:12mm"></td>
          <td class="pp-lbl" style="width:22mm">Place :</td>
          <td>${esc(info.place1)}</td>
        </tr>

        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td>${esc(info.place2)}</td>
        </tr>

        <tr>
          <td class="pp-lbl">To :</td>
          <td>${esc(info.to)}</td>
          <td></td>
          <td>${esc(info.place3)}</td>
        </tr>

        <tr>
          <td></td>
          <td class="pp-mat">MATERIAL INPUT</td>
          <td class="pp-lbl">Cell No :</td>
          <td>${esc(info.cell1)}<br>${esc(info.cell2)}</td>
        </tr>

        <tr>
          <td></td>
          <td class="pp-dwm">
            Day: ${esc(info.day)} &nbsp;&nbsp; Week: ${esc(info.week)} &nbsp;&nbsp; Month: ${esc(info.month)}
          </td>
          <td></td>
          <td></td>
        </tr>
      </table>

      <table class="pp-items">
        <thead>
          <tr>
            <th style="width:6%">NO</th>
            <th style="width:17%">Date</th>
            <th style="width:37%">Material</th>
            <th style="width:9%">Qty</th>
            <th style="width:13%">Price</th>
            <th style="width:18%">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <table class="pp-total">
        <tr>
          <td colspan="4" class="pp-gl">Grand Total</td>
          <td colspan="2" class="pp-gt">${esc(grandTotalEl.textContent)}</td>
        </tr>
      </table>

      <table class="pp-sign">
        <tr>
          <td>Prepared By<br><br><br>________________________</td>
          <td>Checked By<br><br><br>________________________</td>
          <td>Authorised Signatory<br><br><br>________________________</td>
        </tr>
      </table>
    </div>
  `;
}

function receiptFileName(ext = "pdf") {
  const d = (docDateInput.value || dateToDMY(new Date())).replace(/\D/g, "");
  return `Sri_Sawdamman_Infra_Material_Input_${d}.${ext}`;
}

function openPrintPage() {
  const body = buildPrintBody();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Sri Sawdamman Infra Print</title>
      <style>${PRINT_CSS}</style>
    </head>
    <body>
      <div class="screen-note" style="font-size:18px;font-weight:700;padding:10px;border:1px solid #000;margin-bottom:8px;">
        Print Settings: A4 → Portrait → Fit to page / 100%
      </div>
      ${body}
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.focus();
            window.print();
          }, 800);
        };
      <\/script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");

  if (!win) {
    printArea.innerHTML = body;
    setTimeout(() => window.print(), 300);
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  showToast("Opening print page…", "ok");
}

async function loadScriptOnce(src, key, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) {
      resolve();
      return;
    }

    const old = document.querySelector(`script[data-lib="${key}"]`);

    if (old) {
      old.addEventListener("load", resolve, { once: true });
      old.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.lib = key;
    script.onload = resolve;
    script.onerror = () => reject(new Error(key + " failed"));
    document.head.appendChild(script);
  });
}

async function createPDFBlob() {
  await loadScriptOnce(
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    "html2canvas",
    "html2canvas"
  );

  await loadScriptOnce(
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
    "jspdf",
    "jspdf"
  );

  const stage = document.createElement("div");
  stage.style.cssText =
    "position:fixed;left:-99999px;top:0;width:210mm;background:#fff;z-index:-1;pointer-events:none;";
  stage.innerHTML = `<style>${PRINT_CSS}</style>${buildPrintBody()}`;

  document.body.appendChild(stage);

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const receipt = stage.querySelector(".pp");

    const canvas = await html2canvas(receipt, {
      scale: 1.6,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });

    const img = canvas.toDataURL("image/jpeg", 0.95);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    pdf.addImage(img, "JPEG", 5, 5, 200, 287, undefined, "FAST");

    return pdf.output("blob");
  } finally {
    document.body.removeChild(stage);
  }
}

function downloadBlob(blob, fname) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fname;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function downloadPDF() {
  try {
    setStatus("PDF loading…", "saving");
    showToast("Creating PDF…");

    const blob = await createPDFBlob();
    downloadBlob(blob, receiptFileName("pdf"));

    setStatus("PDF downloaded", "saved");
    showToast("PDF downloaded", "ok");
  } catch (err) {
    console.error(err);
    showToast("PDF failed. Opening print page. Choose Save as PDF.", "err");
    openPrintPage();
  }
}

function buildShareText() {
  const info = readInfo();
  const rows = readRows(false);

  const lines = [
    "Sri Sawdamman Infra",
    "Material Input Receipt",
    "-------------------------",
    `Date: ${info.docDate}`,
    `Day: ${info.day}`,
    `Week: ${info.week}`,
    `Month: ${info.month}`,
    `From: ${info.from || "-"}`,
    `To: ${info.to || "-"}`,
    `Place: ${[info.place1, info.place2, info.place3].filter(Boolean).join(", ")}`,
    `Vehicle: ${info.vehicleNo || "-"}`,
    `Driver: ${info.driverName || "-"}`,
    `Cell: ${[info.cell1, info.cell2].filter(Boolean).join(" / ")}`,
    "-------------------------"
  ];

  rows.forEach((row, i) => {
    const total = parseNum(row.qty) * parseNum(row.price);
    lines.push(
      `${i + 1}. ${row.date || "-"} | ${row.material || "-"} | Qty: ${row.qty || 0} | Price: ${row.price || 0} | Total: ${total > 0 ? money(total) : "-"}`
    );
  });

  lines.push("-------------------------");
  lines.push(`Grand Total: ${grandTotalEl.textContent}`);

  return lines.join("\n");
}

async function shareReceipt() {
  const text = buildShareText();

  try {
    let shared = false;

    if (navigator.share && navigator.canShare && window.File) {
      try {
        const blob = await createPDFBlob();
        const file = new File([blob], receiptFileName("pdf"), { type: "application/pdf" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Sri Sawdamman Infra Receipt",
            text: "Sri Sawdamman Infra Material Input Receipt",
            files: [file]
          });

          shared = true;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    if (!shared && navigator.share) {
      await navigator.share({
        title: "Sri Sawdamman Infra Receipt",
        text
      });

      shared = true;
    }

    if (!shared && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast("Receipt text copied", "ok");
    }
  } catch (e) {
    if (e.name === "AbortError") return;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Receipt text copied", "ok");
    } catch {
      alert(text);
    }
  }
}

document.getElementById("printBtn").addEventListener("click", openPrintPage);
document.getElementById("pdfBtn").addEventListener("click", downloadPDF);
document.getElementById("shareBtn").addEventListener("click", shareReceipt);

window.addEventListener("beforeprint", () => {
  printArea.innerHTML = buildPrintBody();
});

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
    e.preventDefault();
    openPrintPage();
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    downloadPDF();
  }
});

setInterval(saveDraft, 30000);
window.addEventListener("beforeunload", saveDraft);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveDraft();
});

(function init() {
  selectedDate = todayDate();
  docDateInput.value = dateToDMY(selectedDate);

  const loaded = loadDraft();

  if (!loaded) {
    updateDateNavigation(false);

    for (let i = 0; i < MIN_ROWS; i++) {
      addRow();
    }

    saveDraft();
  } else {
    updateDateNavigation(false);
    updateTotals();
  }
})();
