const tbody = document.querySelector("#receiptTable tbody");

const addRowBtn = document.getElementById("addRowBtn");

const grandTotal = document.getElementById("grandTotal");

const shareBtn = document.getElementById("shareBtn");


// =========================
// UPDATE TOTALS
// =========================

function updateTotals() {

    let grand = 0;

    const rows = document.querySelectorAll("#receiptTable tbody tr");

    rows.forEach((row, index) => {

        // Row Number
        row.cells[0].innerText = index + 1;

        // Qty and Price
        const qtyInput = row.querySelector(".qty");
        const priceInput = row.querySelector(".price");

        const qty = Number(qtyInput.value) || 0;
        const price = Number(priceInput.value) || 0;

        // Calculate total
        const total = qty * price;

        // Show total
        row.querySelector(".total").innerText = total.toFixed(2);

        // Add grand total
        grand += total;
    });

    // Show grand total
    grandTotal.innerText = grand.toFixed(2);
}


// =========================
// INPUT EVENTS
// =========================

function addEvents() {

    const qtyInputs = document.querySelectorAll(".qty");

    const priceInputs = document.querySelectorAll(".price");

    qtyInputs.forEach(input => {

        input.addEventListener("input", updateTotals);
    });

    priceInputs.forEach(input => {

        input.addEventListener("input", updateTotals);
    });
}


// =========================
// ADD ROW
// =========================

addRowBtn.addEventListener("click", () => {

    const rowCount = tbody.rows.length + 1;

    const row = document.createElement("tr");

    row.innerHTML = `
    
        <td>${rowCount}</td>

        <td>
            <input type="text" placeholder="Material">
        </td>

        <td>
            <input type="number" class="qty" value="0">
        </td>

        <td>
            <input type="number" class="price" value="0">
        </td>

        <td class="total">0.00</td>
    `;

    tbody.appendChild(row);

    addEvents();

    updateTotals();
});


// =========================
// SHARE BUTTON
// =========================

shareBtn.addEventListener("click", async () => {

    const text =
        `Sri Sawdammal Infra Total Amount : ₹ ${grandTotal.innerText}`;

    if (navigator.share) {

        try {

            await navigator.share({
                title: "Sri Sawdammal Infra",
                text: text
            });

        } catch (error) {

            console.log("Share cancelled");
        }

    } else {

        navigator.clipboard.writeText(text);

        alert("Copied : " + text);
    }
});


// =========================
// START
// =========================

addEvents();

updateTotals();