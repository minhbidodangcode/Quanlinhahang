/* =========================
   Helpers & Constants
========================= */
const LS_CART_KEY = "cart";

const els = {
  orderItems: document.getElementById("orderItems"),
  totalAmount: document.getElementById("totalAmount"),
  bookingForm: document.getElementById("bookingForm"),
  salutation: document.getElementById("salutation"),
  fullName: document.getElementById("fullName"),
  email: document.getElementById("email"),
  guests: document.getElementById("guests"),
  phone: document.getElementById("phone"),
  bookingDate: document.getElementById("bookingDate"),
  timeSlot: document.getElementById("timeSlot"),
  specialRequest: document.getElementById("specialRequest"),
};

// Hàm định dạng tiền VND
const vnd = (n) =>
  (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// Hàm lấy ngày hôm nay dạng ISO (yyyy-mm-dd)
const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* =========================
   LocalStorage Cart Utils
========================= */
function getCart() {
  try {
    const raw = localStorage.getItem(LS_CART_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
}

function cartTotal(cart) {
  return cart.reduce((sum, it) => sum + it.price * it.qty, 0);
}

/* =========================
   Render Order Summary
========================= */
function renderCart() {
  const cart = getCart();
  els.orderItems.innerHTML = "";

  if (cart.length === 0) {
    els.orderItems.innerHTML = `
      <div class="empty-cart">
        <p>Chưa có món ăn nào được chọn</p>
      </div>`;
    els.totalAmount.textContent = vnd(0);
    return;
  }

  cart.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    row.dataset.id = item.id;

    row.innerHTML = `
      <div class="summary-col stt">${i + 1}</div>
      <div class="summary-col name">${escapeHtml(item.name)}</div>
      <div class="summary-col price">${vnd(item.price)}</div>
      <div class="summary-col qty">
        <button type="button" class="btn-qty dec" aria-label="Giảm">-</button>
        <input type="number" class="input-qty" min="1" value="${item.qty}" />
        <button type="button" class="btn-qty inc" aria-label="Tăng">+</button>
      </div>
      <div class="summary-col subtotal">
        <span>${vnd(item.price * item.qty)}</span>
        <button type="button" class="btn-remove" title="Xóa món">✕</button>
      </div>
    `;

    // Sự kiện tăng/giảm số lượng
    row
      .querySelector(".dec")
      .addEventListener("click", () => updateQty(item.id, item.qty - 1));
    row
      .querySelector(".inc")
      .addEventListener("click", () => updateQty(item.id, item.qty + 1));
    row.querySelector(".input-qty").addEventListener("input", (e) => {
      const val = Math.max(1, parseInt(e.target.value || "1", 10));
      updateQty(item.id, val);
    });
    row
      .querySelector(".btn-remove")
      .addEventListener("click", () => removeItem(item.id));

    els.orderItems.appendChild(row);
  });

  els.totalAmount.textContent = vnd(cartTotal(cart));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Cart Mutations
========================= */
function updateQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.id === id);
  if (idx === -1) return;

  if (qty <= 0) {
    // Nếu đưa xuống 0 thì xóa luôn
    cart.splice(idx, 1);
  } else {
    cart[idx].qty = qty;
  }
  setCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter((x) => x.id !== id);
  setCart(cart);
  renderCart();
}

/* =========================
   Form Constraints & Validation
========================= */
function setUpDateMin() {
  els.bookingDate.setAttribute("min", todayISO());
}

function validatePhone(phone) {
  // VN: 9–11 chữ số (chấp nhận +84 thay 0)
  const cleaned = phone.trim();
  const vn = /^(?:\+?84|0)\d{9,10}$/;
  const generic = /^\d{9,11}$/;
  return vn.test(cleaned) || generic.test(cleaned);
}

function validateEmail(email) {
  // Đơn giản mà chặt chẽ vừa đủ
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateForm() {
  const cart = getCart();
  const errs = [];

  if (!els.salutation.value) errs.push("Vui lòng chọn chi nhánh.");
  if (!els.fullName.value.trim()) errs.push("Vui lòng nhập họ và tên.");
  if (!validateEmail(els.email.value)) errs.push("Email không hợp lệ.");
  if (!els.guests.value || parseInt(els.guests.value, 10) < 1)
    errs.push("Số lượng người phải ≥ 1.");
  if (!validatePhone(els.phone.value)) errs.push("Số điện thoại không hợp lệ.");
  if (!els.bookingDate.value) errs.push("Vui lòng chọn ngày đặt.");
  if (!els.timeSlot.value) errs.push("Vui lòng chọn khung giờ.");
  if (cart.length === 0) errs.push("Bạn chưa chọn món nào.");

  // Chặn ngày quá khứ
  if (els.bookingDate.value) {
    const picked = new Date(els.bookingDate.value);
    const today = new Date(todayISO());
    if (picked < today) errs.push("Ngày đặt không được trong quá khứ.");
  }

  return errs;
}

/* =========================
   Form Submit
========================= */
function handleSubmit(e) {
  e.preventDefault();
  const errs = validateForm();

  if (errs.length) {
    alert("Vui lòng kiểm tra lại:\n• " + errs.join("\n• "));
    return;
  }

  const payload = {
    branch: els.salutation.value,
    fullName: els.fullName.value.trim(),
    email: els.email.value.trim(),
    guests: parseInt(els.guests.value, 10),
    phone: els.phone.value.trim(),
    bookingDate: els.bookingDate.value,
    timeSlot: els.timeSlot.value,
    specialRequest: els.specialRequest.value.trim(),
    items: getCart(),
    total: cartTotal(getCart()),
    submittedAt: new Date().toISOString(),
  };

  console.log("Booking payload:", payload);

  alert(
    [
      "Đặt bàn thành công!",
      `Khách: ${payload.fullName}`,
      `Chi nhánh: ${labelBranch(payload.branch)}`,
      `Ngày: ${formatVNDate(payload.bookingDate)} | ${labelSlot(
        payload.timeSlot
      )}`,
      `Số khách: ${payload.guests}`,
      `Tổng tiền: ${vnd(payload.total)}`,
      "Chúng tôi đã ghi nhận yêu cầu của bạn.",
    ].join("\n")
  );

  // Xóa giỏ sau khi đặt
  setCart([]);
  renderCart();
  e.target.reset();
  setUpDateMin();
}

/* =========================
   Helper Label & Date Format
========================= */
function labelBranch(value) {
  switch (value) {
    case "chi-nhanh-1":
      return "Chi Nhánh 1 - Hà Nội";
    case "chi-nhanh-2":
      return "Chi Nhánh 2 - HCM";
    case "chi-nhanh-3":
      return "Chi Nhánh 3 - Đà Nẵng";
    default:
      return value;
  }
}

function labelSlot(value) {
  switch (value) {
    case "morning":
      return "Buổi sáng (9:00 - 11:00)";
    case "lunch":
      return "Buổi trưa (11:00 - 14:00)";
    case "afternoon":
      return "Buổi chiều (14:00 - 17:00)";
    case "evening":
      return "Buổi tối (17:00 - 22:00)";
    default:
      return value;
  }
}

function formatVNDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
}

/* =========================
   UX: Tự động sửa số nhập
========================= */
function attachNumericGuards() {
  els.guests.addEventListener("input", () => {
    const n = Math.max(1, parseInt(els.guests.value || "1", 10));
    els.guests.value = n;
  });
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  setUpDateMin();
  // seedDemoCartIfEmpty(); // <- bật nếu muốn có sẵn món test
  renderCart();
  attachNumericGuards();
  els.bookingForm.addEventListener("submit", handleSubmit);
});
document.addEventListener("DOMContentLoaded", function () {
  // Tải file navbar.html
  fetch("/trangchu/navbar/navbarfinal.html") // <-- CHỈNH LẠI ĐƯỜNG DẪN NÀY
    .then((response) => {
      if (!response.ok) {
        throw new Error("Không thể tải navbar.html");
      }
      return response.text();
    })
    .then((data) => {
      // Gắn nội dung navbar vào div có id="navbar-container"
      document.getElementById("navbar-container").innerHTML = data;

      // Sau khi chèn navbar, nạp thêm CSS & JS của navbar nếu cần
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/trangchu/navbar/navbarfinalcss.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "/trangchu/navbar/navbarfinaljs.js";
      document.body.appendChild(script);
    })
    .catch((error) => console.error("Lỗi khi tải navbar:", error));
});
