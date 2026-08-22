(() => {
  "use strict";

  const CART_KEY = "ae_cart_v1";
  const COUPON_KEY = "ae_selected_coupon";
  const PAYMENT_IDENTIFIER = "7975184292@superyes";
  const FREE_THRESHOLD = 499;
  const SHIPPING_CHARGE = 199;
  const TAX_RATE = 0.18;
  const COUPONS = {
    ARES10: { min: 299, discount: 10 },
    ARES50: { min: 699, discount: 50 },
    ARES99: { min: 999, discount: 99 },
    ARES149: { min: 1999, discount: 149 },
    ARES250: { min: 2999, discount: 250 },
    ARES500: { min: 4999, discount: 500 },
    FREESHIP: { min: 499, freeDelivery: true },
    WELCOME100: { min: 0, discount: 100 },
  };

  const addressStep = document.getElementById("addressStep");
  const paymentStep = document.getElementById("paymentStep");
  const confirmationStep = document.getElementById("confirmationStep");
  const addressForm = document.getElementById("addressForm");
  const formError = document.getElementById("addressFormError");
  const checkoutTotal = document.getElementById("checkoutTotal");
  const paymentQr = document.getElementById("paymentQr");
  const paymentCompleted = document.getElementById("paymentCompleted");
  const downloadReceipt = document.getElementById("downloadReceipt");
  const indicators = document.querySelectorAll("[data-step-indicator]");

  function formatRupee(value) {
    return `₹${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && Number.isFinite(Number(item.price)))
        .map((item) => ({
          title: typeof item.title === "string" ? item.title : "Product",
          price: Math.max(0, Number(item.price)),
          qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
        }));
    } catch {
      return [];
    }
  }

  function calculateOrder() {
    const items = loadCart();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const couponCode = localStorage.getItem(COUPON_KEY) || "";
    const coupon = COUPONS[couponCode];
    let shipping = subtotal < FREE_THRESHOLD ? SHIPPING_CHARGE : 0;
    let discount = 0;

    if (coupon && subtotal >= coupon.min) {
      if (coupon.freeDelivery) shipping = 0;
      else discount = coupon.discount || 0;
    }

    const tax = subtotal * TAX_RATE;
    return {
      items,
      subtotal,
      discount,
      shipping,
      tax,
      total: Math.max(0, subtotal + shipping + tax - discount),
    };
  }

  function calculateTotal() {
    return calculateOrder().total;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStep(step) {
    const showAddress = step === "address";
    addressStep.classList.toggle("is-hidden", !showAddress);
    paymentStep.classList.toggle("is-hidden", showAddress);
    indicators.forEach((indicator) => {
      indicator.classList.toggle(
        "active",
        indicator.dataset.stepIndicator === step,
      );
    });
  }

  function setFieldError(input, message) {
    const error = document.querySelector(`[data-error-for="${input.id}"]`);
    input.classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  }

  function validateField(input) {
    const value = input.value.trim();
    let message = "";
    if (input.required && !value) message = "This field is required.";
    else if (input.id === "mobileNumber" && !/^\d{10}$/.test(value)) {
      message = "Enter a valid 10-digit mobile number.";
    } else if (input.id === "pinCode" && !/^[1-9]\d{5}$/.test(value)) {
      message = "Enter a valid 6-digit Indian PIN code.";
    }
      setFieldError(input, message);
    return !message;
  }

  function generateQr() {
    if (!paymentQr || typeof QRCode === "undefined") return;
    paymentQr.replaceChildren();
    const amount = calculateTotal().toFixed(2);
    const payload = `upi://pay?pa=${encodeURIComponent(PAYMENT_IDENTIFIER)}&pn=Ares%20Electronics%20Hub&am=${amount}&cu=INR`;
    new QRCode(paymentQr, {
      text: payload,
      width: 260,
      height: 260,
      colorDark: "#061b33",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function showPayment() {
    checkoutTotal.textContent = formatRupee(calculateTotal());
    setStep("payment");
    generateQr();
  }

  function renderReceipt() {
    const order = calculateOrder();
    const values = Object.fromEntries(new FormData(addressForm).entries());
    const orderId = `ARES-${Date.now().toString(36).toUpperCase()}`;
    const orderDate = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
    document.getElementById("receiptOrderId").textContent = orderId;
    document.getElementById("receiptOrderDate").textContent = orderDate;
    document.getElementById("receiptCustomerName").textContent = values.fullName;
    document.getElementById("receiptAddress").textContent = [
      values.house,
      values.street,
      values.city,
      values.state,
      values.landmark,
    ].filter(Boolean).join(", ");
    document.getElementById("receiptPinCode").textContent = values.pinCode;
    document.getElementById("receiptProducts").innerHTML = order.items.map((item) => `
      <div class="receipt-product">
        <span>${escapeHTML(item.title || "Product")}</span>
        <span>${item.qty} × ${formatRupee(item.price)}</span>
        <strong>${formatRupee(item.price * item.qty)}</strong>
      </div>`).join("");
    document.getElementById("receiptTotals").innerHTML = `
      <div><span>Subtotal</span><strong>${formatRupee(order.subtotal)}</strong></div>
      <div><span>Discount/Coupon</span><strong>-${formatRupee(order.discount)}</strong></div>
      <div><span>Shipping</span><strong>${order.shipping ? formatRupee(order.shipping) : "Free"}</strong></div>
      <div><span>Tax</span><strong>${formatRupee(order.tax)}</strong></div>
      <div class="receipt-grand"><span>Final Total</span><strong>${formatRupee(order.total)}</strong></div>`;
    downloadReceipt.dataset.orderId = orderId;
    downloadReceipt.dataset.orderDate = orderDate;
    downloadReceipt.dataset.customerName = values.fullName;
    downloadReceipt.dataset.address = [values.house, values.street, values.city, values.state, values.landmark]
      .filter(Boolean).join(", ");
    downloadReceipt.dataset.pinCode = values.pinCode;
    downloadReceipt.dataset.products = order.items.map((item) => `${item.title} (${item.qty} x ${formatRupee(item.price)})`).join("; ");
    downloadReceipt.dataset.totals = `Subtotal: ${formatRupee(order.subtotal)} | Discount/Coupon: -${formatRupee(order.discount)} | Shipping: ${order.shipping ? formatRupee(order.shipping) : "Free"} | Tax: ${formatRupee(order.tax)} | Final Total: ${formatRupee(order.total)}`;
  }

  addressForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [...addressForm.querySelectorAll("input")];
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      formError.textContent = "Please correct the highlighted fields.";
      fields.find((field) => field.classList.contains("invalid"))?.focus();
      return;
    }
    formError.textContent = "";
    showPayment();
  });

  addressForm.addEventListener("input", (event) => {
    if (event.target.matches("input")) validateField(event.target);
    if (formError.textContent) formError.textContent = "";
  });

  paymentCompleted.addEventListener("click", () => {
    paymentStep.classList.add("is-hidden");
    confirmationStep.classList.remove("is-hidden");
    renderReceipt();
  });

  downloadReceipt.addEventListener("click", () => {
    const receipt = [
      "ARES ELECTRONICS HUB - ORDER RECEIPT",
      "ORDER CONFIRMED",
      "Payment Successful",
      `Order ID: ${downloadReceipt.dataset.orderId}`,
      `Order Date: ${downloadReceipt.dataset.orderDate}`,
      `Customer Name: ${downloadReceipt.dataset.customerName}`,
      `Delivery Address: ${downloadReceipt.dataset.address}`,
      `PIN Code: ${downloadReceipt.dataset.pinCode}`,
      `Ordered Products: ${downloadReceipt.dataset.products}`,
      downloadReceipt.dataset.totals,
      "Payment Status: PAID",
      "Delivery Status: ORDER CONFIRMED",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadReceipt.dataset.orderId}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });

  if (loadCart().length === 0) {
    formError.textContent = "Your cart is empty. Please add an item before checkout.";
    addressForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = true;
    });
  }
})();
