var tbody       = document.getElementById('tbody');
var grandTotalEl = document.getElementById('grandTotal');

// ── DETECT DEVICE ────────────────────────────────
function isIOS()     { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function isAndroid() { return /Android/.test(navigator.userAgent); }

// ── CREATE ROW ───────────────────────────────────
function makeRow(n) {
  var tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' + n + '</td>' +
    '<td><input type="text"></td>' +
    '<td><input type="text"></td>' +
    '<td><input type="number" class="qty"   min="0" inputmode="decimal"></td>' +
    '<td><input type="number" class="price" min="0" inputmode="decimal"></td>' +
    '<td class="total">-</td>';
  return tr;
}

// ── UPDATE TOTALS ────────────────────────────────
function updateTotals() {
  var grand = 0;
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    row.cells[0].innerText = i + 1;
    var qty   = parseFloat(row.querySelector('.qty').value);
    var price = parseFloat(row.querySelector('.price').value);
    if (!isNaN(qty) && !isNaN(price)) {
      var t = qty * price;
      row.querySelector('.total').innerText = t.toFixed(2);
      grand += t;
    } else {
      row.querySelector('.total').innerText = '-';
    }
  });
  grandTotalEl.innerText = '₹ ' + grand.toFixed(2);
}

function addEvents() {
  document.querySelectorAll('.qty, .price').forEach(function(inp) {
    inp.addEventListener('input', updateTotals);
  });
}

// ── ADD ROW ──────────────────────────────────────
document.getElementById('addRowBtn').addEventListener('click', function() {
  tbody.appendChild(makeRow(tbody.rows.length + 1));
  addEvents();
  updateTotals();
});

// ── BUILD SHARE TEXT ─────────────────────────────
function buildShareText() {
  var from  = document.getElementById('fromField').value || '-';
  var to    = document.getElementById('toField').value   || '-';
  var lines = [
    'Sri Sawdammal Infra',
    'From : ' + from,
    'To   : ' + to,
    '─────────────────────────────',
    'No | Date | Material | Qty | Price | Total'
  ];
  tbody.querySelectorAll('tr').forEach(function(row) {
    var inp = row.querySelectorAll('input');
    lines.push(
      row.cells[0].innerText + ' | ' +
      (inp[0].value || '-') + ' | ' +
      (inp[1].value || '-') + ' | ' +
      (inp[2].value || '-') + ' | ' +
      (inp[3].value || '-') + ' | ' +
      row.querySelector('.total').innerText
    );
  });
  lines.push('─────────────────────────────');
  lines.push('Grand Total : ' + grandTotalEl.innerText);
  return lines.join('\n');
}

// ── SHARE BUTTON ─────────────────────────────────
// Works on mobile (Android/iPhone) via Web Share API.
// Falls back to clipboard on desktop / older browsers.
document.getElementById('shareBtn').addEventListener('click', function() {
  var text = buildShareText();

  // Web Share API — supported on Android Chrome & iOS Safari (must be HTTPS or file://)
  if (navigator.share) {
    navigator.share({
      title : 'Sri Sawdammal Infra Receipt',
      text  : text
    }).catch(function(err) {
      // User cancelled — do nothing
      if (err.name !== 'AbortError') {
        fallbackCopy(text);
      }
    });
    return;
  }

  // Fallback for desktop / unsupported browsers
  fallbackCopy(text);
});

function fallbackCopy(text) {
  // Modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      alert('✅ Receipt copied to clipboard!');
    }).catch(function() {
      legacyCopy(text);
    });
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text) {
  // execCommand fallback for very old browsers / WebViews
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top      = '0';
  ta.style.left     = '0';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    alert('✅ Receipt copied to clipboard!');
  } catch (e) {
    // Last resort: show text so user can copy manually
    alert(text);
  }
  document.body.removeChild(ta);
}

// ── BUILD RECEIPT HTML (for Save) ────────────────
function buildReceiptHTML() {
  var iv = [];
  document.querySelectorAll('.info-table input').forEach(function(inp) {
    iv.push(inp.value || '');
  });

  var rowsHTML = '';
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    var inp   = row.querySelectorAll('input');
    var total = row.querySelector('.total').innerText;
    rowsHTML +=
      '<tr>' +
      '<td style="text-align:center;border:1px solid black;padding:5px;width:36px;">' + (i+1) + '</td>' +
      '<td style="border:1px solid black;padding:5px;">'                 + (inp[0].value||'') + '</td>' +
      '<td style="border:1px solid black;padding:5px;">'                 + (inp[1].value||'') + '</td>' +
      '<td style="border:1px solid black;padding:5px;text-align:center;">' + (inp[2].value||'') + '</td>' +
      '<td style="border:1px solid black;padding:5px;text-align:center;">' + (inp[3].value||'') + '</td>' +
      '<td style="border:1px solid black;padding:5px;text-align:center;font-weight:bold;">' + total + '</td>' +
      '</tr>';
  });

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Sri Sawdammal Infra - Receipt</title>' +
    '<style>' +
    'body{margin:0;padding:10px;background:#d9d9d9;font-family:Arial,sans-serif}' +
    '.wrap{max-width:900px;margin:auto;background:white;border:2px solid black}' +
    '.hint{background:#1f4e79;color:white;text-align:center;padding:12px;font-size:14px;font-weight:bold;line-height:1.6}' +
    '@media print{.hint{display:none!important}body{background:white;padding:0}}' +
    '</style></head><body>' +
    '<div class="hint">' +
      '📥 <b>iPhone:</b> tap Share icon → Save to Files &nbsp;|&nbsp; <b>Android:</b> tap ⋮ menu → Download' +
    '</div>' +
    '<div class="wrap">' +
    '<div style="background:yellow;text-align:center;padding:10px;border-bottom:2px solid black;">' +
    '<h1 style="font-size:clamp(26px,5vw,42px);font-style:italic;color:#000;">Sri Sawdammal Infra</h1></div>' +

    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr>' +
    '<td style="background:#c69c6d;font-weight:bold;width:80px;text-align:center;border:1px solid black;padding:5px;font-size:13px;">From :</td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[0] + '</td>' +
    '<td rowspan="4" style="background:#f2f2f2;width:60px;border:1px solid black;"></td>' +
    '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid black;padding:5px;font-size:13px;">Place :</td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[1] + '</td>' +
    '</tr><tr>' +
    '<td style="border:1px solid black;padding:5px;"></td>' +
    '<td style="border:1px solid black;padding:5px;"></td>' +
    '<td style="border:1px solid black;padding:5px;"></td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[2] + '</td>' +
    '</tr><tr>' +
    '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid black;padding:5px;font-size:13px;">To :</td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[3] + '</td>' +
    '<td style="border:1px solid black;padding:5px;"></td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[4] + '</td>' +
    '</tr><tr>' +
    '<td style="border:1px solid black;padding:5px;"></td>' +
    '<td style="border:1px solid black;padding:5px;text-align:center;font-weight:bold;font-size:13px;">MATERIAL INPUT</td>' +
    '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid black;padding:5px;font-size:13px;">Cell No :</td>' +
    '<td style="border:1px solid black;padding:5px;font-size:13px;">'   + iv[5] + '<br>' + (iv[6]||'') + '</td>' +
    '</tr></table>' +

    '<table style="width:100%;border-collapse:collapse;">' +
    '<thead><tr>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;width:36px;">NO</th>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;">Date</th>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;">Material</th>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;">Qty</th>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;">Price</th>' +
    '<th style="background:#c69c6d;border:1px solid black;padding:6px;">Total</th>' +
    '</tr></thead>' +
    '<tbody>' + rowsHTML + '</tbody>' +
    '<tfoot><tr>' +
    '<td colspan="4" style="text-align:right;font-size:18px;font-weight:bold;padding:8px 12px 8px 0;border:1px solid black;">Total</td>' +
    '<td colspan="2" style="text-align:center;font-size:18px;font-weight:bold;border:1px solid black;">' + grandTotalEl.innerText + '</td>' +
    '</tr></tfoot>' +
    '</table></div></body></html>';
}

// ── SAVE BUTTON ──────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', function() {
  var html = buildReceiptHTML();
  var blob = new Blob([html], { type: 'text/html' });

  // Modern desktop Chrome / Edge — File System Access API (direct save dialog)
  if (window.showSaveFilePicker) {
    window.showSaveFilePicker({
      suggestedName : 'SriSawdammal_Receipt.html',
      types: [{ description: 'HTML File', accept: { 'text/html': ['.html'] } }]
    }).then(function(fh) {
      return fh.createWritable();
    }).then(function(w) {
      return w.write(blob).then(function() { return w.close(); });
    }).then(function() {
      alert('✅ Receipt saved!');
    }).catch(function(e) {
      if (e.name !== 'AbortError') showSaveModal(blob);
    });
    return;
  }

  // Mobile / older browsers — show step-by-step modal
  showSaveModal(blob);
});

function showSaveModal(blob) {
  var url   = URL.createObjectURL(blob);
  var steps = document.getElementById('modalSteps');
  var modal = document.getElementById('saveModal');

  if (isIOS()) {
    steps.innerHTML =
      '<div><span>1.</span> Tap <b>Open Receipt</b> below</div>' +
      '<div><span>2.</span> Tap the <b>Share icon</b> (box with ↑) at the bottom of Safari</div>' +
      '<div><span>3.</span> Tap <b>Save to Files</b> → choose a folder → tap <b>Save</b></div>';
  } else if (isAndroid()) {
    steps.innerHTML =
      '<div><span>1.</span> Tap <b>Open Receipt</b> below</div>' +
      '<div><span>2.</span> Tap the <b>⋮ menu</b> at the top-right of Chrome</div>' +
      '<div><span>3.</span> Tap <b>Download</b> to save to your phone</div>';
  } else {
    steps.innerHTML =
      '<div><span>1.</span> Tap <b>Open Receipt</b> below</div>' +
      '<div><span>2.</span> Use your browser menu to <b>Save / Download</b> the page</div>';
  }

  modal.classList.add('show');

  document.getElementById('modalOpenBtn').onclick = function() {
    window.open(url, '_blank');
    modal.classList.remove('show');
    setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
  };

  document.getElementById('modalCloseBtn').onclick = function() {
    modal.classList.remove('show');
    URL.revokeObjectURL(url);
  };
}

// ── PRINT ────────────────────────────────────────
document.getElementById('printBtn').addEventListener('click', function() {
  setTimeout(function() { window.print(); }, 100);
});

// ── INIT ─────────────────────────────────────────
for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
addEvents();
updateTotals();
