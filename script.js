// ===== DATA STORAGE =====
let data = JSON.parse(localStorage.getItem("market")) || {
  products: [],
  sales: [],
  loans: []
};

// ===== SAVE =====
function save() {
  localStorage.setItem("market", JSON.stringify(data));
  load();
}

// ===== MENU =====
function toggleMenu() {
  let m = document.getElementById("menu");
  m.style.left = m.style.left === "0px" ? "-260px" : "0px";
}

function show(id) {
  document.querySelectorAll(".card").forEach(c => c.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  toggleMenu();
  load();
}

// ===== PRODUCTS =====
function addProduct() {
  let n = pname.value.trim(),
      pr = +pprice.value,
      st = +pstock.value,
      cur = pcurrency.value || "Dinar";
  if (!n || !pr) return;

  let f = data.products.find(p => p.name === n);
  if (f && !f._editing) { 
    f.price = pr; 
    f.stock = st; 
    f.currency = cur;
  } else if (f && f._editing) {
    f.name = n;
    f.price = pr;
    f.stock = st;
    f.currency = cur;
    delete f._editing;
  } else {
    data.products.push({ name: n, price: pr, stock: st, currency: cur });
  }

  pname.value = pprice.value = pstock.value = "";
  save();
}

// ===== LOAD UI =====
function load() {
  // Products & Prices page — hide stock
  plist.innerHTML = data.products.map((p, i) => `
    <div>
      • ${p.name} — ${p.price} ${p.currency} 
      <button onclick="editProduct(${i})" style="margin-left:8px;">Edit</button>
      <button onclick="deleteProduct(${i})">Delete</button>
    </div>
  `).join("");

  // Dropdowns for New Sale / Returns
  saleProduct.innerHTML = data.products
    .map(p => `<option value="${p.price}" data-currency="${p.currency}">${p.name}</option>`).join("");
  returnProduct.innerHTML = saleProduct.innerHTML;

  // Stock / Inventory page — show stock
  stockList.innerHTML = data.products.map((p, i) => `
    <div>
      • ${p.name} — ${p.price} ${p.currency} — stock:${p.stock}
      <button onclick="editProduct(${i})" style="margin-left:8px;">Edit</button>
      <button onclick="deleteProduct(${i})">Delete</button>
    </div>
  `).join("");

  // Sales with timestamp + Edit Date button
  salesList.innerHTML = data.sales.map((s, i) => `
    <div>
      ${new Date(s.time).toLocaleString()} — ${s.product} x${s.qty} = ${s.total} ${s.currency} (${s.price} ${s.currency} each)
      <button onclick="editSaleDate(${i})">Edit Date</button>
    </div>
  `).join("");

  // All time total
  todayTotal.innerHTML = "All Time Total: " + data.sales.reduce((sum, s) => sum + s.total, 0).toFixed(2) + " (mixed currencies)";

  // Loans
  loanList.innerHTML = data.loans.map((l, i) => `
    <div style="margin-bottom:10px">
      <b>${l.name}</b> — <i>${l.item}</i><br>
      Borrowed: ${l.total} — Paid: ${l.paid} — 
      <span style="color:red">Balance: ${l.total - l.paid}</span><br>
      <small>${new Date(l.date).toLocaleString()}</small><br>
      <button onclick="payLoan(${i})">پارەدان</button>
      <button onclick="deleteLoan(${i})">Delete</button>
    </div>
  `).join("");
}

// ===== EDIT SALE DATE =====
function editSaleDate(i) {
  let s = data.sales[i];
  let d = prompt(
    "New date (YYYY-MM-DD HH:MM)", 
    new Date(s.time).toISOString().slice(0,16).replace("T"," ")
  );
  if (!d) return;
  s.time = new Date(d);
  save();
}

// ===== EDIT / DELETE PRODUCTS =====
function editProduct(i) {
  let p = data.products[i];
  pname.value = p.name;
  pprice.value = p.price;
  pstock.value = p.stock;
  pcurrency.value = p.currency || "دینار";
  p._editing = true;
}

function deleteProduct(i) {
  if (confirm("Delete this product?")) {
    data.products.splice(i, 1);
    save();
  }
}

// ===== SALES WITH CUSTOM PRICE =====
function makeSale() {
  let sel = saleProduct.selectedOptions[0];
  if (!sel) return;

  let product = sel.text;
  let originalPrice = parseFloat(sel.value);
  let currency = sel.getAttribute("data-currency") || "دینار";
  let qty = +saleQty.value;
  if (!originalPrice || !qty) { saleMsg.innerHTML = "Invalid"; return; }

  let p = data.products.find(x => x.name === product);
  if (!p || p.stock < qty) { saleMsg.innerHTML = "Not enough stock"; return; }

  // ===== ASK FOR CUSTOM PRICE =====
  let finalPrice = prompt(`Original price: ${originalPrice} ${currency}. Sell for:`, originalPrice);
  finalPrice = parseFloat(finalPrice);
  if (!finalPrice) finalPrice = originalPrice;

  p.stock -= qty;

  data.sales.push({
    product,
    qty,
    price: finalPrice,  // sold price
    total: finalPrice * qty,
    currency,
    time: new Date()
  });

  saleQty.value = "";
  save();
  saleMsg.innerHTML = `✔ فرۆشرا (${finalPrice} ${currency})`;
  setTimeout(() => saleMsg.innerHTML = "", 1500);
}

// ===== RETURNS =====
function makeReturn() {
  let sel = returnProduct.selectedOptions[0];
  if (!sel) return;

  let product = sel.text;
  let qty = +returnQty.value;
  if (!qty) return;

  let p = data.products.find(x => x.name === product);
  if (!p) return;

  // Ask for new price if needed
  let price = prompt(`ئەشیای گەڕاوە بە نرخی چەند"${product}" (${p.currency}):`, p.price);
  if (!price) price = p.price;
  price = parseFloat(price);

  p.stock += qty;

  data.sales.push({
    product,
    qty: -qty,
    price,
    total: -price * qty,
    currency: p.currency,
    time: new Date()
  });

  returnQty.value = "";
  save();
}

// ===== LOANS =====
function addLoan() {
  let name = loanName.value.trim();
  let amount = +loanAmount.value;
  if (!name || !amount) return;

  let item = prompt("هۆکاری قەرز؟ (نموونە: فلتەر)") || "Unknown";

  data.loans.push({
    name,
    item,
    total: amount,
    paid: 0,
    date: new Date(),
    history: [{ amount: amount, type: "loan", date: new Date() }]
  });

  loanName.value = loanAmount.value = "";
  save();
}

// ===== LIVE SALE TOTAL =====
saleProduct.addEventListener("change", updateSaleTotal);
saleQty.addEventListener("input", updateSaleTotal);

function updateSaleTotal() {
  let sel = saleProduct.selectedOptions[0];
  if (!sel) return;

  let price = parseFloat(sel.value);
  let qty = +saleQty.value || 0;
  saleTotal.innerHTML = "گشتی: " + (price * qty).toFixed(2) + " " + sel.getAttribute("data-currency");
}

// ===== PAY / DELETE LOANS =====
function payLoan(i) {
  let amount = +prompt("بڕی پارەدان ");
  if (!amount) return;

  data.loans[i].paid += amount;
  data.loans[i].history.push({ amount, type: "payment", date: new Date() });

  if (data.loans[i].paid >= data.loans[i].total) {
    alert("قەرزەکە بە تەواوی درایەوە.");
    data.loans.splice(i, 1);
  }

  save();
}

function deleteLoan(i) {
  if (confirm("ئەم قەرزە بسڕێتەوە?")) data.loans.splice(i, 1);
  save();
}

// ===== INITIAL LOAD =====
load();
