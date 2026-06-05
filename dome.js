var tbody = document.getElementById('tbody');
var grandTotalEl = document.getElementById('grandTotal');
var toastEl = document.getElementById('toast');
var statItems = document.getElementById('statItems');
var statQty = document.getElementById('statQty');
var statSubtotal = document.getElementById('statSubtotal');

// ── DATE DISPLAY ───────────────────────────────
document.getElementById('today').textContent = 'Date: ' + new Date().toLocaleDateString('en-IN');

// ── THEME ────────────────────────────────────────
var currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

document.getElementById('themeBtn').addEventListener('click', function() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
  showToast('Switched to ' + currentTheme + ' mode');
});

function updateThemeIcon() {
  document.getElementById('themeBtn').textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// ── DEVICE DETECTION ─────────────────────────────
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function isAndroid() { return /Android/.test(navigator.userAgent); }
function isMobile() { return isIOS() || isAndroid(); }
function isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

// ── TOAST ────────────────────────────────────────
function showToast(msg, isError) {
  toastEl.textContent = msg;
  toastEl.className = 'toast' + (isError ? ' error' : '');
  toastEl.classList.add('show');
  setTimeout(function() { toastEl.classList.remove('show'); }, 3000);
}

// ── CONFIRM MODAL ────────────────────────────────
function confirmAction(title, text, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  var modal = document.getElementById('confirmModal');
  modal.classList.add('show');

  document.getElementById('confirmYes').onclick = function() {
    modal.classList.remove('show');
    onConfirm();
  };

  document.getElementById('confirmNo').onclick = function() {
    modal.classList.remove('show');
  };
}

// ── LOCAL STORAGE ────────────────────────────────
function saveData() {
  try {
    var data = { info: [], rows: [], theme: currentTheme };
    document.querySelectorAll('.info-table input').forEach(function(inp) {
      data.info.push(inp.value);
    });
    tbody.querySelectorAll('tr').forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      data.rows.push({
        date: inputs[0].value,
        material: inputs[1].value,
        qty: inputs[2].value,
        price: inputs[3].value
      });
    });
    localStorage.setItem('sriSawdammalReceipt', JSON.stringify(data));
  } catch(e) {}
}

function loadData() {
  try {
    var saved = localStorage.getItem('sriSawdammalReceipt');
    if (!saved) return false;
    var data = JSON.parse(saved);

    if (data.theme) {
      currentTheme = data.theme;
      document.documentElement.setAttribute('data-theme', currentTheme);
      updateThemeIcon();
    }

    var infoInputs = document.querySelectorAll('.info-table input');
    data.info.forEach(function(val, i) {
      if (infoInputs[i]) infoInputs[i].value = val;
    });

    tbody.innerHTML = '';
    data.rows.forEach(function(rowData) {
      var row = makeRow(tbody.rows.length + 1);
      var inputs = row.querySelectorAll('input');
      inputs[0].value = rowData.date || '';
      inputs[1].value = rowData.material || '';
      inputs[2].value = rowData.qty || '';
      inputs[3].value = rowData.price || '';
      tbody.appendChild(row);
    });

    if (tbody.rows.length === 0) {
      for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
    }

    addEvents();
    updateTotals();
    return true;
  } catch(e) { return false; }
}

// ── CREATE ROW ───────────────────────────────────
function makeRow(n) {
  var d = new Date().toISOString().split('T')[0];
  var tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' + n + '</td>' +
    '<td><input type="date" value="' + d + '"></td>' +
    '<td><input type="text" placeholder="Material name" autocomplete="off" autocorrect="off" autocapitalize="words"></td>' +
    '<td><input type="number" class="qty" min="0" step="0.01" inputmode="decimal" placeholder="0" autocomplete="off" pattern="[0-9]*"></td>' +
    '<td><input type="number" class="price" min="0" step="0.01" inputmode="decimal" placeholder="0.00" autocomplete="off" pattern="[0-9]*"></td>' +
    '<td class="total">0.00</td>' +
    '<td class="del-col"><button class="delete-btn" title="Remove">×</button></td>';

  tr.querySelector('.delete-btn').addEventListener('click', function() {
    deleteRow(tr);
  });

  return tr;
}

function deleteRow(row) {
  row.style.transition = 'all 0.3s ease';
  row.style.opacity = '0';
  row.style.transform = 'translateX(-20px)';
  setTimeout(function() {
    row.remove();
    renumberRows();
    updateTotals();
    saveData();
  }, 300);
}

function renumberRows() {
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    row.cells[0].textContent = i + 1;
  });
}

// ── UPDATE TOTALS ────────────────────────────────
function updateTotals() {
  var grand = 0, totalQty = 0, items = 0;

  tbody.querySelectorAll('tr').forEach(function(row, i) {
    row.cells[0].textContent = i + 1;
    var qty = parseFloat(row.querySelector('.qty').value) || 0;
    var price = parseFloat(row.querySelector('.price').value) || 0;
    var t = qty * price;

    row.querySelector('.total').textContent = t.toFixed(2);
    grand += t;
    if (qty > 0) {
      totalQty += qty;
      items++;
    }
  });

  grandTotalEl.textContent = '₹ ' + grand.toFixed(2);
  statItems.textContent = items;
  statQty.textContent = totalQty.toFixed(2);
  statSubtotal.textContent = '₹ ' + grand.toFixed(2);
  saveData();
}

function addEvents() {
  document.querySelectorAll('.qty, .price').forEach(function(inp) {
    inp.addEventListener('input', function() {
      if (this.value < 0) this.value = 0;
      updateTotals();
    });
  });

  document.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('change', saveData);
  });
}

// ── ADD ROW ──────────────────────────────────────
document.getElementById('addRowBtn').addEventListener('click', function() {
  var row = makeRow(tbody.rows.length + 1);
  row.style.opacity = '0';
  row.style.transform = 'translateY(-10px)';
  tbody.appendChild(row);

  requestAnimationFrame(function() {
    row.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    row.style.opacity = '1';
    row.style.transform = 'translateY(0)';
  });

  addEvents();
  updateTotals();

  setTimeout(function() {
    var firstInput = row.querySelector('input[type="date"]');
    if (firstInput) firstInput.focus();
  }, 100);
});

// ── CLEAR ALL ────────────────────────────────────
document.getElementById('clearBtn').addEventListener('click', function() {
  confirmAction('Clear All Data', 'This will delete all items. Are you sure?', function() {
    tbody.innerHTML = '';
    for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
    document.getElementById('fromField').value = '';
    document.getElementById('toField').value = '';
    addEvents();
    updateTotals();
    localStorage.removeItem('sriSawdammalReceipt');
    showToast('All data cleared');
  });
});

// ── KEYBOARD SHORTCUTS ───────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('addRowBtn').click();
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    document.getElementById('saveBtn').click();
  }
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    document.getElementById('printBtn').click();
  }
});

// ── SHARE ────────────────────────────────────────
function buildShareText() {
  var from = document.getElementById('fromField').value || '-';
  var to = document.getElementById('toField').value || '-';
  var lines = [
    '*SRI SAWDAMMAL INFRA*',
    'Date: ' + new Date().toLocaleDateString('en-IN'),
    'From: ' + from,
    'To: ' + to,
    '------------------------',
    'No | Date | Material | Qty | Price | Total'
  ];

  tbody.querySelectorAll('tr').forEach(function(row) {
    var inp = row.querySelectorAll('input');
    var total = row.querySelector('.total').textContent;
    if (inp[1].value || inp[2].value) {
      lines.push(
        row.cells[0].textContent + ' | ' +
        (inp[0].value || '-') + ' | ' +
        (inp[1].value || '-') + ' | ' +
        (inp[2].value || '-') + ' | ' +
        (inp[3].value || '-') + ' | ' +
        '₹' + total
      );
    }
  });

  lines.push('------------------------');
  lines.push('Grand Total: ' + grandTotalEl.textContent);
  return lines.join('\n');
}

document.getElementById('shareBtn').addEventListener('click', function() {
  var text = buildShareText();
  if (navigator.share) {
    navigator.share({ title: 'Sri Sawdammal Infra', text: text })
      .catch(function(e) { if (e.name !== 'AbortError') fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('Copied to clipboard!');
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
  try { document.execCommand('copy'); showToast('Copied!'); }
  catch(e) { alert(text); }
  document.body.removeChild(ta);
}

// ── BUILD HTML ───────────────────────────────────
function buildReceiptHTML() {
  var iv = [];
  document.querySelectorAll('.info-table input').forEach(function(inp) {
    iv.push(inp.value || '');
  });

  var rowsHTML = '';
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    var inp = row.querySelectorAll('input');
    var total = row.querySelector('.total').textContent;
    if (inp[1].value || inp[2].value) {
      rowsHTML +=
        '<tr>' +
        '<td style="text-align:center;border:1px solid #000;padding:6px;">' + (i+1) + '</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + (inp[0].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + (inp[1].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;">' + (inp[2].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;">' + (inp[3].value||'') + '</td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;">₹' + total + '</td>' +
        '</tr>';
    }
  });

  return '<!DOCTYPE html><html><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Sri Sawdammal Infra Receipt</title>' +
    '<style>' +
      'body{margin:0;padding:10px;background:#d9d9d9;font-family:Arial,sans-serif}' +
      '.wrap{max-width:900px;margin:auto;background:#fff;border:2px solid #000}' +
      'table{width:100%;border-collapse:collapse}' +
      '@media print{body{background:#fff;padding:0}.no-print{display:none!important}}' +
    '</style>' +
    '</head><body>' +
    '<div class="wrap">' +
    '<div style="background:linear-gradient(135deg,#1f4e79,#2f73b8);color:#fff;text-align:center;padding:20px;border-bottom:2px solid #000;">' +
      '<h1 style="font-size:clamp(24px,5vw,42px);font-style:italic;margin:0;">Sri Sawdammal Infra</h1>' +
      '<p style="margin:5px 0 0;font-size:14px;opacity:0.9;">Date: ' + new Date().toLocaleDateString('en-IN') + '</p>' +
    '</div>' +
    '<table style="margin-bottom:15px">' +
      '<tr>' +
        '<td style="background:#c69c6d;font-weight:bold;width:80px;text-align:center;border:1px solid #000;padding:6px;">From :</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[0] + '</td>' +
        '<td rowspan="4" style="background:#f2f2f2;width:60px;border:1px solid #000;"></td>' +
        '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;">Place :</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[2] + '</td>' +
      '</tr><tr>' +
        '<td style="border:1px solid #000;padding:6px;"></td>' +
        '<td style="border:1px solid #000;padding:6px;"></td>' +
        '<td style="border:1px solid #000;padding:6px;"></td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[3] + '</td>' +
      '</tr><tr>' +
        '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;">To :</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[1] + '</td>' +
        '<td style="border:1px solid #000;padding:6px;"></td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[4] + '</td>' +
      '</tr><tr>' +
        '<td style="border:1px solid #000;padding:6px;"></td>' +
        '<td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;">MATERIAL INPUT</td>' +
        '<td style="background:#c69c6d;font-weight:bold;text-align:center;border:1px solid #000;padding:6px;">Cell No :</td>' +
        '<td style="border:1px solid #000;padding:6px;">' + iv[5] + '<br>' + (iv[6]||'') + '</td>' +
      '</tr>' +
    '</table>' +
    '<table>' +
      '<thead><tr>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">NO</th>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">Date</th>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">Material</th>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">Qty</th>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">Price</th>' +
        '<th style="background:#1f4e79;color:#fff;border:1px solid #000;padding:6px;">Total</th>' +
      '</tr></thead>' +
      '<tbody>' + rowsHTML + '</tbody>' +
      '<tfoot><tr>' +
        '<td colspan="4" style="text-align:right;font-size:18px;font-weight:bold;padding:10px 15px;border:1px solid #000;">Grand Total</td>' +
        '<td colspan="2" style="text-align:center;font-size:18px;font-weight:bold;border:1px solid #000;background:#fff3cd;color:#d9534f;">' + grandTotalEl.textContent + '</td>' +
      '</tr></tfoot>' +
    '</table>' +
    '<div style="text-align:center;padding:15px;font-size:11px;color:#888">Thank you for your business!</div>' +
    '</div></body></html>';
}

// ── SAVE ─────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', function() {
  var html = buildReceiptHTML();
  var filename = 'SriSawdammal_Receipt_' + new Date().toISOString().slice(0,10) + '.html';

  if (window.showSaveFilePicker && !isMobile()) {
    var blob = new Blob([html], { type: 'text/html' });
    window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'HTML File', accept: { 'text/html': ['.html'] } }]
    }).then(function(fh) {
      return fh.createWritable();
    }).then(function(w) {
      return w.write(blob).then(function() { return w.close(); });
    }).then(function() {
      showToast('Receipt saved!');
    }).catch(function(e) {
      if (e.name !== 'AbortError') downloadViaAnchor(html, filename);
    });
    return;
  }

  if (isAndroid()) {
    downloadViaAnchor(html, filename);
    return;
  }

  if (isIOS()) {
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    showSaveModal(url);
    return;
  }

  downloadViaAnchor(html, filename);
});

function downloadViaAnchor(html, filename) {
  try {
    var dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    var a = document.createElement('a');
    a.href = dataUri;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { showToast('Saved! Check Downloads.'); }, 800);
  } catch(e) {
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a2 = document.createElement('a');
    a2.href = url;
    a2.download = filename;
    a2.style.display = 'none';
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    setTimeout(function() { showToast('Saved! Check Downloads.'); }, 800);
  }
}

function showSaveModal(url) {
  var modal = document.getElementById('saveModal');
  var steps = document.getElementById('modalSteps');

  steps.innerHTML =
    '<div><span>1</span> Tap <b>Open Receipt</b></div>' +
    '<div><span>2</span> Tap <b>Share</b> ⬆ at bottom</div>' +
    '<div><span>3</span> Choose <b>Save to Files</b></div>' +
    '<div><span>4</span> Tap <b>Save</b></div>';

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

// ── PRINT ────────────────────────────────────────
document.getElementById('printBtn').addEventListener('click', function() {
  if (isMobile()) {
    var html = buildReceiptHTML();
    var printHTML = html.replace(
      '</body>',
      '<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body>'
    );
    var blob = new Blob([printHTML], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setTimeout(function() { window.print(); }, 150);
    }
    setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
  } else {
    setTimeout(function() { window.print(); }, 100);
  }
});

// ── INIT ─────────────────────────────────────────
function init() {
  var loaded = loadData();
  if (!loaded) {
    for (var i = 1; i <= 10; i++) tbody.appendChild(makeRow(i));
    addEvents();
    updateTotals();
  }
  showToast('Welcome! Auto-save is ON');
}

init();
