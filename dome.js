var tbody        = document.getElementById('tbody');
var grandTotalEl = document.getElementById('grandTotal');

// ── DEVICE DETECTION ─────────────────────────────
function isIOS()     { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function isAndroid() { return /Android/.test(navigator.userAgent); }
function isMobile()  { return isIOS() || isAndroid(); }

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
    '─────────────────────────',
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
  lines.push('─────────────────────────');
  lines.push('Grand Total : ' + grandTotalEl.innerText);
  return lines.join('\n');
}

// ── SHARE BUTTON ─────────────────────────────────
document.getElementById('shareBtn').addEventListener('click', function() {
  var text = buildShareText();
  if (navigator.share) {
    navigator.share({ title: 'Sri Sawdammal Infra Receipt', text: text })
      .catch(function(e) { if (e.name !== 'AbortError') fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      alert('✅ Receipt copied to clipboard!');
    }).catch(function() { legacyCopy(text); });
  } else {
    legacyCopy(text);
  }
}

function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); alert('✅ Copied to clipboard!'); }
  catch(e) { alert(text); }
  document.body.removeChild(ta);
}

// ── BUILD FULL RECEIPT HTML ───────────────────────
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
      '<td style="text-align:center;border:1px solid #000;padding:5px;width:36px;">' + (i+1) + '</td>' +
      '<td style="border:1px solid #000;padding:5px;">'                   + (inp[0].value||'') + '</td>' +
      '<td style="border:1px solid #000;padding:5px;">'                   + (inp[1].value||'') + '</td>' +
      '<td style="border:1px solid #000;padding:5px;text-align:center;">' + (inp[2].value||'') + '</td>' +
      '<td style="border:1px solid #000;padding:5px;text-align:center;">' + (inp[3].value||'') + '</td>' +
      '<td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;">' + total + '</td>' +
      '</tr>';
  });

  return '<!DOCTYPE html><html><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Sri Sawdammal Infra Receipt</title>' +
    '<style>' +
      'body{margin:0;padding:8px;background:#d9d9d9;font-family:Arial,sans-serif}' +
      '.wrap{max-width:900px;margin:auto;background:#fff;border:2px solid #000}' +
      'table{width:100%;border-collapse:collapse}' +
      '@media print{body{background:#fff;padding:0}.no-print{display:none!important}}' +
    '</style>' +
    '</head><body>' +
    '<div class="wrap">' +
      '<div style="background:yellow;text-align:center;padding:10px;border-bottom:2px solid #000;">' +
        '<h1 style="font-size:clamp(24px,5vw,42px);font-style:italic;color:#000;margin:0;">Sri Sawdammal Infra</h1>' +
      '</div>' +
      '<table>' +
        '<tr>' +
          '<td style="background:#c69c6d;font-weight:bold;width:80px;text-align:center;border:1px solid #000;padding:5px;font-size:13px;">From :</td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[0] + '</td>' +
          '<td rowspan="4" style="background:#f2f2f2;width:60px;border:1px solid #000;"></td>' +
          '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:5px;font-size:13px;">Place :</td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[1] + '</td>' +
        '</tr><tr>' +
          '<td style="border:1px solid #000;padding:5px;"></td>' +
          '<td style="border:1px solid #000;padding:5px;"></td>' +
          '<td style="border:1px solid #000;padding:5px;"></td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[2] + '</td>' +
        '</tr><tr>' +
          '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:5px;font-size:13px;">To :</td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[3] + '</td>' +
          '<td style="border:1px solid #000;padding:5px;"></td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[4] + '</td>' +
        '</tr><tr>' +
          '<td style="border:1px solid #000;padding:5px;"></td>' +
          '<td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;font-size:13px;">MATERIAL INPUT</td>' +
          '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:5px;font-size:13px;">Cell No :</td>' +
          '<td style="border:1px solid #000;padding:5px;font-size:13px;">' + iv[5] + '<br>' + (iv[6]||'') + '</td>' +
        '</tr>' +
      '</table>' +
      '<table>' +
        '<thead><tr>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;width:36px;">NO</th>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;">Date</th>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;">Material</th>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;">Qty</th>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;">Price</th>' +
          '<th style="background:#c69c6d;border:1px solid #000;padding:6px;">Total</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHTML + '</tbody>' +
        '<tfoot><tr>' +
          '<td colspan="4" style="text-align:right;font-size:18px;font-weight:bold;padding:8px 12px;border:1px solid #000;">Total</td>' +
          '<td colspan="2" style="text-align:center;font-size:18px;font-weight:bold;border:1px solid #000;">' + grandTotalEl.innerText + '</td>' +
        '</tr></tfoot>' +
      '</table>' +
    '</div>' +
    '</body></html>';
}

// ── SAVE BUTTON ──────────────────────────────────
// Strategy:
//   Desktop Chrome/Edge  → showSaveFilePicker (direct save dialog)
//   Android Chrome       → data: URI with <a download> trick — goes to Downloads folder
//   iPhone Safari        → open in new tab → user saves via Share → Save to Files
//   Fallback             → data: URI download

document.getElementById('saveBtn').addEventListener('click', function() {
  var html     = buildReceiptHTML();
  var filename = 'SriSawdammal_Receipt.html';

  // ── Desktop: File System Access API ──
  if (window.showSaveFilePicker && !isMobile()) {
    var blob = new Blob([html], { type: 'text/html' });
    window.showSaveFilePicker({
      suggestedName : filename,
      types: [{ description: 'HTML File', accept: { 'text/html': ['.html'] } }]
    }).then(function(fh) {
      return fh.createWritable();
    }).then(function(w) {
      return w.write(blob).then(function() { return w.close(); });
    }).then(function() {
      alert('✅ Receipt saved!');
    }).catch(function(e) {
      if (e.name !== 'AbortError') downloadViaAnchor(html, filename);
    });
    return;
  }

  // ── Android: anchor download — saves directly to Downloads ──
  if (isAndroid()) {
    downloadViaAnchor(html, filename);
    return;
  }

  // ── iPhone: open in new tab with save instructions banner ──
  if (isIOS()) {
    var blob = new Blob([html], { type: 'text/html' });
    var url  = URL.createObjectURL(blob);
    showSaveModal(url);
    return;
  }

  // ── Other / unknown ──
  downloadViaAnchor(html, filename);
});

// Anchor-based download — works on Android Chrome → saves to Downloads folder
function downloadViaAnchor(html, filename) {
  try {
    // Try data URI first (most compatible on Android)
    var dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    var a = document.createElement('a');
    a.href     = dataUri;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Show confirmation after short delay
    setTimeout(function() {
      alert('✅ Receipt saved!\nCheck your Downloads folder.');
    }, 800);
  } catch(e) {
    // Blob URL fallback
    var blob = new Blob([html], { type: 'text/html' });
    var url  = URL.createObjectURL(blob);
    var a2   = document.createElement('a');
    a2.href     = url;
    a2.download = filename;
    a2.style.display = 'none';
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    setTimeout(function() { alert('✅ Receipt saved!\nCheck your Downloads folder.'); }, 800);
  }
}

// iOS modal — open in new tab, user does Share → Save to Files
function showSaveModal(url) {
  var modal = document.getElementById('saveModal');
  var steps = document.getElementById('modalSteps');

  steps.innerHTML =
    '<div><span>1.</span> Tap <b>Open Receipt</b> below</div>' +
    '<div><span>2.</span> Tap the <b>Share icon</b> <span style="font-size:15px;">⬆</span> at the bottom of Safari</div>' +
    '<div><span>3.</span> Scroll down and tap <b>Save to Files</b></div>' +
    '<div><span>4.</span> Choose a folder and tap <b>Save</b></div>';

  modal.classList.add('show');

  document.getElementById('modalOpenBtn').onclick = function() {
    window.open(url, '_blank');
    modal.classList.remove('show');
    setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
  };

  document.getElementById('modalCloseBtn').onclick = function() {
    modal.classList.remove('show');
    URL.revokeObjectURL(url);
  };
}

// ── PRINT BUTTON ─────────────────────────────────
// On mobile, we open the receipt HTML in a new window and print from there.
// This avoids the common issue where window.print() on mobile ignores @media print
// or doesn't trigger at all on Samsung Browser / older WebViews.

document.getElementById('printBtn').addEventListener('click', function() {
  if (isMobile()) {
    // Open receipt page in new tab — user taps browser Print from the menu
    // OR we auto-trigger print in the new window
    var html = buildReceiptHTML();
    // Inject auto-print script into the receipt HTML
    var printHTML = html.replace(
      '</body>',
      '<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body>'
    );
    var blob = new Blob([printHTML], { type: 'text/html' });
    var url  = URL.createObjectURL(blob);
    var win  = window.open(url, '_blank');
    // If popup blocked, fallback to same-window print
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setTimeout(function() { window.print(); }, 150);
    }
    setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
  } else {
    // Desktop — standard print
    setTimeout(function() { window.print(); }, 100);
  }
});

// ── INIT ─────────────────────────────────────────
for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
addEvents();
updateTotals();
