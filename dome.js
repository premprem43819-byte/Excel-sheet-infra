var tbody        = document.getElementById('tbody');
var grandTotalEl = document.getElementById('grandTotal');

// ── DEVICE DETECTION ─────────────────────────────
function isIOS()     { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function isAndroid() { return /Android/.test(navigator.userAgent); }
function isMobile()  { return isIOS() || isAndroid(); }

// ── UTILITY: Debounce for performance ──────────────
function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() { func.apply(context, args); }, wait);
  };
}

// ── CREATE ROW ───────────────────────────────────
function makeRow(n) {
  var tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' + n + '</td>' +
    '<td><input type="text" placeholder="DD/MM/YYYY" inputmode="numeric"></td>' +
    '<td><input type="text" placeholder="Enter material..."></td>' +
    '<td><input type="number" class="qty" min="0" inputmode="decimal" placeholder="0"></td>' +
    '<td><input type="number" class="price" min="0" inputmode="decimal" placeholder="0.00"></td>' +
    '<td class="total">-</td>';
  return tr;
}

// ── UPDATE TOTALS ────────────────────────────────
function updateTotals() {
  var grand = 0;
  var rowCount = 0;
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    row.cells[0].innerText = i + 1;
    var qty   = parseFloat(row.querySelector('.qty').value);
    var price = parseFloat(row.querySelector('.price').value);
    var totalCell = row.querySelector('.total');
    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      var t = qty * price;
      totalCell.innerText = '₹ ' + t.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      totalCell.style.color = '#1a1a1a';
      grand += t;
      rowCount++;
    } else {
      totalCell.innerText = '-';
      totalCell.style.color = '#999';
    }
  });
  grandTotalEl.innerText = '₹ ' + grand.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  // Visual feedback on grand total
  if (grand > 0) {
    grandTotalEl.style.color = '#2e7d32';
  } else {
    grandTotalEl.style.color = '#1a1a1a';
  }
}

var debouncedUpdateTotals = debounce(updateTotals, 150);

function addEvents() {
  document.querySelectorAll('.qty, .price').forEach(function(inp) {
    inp.addEventListener('input', debouncedUpdateTotals);
    // Auto-tab on Enter
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var inputs = Array.from(document.querySelectorAll('.qty, .price'));
        var idx = inputs.indexOf(inp);
        if (idx >= 0 && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      }
    });
  });
}

// ── ADD ROW ──────────────────────────────────────
document.getElementById('addRowBtn').addEventListener('click', function() {
  var newRow = makeRow(tbody.rows.length + 1);
  tbody.appendChild(newRow);
  addEvents();
  updateTotals();
  // Auto-focus first input of new row
  var firstInput = newRow.querySelector('input');
  if (firstInput) firstInput.focus();

  // Smooth scroll to new row on mobile
  if (isMobile()) {
    setTimeout(function() {
      newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
});

// ── BUILD SHARE TEXT ─────────────────────────────
function buildShareText() {
  var from  = document.getElementById('fromField').value || '-';
  var to    = document.getElementById('toField').value   || '-';
  var place = document.querySelector('.info-table tr:first-child td:nth-child(5) input')?.value || '-';

  var lines = [
    '🏗️ *Sri Sawdammal Infra*',
    '━━━━━━━━━━━━━━━━━━━━━━━',
    '📍 From: ' + from,
    '📍 To:   ' + to,
    '📍 Place: ' + place,
    '━━━━━━━━━━━━━━━━━━━━━━━',
    'No | Date | Material | Qty | Price | Total'
  ];

  var hasData = false;
  tbody.querySelectorAll('tr').forEach(function(row) {
    var inp = row.querySelectorAll('input');
    var total = row.querySelector('.total').innerText;
    if (inp[0].value || inp[1].value || inp[2].value || inp[3].value) {
      hasData = true;
      lines.push(
        row.cells[0].innerText + ' | ' +
        (inp[0].value || '-') + ' | ' +
        (inp[1].value || '-') + ' | ' +
        (inp[2].value || '-') + ' | ' +
        (inp[3].value || '-') + ' | ' +
        total
      );
    }
  });

  if (!hasData) {
    lines.push('(No items entered)');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('💰 *Grand Total: ' + grandTotalEl.innerText + '*');
  return lines.join('\n');
}

// ── SHARE BUTTON ─────────────────────────────────
document.getElementById('shareBtn').addEventListener('click', function() {
  var text = buildShareText();
  if (navigator.share) {
    navigator.share({ 
      title: 'Sri Sawdammal Infra Receipt', 
      text: text 
    }).catch(function(e) { 
      if (e.name !== 'AbortError') fallbackCopy(text); 
    });
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('✅ Receipt copied to clipboard!');
    }).catch(function() { legacyCopy(text); });
  } else {
    legacyCopy(text);
  }
}

function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;z-index:-1;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { 
    document.execCommand('copy'); 
    showToast('✅ Copied to clipboard!'); 
  }
  catch(e) { 
    alert(text); 
  }
  document.body.removeChild(ta);
}

// ── TOAST NOTIFICATION ───────────────────────────
function showToast(message) {
  var existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerText = message;
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2e7d32;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:slideDown 0.3s ease;';

  var style = document.createElement('style');
  style.innerText = '@keyframes slideDown{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}';
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

// ── BUILD FULL RECEIPT HTML ───────────────────────
function buildReceiptHTML() {
  var iv = [];
  document.querySelectorAll('.info-table input').forEach(function(inp) {
    iv.push(inp.value || '');
  });

  var rowsHTML = '';
  var rowCount = 0;
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    var inp = row.querySelectorAll('input');
    var total = row.querySelector('.total').innerText;
    if (inp[0].value || inp[1].value || inp[2].value || inp[3].value) {
      rowCount++;
      rowsHTML +=
        '<tr>' +
        '<td style="text-align:center;border:1px solid #000;padding:6px;width:40px;font-weight:600;">' + (i+1) + '</td>' +
        '<td style="border:1px solid #000;padding:6px;font-size:13px;">'                   + (inp[0].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;font-size:13px;">'                   + (inp[1].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;font-size:13px;">' + (inp[2].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;font-size:13px;">' + (inp[3].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;font-weight:700;font-size:13px;">' + total + '</td>' +
        '</tr>';
    }
  });

  if (rowCount === 0) {
    rowsHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;border:1px solid #000;color:#999;font-style:italic;">No items entered</td></tr>';
  }

  return '<!DOCTYPE html><html><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Sri Sawdammal Infra Receipt</title>' +
    '<style>' +
      'body{margin:0;padding:12px;background:#f5f5f5;font-family:Arial,sans-serif}' +
      '.wrap{max-width:900px;margin:auto;background:#fff;border:2px solid #1a1a1a;border-radius:4px;box-shadow:0 8px 32px rgba(0,0,0,0.1)}' +
      'table{width:100%;border-collapse:collapse}' +
      '@media print{body{background:#fff;padding:0}.no-print{display:none!important}.wrap{box-shadow:none;border-radius:0}}' +
    '</style>' +
    '</head><body>' +
    '<div class="wrap">' +
      '<div style="background:linear-gradient(135deg,#ffd700 0%,#ffcc00 50%,#e6b800 100%);text-align:center;padding:16px 10px;border-bottom:2px solid #1a1a1a;">' +
        '<h1 style="font-size:clamp(24px,5vw,42px);font-style:italic;color:#1a1a1a;margin:0;text-shadow:1px 1px 2px rgba(0,0,0,0.1);">Sri Sawdammal Infra</h1>' +
      '</div>' +
      '<table>' +
        '<tr>' +
          '<td style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);font-weight:700;width:80px;text-align:center;border:1px solid #000;padding:6px 8px;font-size:13px;color:#fff;">From :</td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[0] + '</td>' +
          '<td rowspan="4" style="background:#f2f2f2;width:60px;border:1px solid #000;"></td>' +
          '<td style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);font-weight:700;text-align:center;border:1px solid #000;padding:6px 8px;font-size:13px;color:#fff;">Place :</td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[1] + '</td>' +
        '</tr><tr>' +
          '<td style="border:1px solid #000;padding:6px 8px;"></td>' +
          '<td style="border:1px solid #000;padding:6px 8px;"></td>' +
          '<td style="border:1px solid #000;padding:6px 8px;"></td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[2] + '</td>' +
        '</tr><tr>' +
          '<td style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);font-weight:700;text-align:center;border:1px solid #000;padding:6px 8px;font-size:13px;color:#fff;">To :</td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[3] + '</td>' +
          '<td style="border:1px solid #000;padding:6px 8px;"></td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[4] + '</td>' +
        '</tr><tr>' +
          '<td style="border:1px solid #000;padding:6px 8px;"></td>' +
          '<td style="border:1px solid #000;padding:6px 8px;text-align:center;font-weight:700;font-size:13px;letter-spacing:1px;">MATERIAL OUTPUT</td>' +
          '<td style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);font-weight:700;text-align:center;border:1px solid #000;padding:6px 8px;font-size:13px;color:#fff;">Cell No :</td>' +
          '<td style="border:1px solid #000;padding:6px 8px;font-size:13px;">' + iv[5] + '<br>' + (iv[6]||'') + '</td>' +
        '</tr>' +
      '</table>' +
      '<table>' +
        '<thead><tr>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;width:40px;color:#fff;font-weight:700;">NO</th>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;color:#fff;font-weight:700;">Date</th>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;color:#fff;font-weight:700;">Material</th>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;color:#fff;font-weight:700;">Qty</th>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;color:#fff;font-weight:700;">Price</th>' +
          '<th style="background:linear-gradient(135deg,#c69c6d 0%,#b88d5e 100%);border:1px solid #000;padding:8px 6px;color:#fff;font-weight:700;">Total</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHTML + '</tbody>' +
        '<tfoot><tr>' +
          '<td colspan="4" style="text-align:right;font-size:20px;font-weight:800;padding:10px 14px;border:1px solid #000;letter-spacing:0.5px;">Total</td>' +
          '<td colspan="2" style="text-align:center;font-size:20px;font-weight:800;border:1px solid #000;letter-spacing:0.5px;">' + grandTotalEl.innerText + '</td>' +
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
  var filename = 'SriSawdammal_Receipt_' + new Date().toISOString().slice(0,10) + '.html';

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
      showToast('✅ Receipt saved successfully!');
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
    showSaveModal(url, filename);
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
      showToast('✅ Receipt saved! Check Downloads folder.');
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
    setTimeout(function() { showToast('✅ Receipt saved! Check Downloads folder.'); }, 800);
  }
}

// iOS modal — open in new tab, user does Share → Save to Files
function showSaveModal(url, filename) {
  var modal = document.getElementById('saveModal');
  var steps = document.getElementById('modalSteps');
  var modalText = document.getElementById('modalText');

  modalText.innerText = 'Receipt: ' + filename;

  steps.innerHTML =
    '<div><span>1</span> Tap <b>Open Receipt</b> below</div>' +
    '<div><span>2</span> Tap the <b>Share icon</b> <span style="font-size:15px;">⬆</span> at the bottom</div>' +
    '<div><span>3</span> Scroll down and tap <b>Save to Files</b></div>' +
    '<div><span>4</span> Choose a folder and tap <b>Save</b></div>';

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

  // Close on backdrop click
  modal.onclick = function(e) {
    if (e.target === modal) {
      modal.classList.remove('show');
      URL.revokeObjectURL(url);
    }
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
    // Desktop — standard print with loading indicator
    showToast('🖨️ Opening print dialog...');
    setTimeout(function() { window.print(); }, 300);
  }
});

// ── KEYBOARD SHORTCUTS ───────────────────────────
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Enter = Print
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('printBtn').click();
  }
  // Ctrl/Cmd + S = Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    document.getElementById('saveBtn').click();
  }
});

// ── INIT ─────────────────────────────────────────
for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
addEvents();
updateTotals();

// ── AUTO-SAVE DRAFT TO LOCALSTORAGE ──────────────
function saveDraft() {
  try {
    var data = {
      from: document.getElementById('fromField').value,
      to: document.getElementById('toField').value,
      info: [],
      rows: []
    };
    document.querySelectorAll('.info-table input').forEach(function(inp) {
      data.info.push(inp.value);
    });
    tbody.querySelectorAll('tr').forEach(function(row) {
      var inp = row.querySelectorAll('input');
      data.rows.push({
        date: inp[0].value,
        material: inp[1].value,
        qty: inp[2].value,
        price: inp[3].value
      });
    });
    localStorage.setItem('sriSawdammalDraft', JSON.stringify(data));
  } catch(e) {}
}

function loadDraft() {
  try {
    var draft = localStorage.getItem('sriSawdammalDraft');
    if (!draft) return;
    var data = JSON.parse(draft);
    document.getElementById('fromField').value = data.from || '';
    document.getElementById('toField').value = data.to || '';
    var infoInputs = document.querySelectorAll('.info-table input');
    data.info.forEach(function(val, i) {
      if (infoInputs[i]) infoInputs[i].value = val;
    });

    // Clear existing rows and rebuild
    tbody.innerHTML = '';
    data.rows.forEach(function(rowData, i) {
      var row = makeRow(i + 1);
      var inp = row.querySelectorAll('input');
      inp[0].value = rowData.date || '';
      inp[1].value = rowData.material || '';
      inp[2].value = rowData.qty || '';
      inp[3].value = rowData.price || '';
      tbody.appendChild(row);
    });
    addEvents();
    updateTotals();
  } catch(e) {}
}

// Auto-save every 10 seconds and on input
setInterval(saveDraft, 10000);
document.querySelectorAll('input').forEach(function(inp) {
  inp.addEventListener('input', debounce(saveDraft, 500));
});

// Load draft on page load
loadDraft();
