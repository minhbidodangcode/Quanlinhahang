/* ---------------------------------
   BTL - MENU JS
   - Search + Filter
   - Cart drawer with qty +/- and clear
   - Persist cart on reload (localStorage _cart_temp)
   - Checkout -> save `cart` (array) then goto datban.html
----------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- DOM refs ---------- */
  const searchBox = document.getElementById("search-box");
  const filterCat = document.getElementById("filter-cat");
  const allCards = Array.from(document.querySelectorAll(".menu-card"));
  // .order-btn được bắt bằng delegation bên dưới

  // CART
  const cartBtn = document.getElementById("cart-btn");
  const cartCount = document.getElementById("cart-count");
  const cartDrawer = document.getElementById("cart-drawer");
  const closeCart = document.getElementById("close-cart");
  const cartItemsWrap = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const clearCartBtn = document.getElementById("clear-cart");
  const toast = document.getElementById("toast");

  /* ---------- Constants ---------- */
  const LS_CART_KEY = "cart";         // dùng cho trang Đặt bàn
  const LS_CART_TEMP = "_cart_temp";  // giữ giỏ tạm ở trang Menu

  /* ---------- State ---------- */
  // Dạng object: { "Tên món": { name, price, qty } }
  const cart = {};

  /* ---------- Helpers ---------- */
  function formatVND(n) {
    if (isNaN(n)) return "0₫";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
  }

  function showToast(msg, time = 1600) {
    if (!toast) return alert(msg);
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), time);
  }

  function slugifyName(name) {
    return String(name)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function saveCartTemp() {
    try {
      localStorage.setItem(LS_CART_TEMP, JSON.stringify(cart));
    } catch (e) {
      console.warn("Không thể lưu giỏ tạm:", e);
    }
  }

  function restoreCartTemp() {
    try {
      const raw = localStorage.getItem(LS_CART_TEMP);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        for (const [k, v] of Object.entries(obj)) {
          cart[k] = { name: v.name, price: Number(v.price) || 0, qty: Number(v.qty) || 0 };
        }
      }
    } catch {}
  }

  /* ---------- Search / Filter ---------- */
  function applyFilters() {
    const query = (searchBox?.value || "").trim().toLowerCase();
    const cat = filterCat?.value || "all";

    allCards.forEach((card) => {
      const hay = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
      const itemCat = card.getAttribute("data-cat") || "other";
      const matchText = !query || hay.includes(query);
      const matchCat = cat === "all" || itemCat === cat;
      card.style.display = matchText && matchCat ? "" : "none";
    });
  }

  /* ---------- Cart UI ---------- */
  function updateCartUI() {
    // Render danh sách
    cartItemsWrap.innerHTML = "";
    let total = 0;
    let totalQty = 0;

    const entries = Object.values(cart);
    if (entries.length === 0) {
      cartItemsWrap.innerHTML = `<p class="empty">Giỏ hàng trống.</p>`;
      cartTotalEl.textContent = "0₫";
      if (cartCount) cartCount.textContent = "0";
      // Lưu tạm
      saveCartTemp();
      return;
    }

    entries.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-item"; // layout đẹp

      row.innerHTML = `
        <div class="ci-name">${item.name}</div>
        <div class="ci-qty">
          <button class="qty-btn" data-name="${item.name}" data-action="dec" aria-label="Giảm">−</button>
          <input class="ci-qty-input" type="text" inputmode="numeric" value="${item.qty}" aria-label="Số lượng" />
          <button class="qty-btn" data-name="${item.name}" data-action="inc" aria-label="Tăng">+</button>
        </div>
        <div class="ci-price">${formatVND(item.price * item.qty)}</div>
        <button class="ci-remove" data-name="${item.name}" aria-label="Xoá">✕</button>
      `;
      cartItemsWrap.appendChild(row);
      total += item.price * item.qty;
      totalQty += item.qty;
    });

    cartTotalEl.textContent = formatVND(total);
    if (cartCount) {
      cartCount.textContent = totalQty;
      // Animation nảy nhẹ
      cartCount.style.animation = "none";
      requestAnimationFrame(() => {
        cartCount.style.animation = "bounceScale 0.5s ease";
      });
    }

    // Nút +/- trong giỏ
    cartItemsWrap.querySelectorAll(".ci-qty .qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const action = btn.dataset.action;
        if (!cart[name]) return;
        if (action === "inc") cart[name].qty += 1;
        if (action === "dec") {
          cart[name].qty -= 1;
          if (cart[name].qty <= 0) delete cart[name];
        }
        updateCartUI();
      });
    });

    // Sửa số lượng trực tiếp
    cartItemsWrap.querySelectorAll(".ci-qty-input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const name = inp
          .closest(".cart-item")
          .querySelector(".ci-remove")
          .dataset.name;
        const v = Math.max(1, parseInt(inp.value.replace(/\D/g, "") || "1", 10));
        if (!cart[name]) return;
        cart[name].qty = v;
        updateCartUI();
      });
    });

    // Nút xóa
    cartItemsWrap.querySelectorAll(".ci-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        delete cart[name];
        updateCartUI();
      });
    });

    // Lưu tạm mỗi lần render
    saveCartTemp();
  }

  /* ---------- Order buttons (delegation, robust to DOM changes) ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-btn");
    if (!btn) return;

    // Ưu tiên data-* trên button; fallback sang menu-card
    const card = btn.closest(".menu-card");
    const name =
      btn.dataset.name?.trim() ||
      card?.querySelector("h3")?.textContent?.trim() ||
      card?.querySelector(".card-title")?.textContent?.trim() ||
      card?.getAttribute("data-name") ||
      btn.textContent.trim();

    const priceStr =
      btn.dataset.price ||
      card?.getAttribute("data-price") ||
      card?.querySelector("[data-price]")?.getAttribute("data-price") ||
      "0";

    const price = Number(priceStr);

    if (!name || isNaN(price) || price <= 0) {
      console.warn("Thiếu name/price khi thêm món:", { name, priceStr, card, btn });
      showToast("Không thể thêm món. Dữ liệu không hợp lệ.");
      return;
    }

    if (!cart[name]) cart[name] = { name, price, qty: 0 };
    cart[name].qty += 1;
    updateCartUI();
    if (cartDrawer) cartDrawer.classList.add("open");
    showToast(`Đã thêm "${name}" vào giỏ.`);
  });

  /* ---------- Cart actions ---------- */
  cartBtn?.addEventListener("click", () => {
    cartDrawer?.classList.toggle("open");
  });

  closeCart?.addEventListener("click", () => {
    cartDrawer?.classList.remove("open");
  });

  clearCartBtn?.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
      showToast("Giỏ hàng đã trống.");
      return;
    }
    if (confirm("Xoá toàn bộ giỏ hàng?")) {
      for (const k of Object.keys(cart)) delete cart[k];
      updateCartUI();
      showToast("Đã xoá giỏ hàng.");
    }
  });

  checkoutBtn?.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
      showToast("Giỏ hàng trống.");
      return;
    }

    // Convert -> mảng [{id,name,price,qty}] cho datban.js
    const cartArray = Object.values(cart).map((i, idx) => ({
      id: slugifyName(i.name) || `item-${idx + 1}`,
      name: i.name,
      price: Number(i.price),
      qty: Number(i.qty),
    }));

    try {
      localStorage.setItem(LS_CART_KEY, JSON.stringify(cartArray));
    } catch (e) {
      console.error("Không thể lưu giỏ hàng:", e);
      showToast("Không thể lưu giỏ hàng. Vui lòng thử lại.");
      return;
    }

    // Dọn giỏ tạm và đi đến trang đặt bàn
    localStorage.removeItem(LS_CART_TEMP);
    window.location.href = "datban.html";
  });

  // Đóng giỏ khi click bên ngoài
  document.addEventListener("click", (e) => {
    if (
      cartDrawer?.classList.contains("open") &&
      !cartDrawer.contains(e.target) &&
      !cartBtn?.contains(e.target)
    ) {
      const isQtyBtn = e.target.classList && e.target.classList.contains("qty-btn");
      if (!isQtyBtn) cartDrawer.classList.remove("open");
    }
  });

  // ESC để đóng giỏ
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartDrawer?.classList.contains("open")) {
      cartDrawer.classList.remove("open");
    }
  });

  /* ---------- Scroll reveal (tuỳ chọn) ---------- */
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("revealed");
    });
  }, observerOptions);
  allCards.forEach((c) => cardObserver.observe(c));

  /* ---------- Navbar injection (tuỳ chọn) ---------- */
  const navbarContainer = document.getElementById("navbar-container");
  if (navbarContainer) {
    fetch("../navbar/navbarfinal.html")
      .then((res) => res.text())
      .then((html) => {
        navbarContainer.innerHTML = html;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "../navbar/navbarfinalcss.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "../navbar/navbarfinaljs.js";
        document.body.appendChild(script);
      })
      .catch((err) => console.error("Lỗi khi tải navbar:", err));
  }

  /* ---------- Init ---------- */
  restoreCartTemp();
  applyFilters();
  updateCartUI();

  // Events
  searchBox?.addEventListener("input", applyFilters);
  filterCat?.addEventListener("change", applyFilters);
});
