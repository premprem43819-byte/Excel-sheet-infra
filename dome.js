const tbody = document.getElementById('tbody');
const grandTotalEl = document.getElementById('grandTotal');
const addRowBtn = document.getElementById('addRowBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');


// =========================
// CREATE ROW
// =========================

function makeRow(n) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${n}</td>
    <td><input type="text" placeholder=""></td>
    <td><input type="text" placeholder=""></td>
    <td><input type="number" class="qty" min="0" placeholder=""></td>
    <td><input type="number" class="price" min="0" placeholder=""></td>
    <td class="total">-</td>
  `;
  return tr;
}


// =========================
// UPDATE TOTALS
// =========================

function updateTotals() {
  let grand = 0;

  document.querySelectorAll('#receiptTable tbody tr').forEach((row, index) => {

    // Row number
    row.cells[0].innerText = index + 1;

    const qtyInput = row.querySelector('.qty');
    const priceInput = row.querySelector('.price');
    const qty = parseFloat(qtyInput.value);
    const price = parseFloat(priceInput.value);

    if (!isNaN(qty) && !isNaN(price)) {
      const total = qty * price;
      row.querySelector('.total').innerText = total.toFixed(2);
      grand += total;
    } else {
      row.querySelector('.total').innerText = '-';
    }
  });

  grandTotalEl.innerText = '₹ ' + grand.toFixed(2);
}


// =========================
// ATTACH EVENTS
// =========================

function addEvents() {
  document.querySelectorAll('.qty, .price').forEach(input => {
    input.addEventListener('input', updateTotals);
  });
}


// =========================
// ADD ROW
// =========================

addRowBtn.addEventListener('click', () => {
  const n = tbody.rows.length + 1;
  tbody.appendChild(makeRow(n));
  addEvents();
  updateTotals();
});


// =========================
// SHARE BUTTON
// =========================

shareBtn.addEventListener('click', async () => {
  const from = document.getElementById('fromField').value || '-';
  const to = document.getElementById('toField').value || '-';
  const text = `Sri Sawdammal Infra\nFrom: ${from}\nTo: ${to}\nTotal Amount: ${grandTotalEl.innerText}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Sri Sawdammal Infra', text });
    } catch (e) {
      console.log('Share cancelled');
    }
  } else {
    navigator.clipboard.writeText(text).then(() => alert('Copied:\n' + text));
  }
});


// =========================
// SAVE BUTTON
// =========================

saveBtn.addEventListener('click', () => {
  const rows = [];

  document.querySelectorAll('#receiptTable tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    rows.push({
      date: inputs[0].value,
      material: inputs[1].value,
      qty: inputs[2].value,
      price: inputs[3].value,
      total: row.querySelector('.total').innerText
    });
  });

  const data = {
    from: document.getElementById('fromField').value,
    to: document.getElementById('toField').value,
    rows,
    grandTotal: grandTotalEl.innerText,
    savedAt: new Date().toLocaleString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SriSawdammal_Receipt_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
});


// =========================
// INIT — create 10 rows
// =========================

for (let i = 1; i <= 10; i++) {
  tbody.appendChild(makeRow(i));
}

addEvents();
updateTotals();
