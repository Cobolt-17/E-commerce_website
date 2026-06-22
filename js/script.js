const bar = document.getElementById("bar");
const close = document.getElementById("close");
const nav = document.getElementById("navbar");

function openNav() {
  if (nav) {
    nav.classList.add("active");
    document.body.classList.add("nav-open");
  }
}
function closeNav() {
  if (nav) {
    nav.classList.remove("active");
    document.body.classList.remove("nav-open");
  }
}
if (bar) {
  bar.addEventListener("click", openNav);
}
if (close) {
  close.addEventListener("click", (e) => {
    e.preventDefault();
    closeNav();
  });
}

const contactForm = document.getElementById("contact-form-el");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    contactForm.reset();
    showPopup(
      "info",
      "Message Sent",
      "Thank you! We'll get back to you shortly.",
    );
  });
}

const CART_KEY = "ae_cart_v1";

const COUPONS = [
  { code: "ARES10", min: 299, discount: 10, freeDelivery: false },
  { code: "ARES50", min: 699, discount: 50, freeDelivery: false },
  { code: "ARES99", min: 999, discount: 99, freeDelivery: false },
  { code: "ARES149", min: 1999, discount: 149, freeDelivery: false },
  { code: "ARES250", min: 2999, discount: 250, freeDelivery: false },
  { code: "ARES500", min: 4999, discount: 500, freeDelivery: false },
  { code: "FREESHIP", min: 499, discount: 0, freeDelivery: true },
  {
    code: "WELCOME100",
    min: 0,
    discount: 100,
    freeDelivery: false,
    firstOrderOnly: true,
  },
];

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function getCartCount() {
  const items = loadCart();
  return items.reduce((s, it) => s + (it.qty || 0), 0);
}

function updateCartBadge() {
  const anchors = document.querySelectorAll("#navbar a, #mobile a");
  anchors.forEach((a) => {
    const cartIcon = a.querySelector(".fa-cart-shopping");
    if (!cartIcon) return;
    let badge = a.querySelector(".cart-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-badge hidden";
      a.appendChild(badge);
    }
    const count = getCartCount();
    const displayCount = count > 99 ? "99+" : String(count);
    const prev = badge.innerText || "";
    if (count > 0) {
      badge.innerText = displayCount;
      badge.classList.remove("hidden");
      if (prev !== displayCount) {
        badge.classList.add("pulse");
        setTimeout(() => badge.classList.remove("pulse"), 260);
      }
    } else {
      badge.innerText = "";
      badge.classList.add("hidden");
    }
  });
  const headerCount = document.getElementById("cartItemCount");
  if (headerCount) {
    const cnt = getCartCount();
    headerCount.innerText = `${cnt} ITEM${cnt === 1 ? "" : "S"}`;
  }
}

function formatRupee(n) {
  return "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function parsePrice(text) {
  if (!text) return 0;
  const num = text.replace(/[^0-9.]/g, "");
  return Number(num) || 0;
}

document.addEventListener("click", function (e) {
  const cartTrigger = e.target.closest && e.target.closest(".cart.add-to-cart");
  if (!cartTrigger) return;
  e.preventDefault();
  const pro = cartTrigger.closest(".pro");
  if (!pro) return;
  const title =
    pro.querySelector(".des span")?.innerText.trim() ||
    pro.querySelector("h4")?.innerText ||
    "Product";
  const img = pro.querySelector("img")?.getAttribute("src") || "";
  let priceText =
    pro.querySelector(".price-cart h4")?.innerText ||
    pro.querySelector(".des .price")?.innerText ||
    "";
  const price = parsePrice(priceText);
  const items = loadCart();
  const existing = items.find((it) => it.title === title && it.price === price);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    items.push({
      id: Date.now() + Math.random().toString(36).slice(2, 7),
      title,
      price,
      qty: 1,
      img,
    });
  }
  saveCart(items);
  showBanner(`${title} has been added to your cart.`);
});

function showToast(msg) {
  showPopup("info", "", msg);
}

function renderCartPage() {
  const cartContainer = document.querySelector(".cart-container");
  if (!cartContainer) return;
  let items = loadCart();
  const tbody = document.querySelector(".cart-table tbody");
  const totalsEl = document.querySelector(".cart-totals");

  function getSelectedCoupon() {
    return localStorage.getItem("ae_selected_coupon") || "";
  }

  function setSelectedCoupon(code) {
    if (code) {
      localStorage.setItem("ae_selected_coupon", code);
    } else {
      localStorage.removeItem("ae_selected_coupon");
    }
    updateCouponRow();
  }

  function closeCouponDrawer() {
    const overlay = document.getElementById("couponOverlay");
    const drawer = document.getElementById("couponDrawer");
    if (overlay && drawer) {
      drawer.classList.remove("open");
      overlay.classList.remove("show");
    }
  }

  function openCouponDrawer() {
    const overlay = document.getElementById("couponOverlay");
    const drawer = document.getElementById("couponDrawer");
    const searchOverlay = document.getElementById("searchResults");
    if (searchOverlay) {
      searchOverlay.style.display = "none";
    }
    if (overlay && drawer) {
      overlay.classList.add("show");
      drawer.classList.add("open");
      renderCouponsInDrawer();
      if (!overlay.dataset._couponClose) {
        overlay.addEventListener("click", closeCouponDrawer);
        overlay.dataset._couponClose = "1";
      }
      const closeBtn = document.getElementById("closeCouponDrawer");
      if (closeBtn && !closeBtn.dataset._attached) {
        closeBtn.addEventListener("click", closeCouponDrawer);
        closeBtn.dataset._attached = "1";
      }
    }
  }

  function updateCouponRow() {
    const cntEl = document.getElementById("couponCount");
    const amtEl = document.getElementById("couponAmount");
    const labelEl = document.querySelector(".coupon-label");
    const code = getSelectedCoupon();
    let discount = 0;
    if (code) {
      const f = COUPONS.find((c) => c.code === code);
      if (f) {
        discount = f.freeDelivery ? 0 : f.discount || 0;
        if (cntEl) cntEl.innerText = "1";
        if (amtEl) amtEl.innerText = "-" + formatRupee(discount);
        if (labelEl) labelEl.innerText = "Coupons Applied (1)";
      } else {
        if (cntEl) cntEl.innerText = "0";
        if (amtEl) amtEl.innerText = "-₹0.00";
        if (labelEl) labelEl.innerText = "View Available Coupons";
      }
    } else {
      if (cntEl) cntEl.innerText = "0";
      if (amtEl) amtEl.innerText = "-₹0.00";
      if (labelEl) labelEl.innerText = "View Available Coupons";
    }
  }

  function renderCouponsInDrawer() {
    const container = document.getElementById("couponList");
    if (!container) return;
    container.innerHTML = "";
    const subtotal = items.reduce((s, it) => s + it.price * (it.qty || 1), 0);
    const FREE_THRESHOLD = 499;
    const SHIPPING_CHARGE = 199;
    let best = null;
    let bestSaving = 0;
    COUPONS.forEach((c) => {
      const eligible = subtotal >= c.min;
      let saving = 0;
      if (eligible) {
        saving = c.freeDelivery
          ? subtotal < FREE_THRESHOLD
            ? SHIPPING_CHARGE
            : 0
          : c.discount || 0;
        if (saving > bestSaving) {
          bestSaving = saving;
          best = c;
        }
      }
    });
    COUPONS.forEach((c) => {
      const card = document.createElement("div");
      card.className =
        "coupon-card" +
        (c === best ? " best" : "") +
        (subtotal >= c.min ? " eligible" : " disabled");
      const isApplied = getSelectedCoupon() === c.code;
      const buttonLabel = isApplied ? "REMOVE" : "APPLY";
      const buttonClass = isApplied ? "applied" : "";
      const disabledAttr = !isApplied && subtotal < c.min ? "disabled" : "";
      card.innerHTML = `<div class="left">${isApplied ? '<div class="best-badge">✓ APPLIED</div>' : ""}<div class="code">${c.code}</div><div class="value">${c.freeDelivery ? "Free Delivery" : '<span class="price-orange">' + formatRupee(c.discount) + "</span> OFF"}</div><div class="desc">${c.freeDelivery ? "Free shipping on orders above " + formatRupee(c.min) : "Get " + formatRupee(c.discount) + " off on orders above " + formatRupee(c.min)}</div></div><div class="right"><button class="apply-btn ${buttonClass}" data-code="${c.code}" ${disabledAttr}>${buttonLabel}</button></div>`;
      if (c === best) {
        const badge = document.createElement("div");
        badge.className = "best-badge";
        badge.innerText = "BEST OFFER";
        card.prepend(badge);
      }
      container.appendChild(card);
    });
    container.querySelectorAll(".apply-btn").forEach((b) => {
      b.onclick = () => {
        const code = b.getAttribute("data-code");
        const current = getSelectedCoupon();
        if (current === code) {
          setSelectedCoupon("");
          closeCouponDrawer();
          renderCartPage();
          showPopup("coupon", "COUPON REMOVED", `${code} has been removed.`);
        } else {
          setSelectedCoupon(code);
          closeCouponDrawer();
          renderCartPage();
          const found = COUPONS.find((x) => x.code === code);
          const saved = found
            ? found.freeDelivery
              ? subtotal < FREE_THRESHOLD
                ? SHIPPING_CHARGE
                : 0
              : found.discount || 0
            : 0;
          showPopup(
            "coupon",
            "COUPON APPLIED",
            `${code} applied successfully.\nYou saved ${formatRupee(saved)}`,
          );
        }
      };
    });
    updateCouponRow();
  }

  if (!items || items.length === 0) {
    cartContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <button id="viewCouponsBtn" class="drawer-open-btn">View Available Coupons</button>
            </div>`;
    updateCartBadge();
    const viewBtn = document.getElementById("viewCouponsBtn");
    if (viewBtn) {
      viewBtn.onclick = openCouponDrawer;
    }
    return;
  }

  function calculate() {
    const subtotal = items.reduce((s, it) => s + it.price * (it.qty || 1), 0);
    const FREE_THRESHOLD = 499;
    const SHIPPING_CHARGE = 199;
    const TAX_RATE = 0.18;
    let shipping = 0;
    let deliveryMessage = "";
    if (subtotal < FREE_THRESHOLD) {
      shipping = SHIPPING_CHARGE;
      const diff = Math.max(0, FREE_THRESHOLD - subtotal);
      deliveryMessage = `Add ${formatRupee(diff)} to get free delivery`;
    }
    const couponCode = getSelectedCoupon();
    let couponDiscount = 0;
    let couponMessage = "";
    if (couponCode) {
      const found = COUPONS.find((c) => c.code === couponCode);
      if (found) {
        if (subtotal >= found.min) {
          if (found.freeDelivery) {
            shipping = 0;
            couponMessage = `Coupon ${found.code} applied: Free delivery`;
          } else if (found.discount) {
            couponDiscount = found.discount;
            couponMessage = `Coupon ${found.code} applied: ${formatRupee(found.discount)} off`;
          }
        } else {
          couponMessage = `Coupon ${found.code} not applicable`;
          setSelectedCoupon("");
        }
      } else {
        couponMessage = `Coupon ${couponCode} not applicable`;
        setSelectedCoupon("");
      }
    }
    const tax = subtotal * TAX_RATE;
    const total = Math.max(0, subtotal + shipping + tax - couponDiscount);
    return {
      subtotal,
      shipping,
      couponDiscount,
      tax,
      total,
      deliveryMessage,
      couponMessage,
    };
  }

  function refresh() {
    items = loadCart();
    if (!tbody) return;
    tbody.innerHTML = "";
    items.forEach((it, idx) => {
      const tr = document.createElement("tr");
      tr.className = "cart-row";
      tr.innerHTML = `
                <td class="product-info">
                    <img src="${it.img}" alt="${it.title}" width="80">
                    <div class="product-details">
                        <h4>${it.title}</h4>
                    </div>
                </td>
                <td data-label="Price"><span class="price-orange">${formatRupee(it.price)}</span></td>
                <td data-label="Quantity">
                    <div class="qty-controls" data-idx="${idx}">
                        <button class="qty-decr" type="button" aria-label="decrease">-</button>
                        <input class="qty-input" type="number" value="${it.qty}" min="1" data-idx="${idx}">
                        <button class="qty-incr" type="button" aria-label="increase">+</button>
                    </div>
                </td>
                <td data-label="Subtotal"><span class="price-orange">${formatRupee(it.price * it.qty)}</span></td>
                <td data-label="Action"><button class="remove action-remove" data-idx="${idx}"><i class="fa-solid fa-trash"></i> Remove</button></td>
            `;
      tbody.appendChild(tr);
    });
    const calc = calculate();

    if (tbody && !tbody.dataset._delegation) {
      tbody.dataset._delegation = "1";

      tbody.addEventListener("click", (ev) => {
        const decr = ev.target.closest(".qty-decr");
        if (decr) {
          const idx = Number(decr.closest(".qty-controls")?.dataset.idx);
          if (!Number.isFinite(idx) || !items[idx]) return;
          items[idx].qty = Math.max(1, (items[idx].qty || 1) - 1);
          saveCart(items);
          renderCartPage();
          return;
        }

        const incr = ev.target.closest(".qty-incr");
        if (incr) {
          const idx = Number(incr.closest(".qty-controls")?.dataset.idx);
          if (!Number.isFinite(idx) || !items[idx]) return;
          items[idx].qty = (items[idx].qty || 1) + 1;
          saveCart(items);
          renderCartPage();
          return;
        }

        const removeBtn = ev.target.closest(".action-remove");
        if (removeBtn) {
          const idx = Number(removeBtn.dataset.idx);
          if (!Number.isFinite(idx) || !items[idx]) return;
          const title = items[idx].title || "Item";
          items.splice(idx, 1);
          saveCart(items);
          renderCartPage();
          showPopup("removed", "ITEM REMOVED", `${title} removed from your cart.`);
        }
      });

      tbody.addEventListener("change", (ev) => {
        const input = ev.target.closest(".qty-input");
        if (!input) return;
        const idx = Number(input.dataset.idx);
        if (!Number.isFinite(idx) || !items[idx]) return;
        let qty = Number(input.value);
        qty = Number.isFinite(qty) && qty >= 1 ? Math.floor(qty) : 1;
        input.value = qty;
        items[idx].qty = qty;
        saveCart(items);
        renderCartPage();
      });
    }
  }

  refresh();

  const clearBtn = document.getElementById("clearCart");
  const clearTop = document.getElementById("clearCartTop");
  const doClear = () => {
    if (!confirm("Clear cart?")) return;
    localStorage.removeItem(CART_KEY);
    renderCartPage();
    updateCartBadge();
  };
  if (clearBtn) clearBtn.onclick = doClear;
  if (clearTop) clearTop.onclick = doClear;

  if (totalsEl) {
    totalsEl.addEventListener("click", (ev) => {
      if (ev.target.closest(".checkout")) {
        alert("Proceeding to checkout — implement as needed.");
      }
    });
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("globalModal");
    const searchOverlay = document.getElementById("searchResults");
    const couponOverlay = document.getElementById("couponOverlay");
    const couponDrawer = document.getElementById("couponDrawer");
    if (modal && modal.classList.contains("show")) {
      modal.classList.remove("show");
    }
    if (searchOverlay && searchOverlay.style.display === "block") {
      searchOverlay.style.display = "none";
    }
    if (couponOverlay && couponDrawer) {
      couponDrawer.classList.remove("open");
      couponOverlay.classList.remove("show");
    }
  }
});

const PRODUCT_CATALOG = [
  {
    id: "p1",
    name: "Arduino Uno R3",
    category: "Arduino Boards",
    price: 699.0,
    img: "../images/product1.jpg",
  },
  {
    id: "p2",
    name: "HC-SR04 Ultrasonic Sensor",
    category: "Sensors",
    price: 149.0,
    img: "../images/product2.jpg",
  },
  {
    id: "p3",
    name: "NEMA 17 Stepper Motor",
    category: "Motors",
    price: 1299.0,
    img: "../images/product3.jpg",
  },
  {
    id: "p4",
    name: "ESP8266 NodeMCU",
    category: "WiFi Modules",
    price: 349.0,
    img: "../images/product4.jpg",
  },
  {
    id: "p5",
    name: "16x2 LCD Display",
    category: "Displays",
    price: 199.0,
    img: "../images/product5.jpg",
  },
  {
    id: "p6",
    name: "Li-ion Battery 3.7V",
    category: "Power Supplies",
    price: 499.0,
    img: "../images/product6.jpg",
  },
];

function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function searchProducts(term) {
  term = term.trim().toLowerCase();
  if (!term) return { results: [], suggestion: null };
  const results = PRODUCT_CATALOG.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term),
  );
  if (results.length > 0) return { results, suggestion: null };
  let closest = null;
  let best = Infinity;
  for (const p of PRODUCT_CATALOG) {
    const dist = levenshtein(term, p.name.toLowerCase());
    if (dist < best) {
      best = dist;
      closest = p;
    }
  }
  if (closest && best <= Math.max(2, Math.floor(closest.name.length / 2))) {
    return { results: [], suggestion: closest.name };
  }
  return { results: [], suggestion: null };
}

function showSearchResults(results, term, suggestion) {
  const overlay = document.getElementById("searchResults");
  if (results && results.length > 0) {
    if (overlay) {
      overlay.innerHTML = results
        .map(
          (p) =>
            `<div class="search-item"><img src="${p.img}" width="48"/> <div><strong>${p.name}</strong><div style="font-size:12px;color:#444">${p.category} • ${formatRupee(p.price)}</div></div></div>`,
        )
        .join("");
      overlay.style.display = "block";
    }
    return;
  }
  if (overlay) {
    overlay.style.display = "none";
  }
  if (suggestion) {
    showPopup("searchError", `NO MATCH`, `Did you mean "${suggestion}"?`);
  } else {
    showPopup("searchError", `NO MATCH`, `No matching products found.`);
  }
}

function showBanner(msg) {
  let b = document.getElementById("cartBanner");
  if (!b) {
    b = document.createElement("div");
    b.id = "cartBanner";
    b.className = "success-banner";
    document.body.insertBefore(b, document.body.firstChild);
  }
  b.innerText = msg;
  b.style.display = "block";
  b.classList.add("visible");
  clearTimeout(window._ae_banner_timer);
  window._ae_banner_timer = setTimeout(() => {
    b.classList.remove("visible");
    setTimeout(() => {
      b.style.display = "none";
    }, 240);
  }, 3000);
}

function showPopup(type, title, message) {
  let modal = document.getElementById("globalModal");
  const searchOverlay = document.getElementById("searchResults");
  const couponOverlay = document.getElementById("couponOverlay");
  const couponDrawer = document.getElementById("couponDrawer");
  if (searchOverlay) {
    searchOverlay.style.display = "none";
  }
  if (couponOverlay) {
    couponOverlay.classList.remove("show");
  }
  if (couponDrawer) {
    couponDrawer.classList.remove("open");
  }
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "globalModal";
    modal.className = "global-modal";
    modal.innerHTML = `<div class="card"><div class="icon">🎉</div><h3></h3><p></p><button class="ok">OK</button></div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector("h3").innerText = title;
  modal.querySelector("p").innerHTML = (message || "")
    .toString()
    .replace(/\n/g, "<br>");
  const icon = modal.querySelector(".icon");
  if (type === "coupon") icon.innerText = "🎉";
  else if (type === "added") icon.innerText = "🛒";
  else if (type === "removed") icon.innerText = "🗑️";
  else if (type === "search") icon.innerText = "🔍";
  else if (type === "searchError" || type === "newsletterError")
    icon.innerText = "❌";
  else if (type === "newsletter") icon.innerText = "✉️";
  else if (type === "info") icon.innerText = "ℹ️";
  else icon.innerText = "";
  modal.classList.add("show");
  modal.onclick = (ev) => {
    if (ev.target === modal) modal.classList.remove("show");
  };
  modal.querySelector(".ok").onclick = () => {
    modal.classList.remove("show");
  };
}

function setupSearchInput() {
  const input = document.getElementById("siteSearch");
  const overlay = document.getElementById("searchResults");
  if (!input) return;
  input.addEventListener("input", (e) => {
    const q = input.value.trim();
    if (!q) {
      if (overlay) overlay.style.display = "none";
      return;
    }
    const { results, suggestion } = searchProducts(q);
    showSearchResults(results, q, suggestion);
  });
  document.addEventListener("click", (ev) => {
    if (
      overlay &&
      !ev.target.closest("#searchResults") &&
      !ev.target.closest("#siteSearch")
    )
      overlay.style.display = "none";
  });
}

function setupNewsletter() {
  const input =
    document.querySelector("footer .form input") ||
    document.querySelector('footer input[placeholder="Enter your email"]');
  const btn =
    document.querySelector("footer .form .sign") ||
    document.querySelector("footer button.sign");
  if (!input || !btn) return;
  input.id = input.id || "newsletterEmail";
  btn.id = btn.id || "newsletterSubscribe";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showPopup(
        "newsletterError",
        "INVALID EMAIL",
        "Please enter a valid email address.",
      );
      return;
    }
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("ae_newsletters") || "[]");
    } catch (e) {
      list = [];
    }
    if (list.includes(email)) {
      showPopup(
        "searchError",
        "ALREADY SUBSCRIBED",
        "This email is already subscribed.",
      );
      return;
    }
    list.push(email);
    localStorage.setItem("ae_newsletters", JSON.stringify(list));
    input.value = "";
    showPopup(
      "newsletter",
      "",
      "Thank you for subscribing to Ares Electronics Hub.",
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window._ae_initialized) return;
  window._ae_initialized = true;
  setupSearchInput();
  setupNewsletter();
  updateCartBadge();
  if (
    window.location.pathname.endsWith("cart.html") ||
    window.location.href.includes("/cart.html")
  ) {
    renderCartPage();
  }
});
