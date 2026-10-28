const cartKey = "novashop-cart-v1";
const couponKey = "novashop-coupon-v1";
const linesKey = "novashop-checkout-lines-v1";
const lastOrderKey = "novashop-last-demo-order-v1";
const ordersKey = "novashop-demo-orders-v1";
const accountSessionKey = "house-of-eloria-session-v1";
const checkoutMain = document.querySelector("#checkout-main");
const checkoutItems = document.querySelector("#checkout-items");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutError = document.querySelector("#checkout-error");
const submitButton = document.querySelector("#place-order-button");
const toast = document.querySelector("#checkout-toast");
let lines = [];
let couponApplied = false;
let submitTimer;
let toastTimer;

const money = (value) => `$${value.toFixed(2)}`;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2500);
}

function applySavedTheme() {
  try {
    const storedSettings = localStorage.getItem("house-of-eloria-settings-v1");
    if (!storedSettings) return;
    const settings = JSON.parse(storedSettings);
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new TypeError("Saved appearance preferences are invalid");
    }
    document.body.classList.toggle("dark-mode", settings.theme !== "light");
  } catch (error) {
    showToast(`Appearance preferences could not be loaded: ${error.message}`);
  }
}

function loadCheckoutData() {
  try {
    const storedLines = sessionStorage.getItem(linesKey);
    const parsedLines = storedLines ? JSON.parse(storedLines) : [];
    if (!Array.isArray(parsedLines)) throw new TypeError("Saved cart data is not a list");

    lines = parsedLines.filter((item) =>
      item
      && typeof item.id === "string"
      && typeof item.name === "string"
      && typeof item.description === "string"
      && typeof item.image === "string"
      && Number.isFinite(item.price)
      && item.price >= 0
      && Number.isInteger(item.quantity)
      && item.quantity > 0
      && item.quantity <= 50
    ).map((item) => ({
      id: item.id.slice(0, 60),
      name: item.name.slice(0, 100),
      description: item.description.slice(0, 120),
      image: item.image.startsWith("https://") || item.image.startsWith("images/")
        ? item.image
        : "images/product-placeholder.svg",
      price: item.price,
      quantity: item.quantity,
    }));
    couponApplied = sessionStorage.getItem(couponKey) === "NOVA10";
  } catch (error) {
    lines = [];
    couponApplied = false;
    showToast(`Your saved cart could not be loaded: ${error.message}`);
  }
}

function appendText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function totals() {
  const subtotal = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal > 0 && subtotal < 50 ? 5 : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

function renderSummary() {
  checkoutItems.replaceChildren();
  for (const item of lines) {
    const row = document.createElement("article");
    row.className = "checkout-item";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = "";
    image.addEventListener("error", () => {
      image.src = "images/product-placeholder.svg";
    }, { once: true });
    row.append(image);

    const details = document.createElement("div");
    details.className = "checkout-item-details";
    appendText(details, "strong", "", item.name);
    appendText(details, "span", "", item.description);
    appendText(details, "span", "checkout-quantity", `Qty ${item.quantity}`);
    row.append(details);
    appendText(row, "strong", "checkout-line-total", money(item.price * item.quantity));
    checkoutItems.append(row);
  }
  if (!lines.length) appendText(checkoutItems, "p", "empty-checkout-items", "Your cart is empty. Add a few favorites before checkout.");

  const itemCount = lines.reduce((count, item) => count + item.quantity, 0);
  const orderTotals = totals();
  document.querySelector("#summary-count").textContent = `(${itemCount} ${itemCount === 1 ? "item" : "items"})`;
  document.querySelector("#checkout-subtotal").textContent = money(orderTotals.subtotal);
  document.querySelector("#checkout-discount").textContent = `-${money(orderTotals.discount)}`;
  document.querySelector("#checkout-shipping").textContent = orderTotals.shipping ? money(orderTotals.shipping) : "Free";
  document.querySelector("#checkout-total").textContent = money(orderTotals.total);
  submitButton.disabled = itemCount === 0;
  checkoutForm.hidden = itemCount === 0;
  document.querySelector("#checkout-empty-message").hidden = itemCount !== 0;
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  document.querySelector(`#${field.id}-error`).textContent = "";
}

function validateForm() {
  checkoutError.textContent = "";
  const fields = [...checkoutForm.querySelectorAll("input[required]")];
  for (const field of fields) clearFieldError(field);

  const errors = new Map();
  const name = checkoutForm.elements.name.value.trim();
  const email = checkoutForm.elements.email.value.trim();
  const phone = checkoutForm.elements.phone.value.trim();
  const address = checkoutForm.elements.address.value.trim();
  const city = checkoutForm.elements.city.value.trim();
  const region = checkoutForm.elements.region.value.trim();
  const phoneDigits = phone.replace(/\D/g, "").length;

  if (name.length < 2) errors.set("customer-name", "Enter your full name.");
  if (!checkoutForm.elements.email.checkValidity()) errors.set("customer-email", "Enter a valid email address.");
  if (phoneDigits < 7 || phoneDigits > 15) errors.set("customer-phone", "Enter a valid phone number.");
  if (address.length < 5) errors.set("customer-address", "Enter a complete street address.");
  if (!city) errors.set("customer-city", "Enter your city or town.");
  if (!region) errors.set("customer-region", "Enter your state or region.");

  for (const [fieldId, message] of errors) {
    const field = document.getElementById(fieldId);
    field.setAttribute("aria-invalid", "true");
    document.querySelector(`#${fieldId}-error`).textContent = message;
  }
  if (errors.size) {
    document.getElementById(errors.keys().next().value).focus();
    return null;
  }

  const instructions = checkoutForm.elements.instructions.value.trim();
  if (instructions.length > 250) {
    checkoutError.textContent = "Delivery instructions must be 250 characters or fewer.";
    checkoutForm.elements.instructions.focus();
    return null;
  }

  return { name, email, phone, address, city, region, instructions };
}

function createOrderReference() {
  const date = new Date();
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NOVA-${day}-${suffix}`;
}

function readOrderHistory() {
  const storedOrders = localStorage.getItem(ordersKey);
  const orders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(orders)) throw new TypeError("Saved order history is not a list");
  const isValidOrder = (order) => Boolean(
    order
    && typeof order === "object"
    && typeof order.reference === "string"
    && (order.accountId === undefined || order.accountId === null || typeof order.accountId === "string")
    && typeof order.createdAt === "string"
    && Number.isFinite(Date.parse(order.createdAt))
    && Array.isArray(order.items)
    && order.items.length > 0
    && order.items.every((item) => (
      item
      && typeof item.name === "string"
      && Number.isFinite(item.price)
      && item.price >= 0
      && Number.isInteger(item.quantity)
      && item.quantity > 0
    ))
    && ["subtotal", "discount", "shipping", "total"].every((key) => (
      Number.isFinite(order[key]) && order[key] >= 0
    )),
  );
  if (!orders.every(isValidOrder)) throw new TypeError("One or more saved order records are invalid");

  const storedLastOrder = localStorage.getItem(lastOrderKey);
  const previousOrder = storedLastOrder ? JSON.parse(storedLastOrder) : null;
  if (previousOrder && !isValidOrder(previousOrder)) throw new TypeError("The previous saved order is invalid");
  const history = previousOrder && !orders.some((item) => item.reference === previousOrder.reference)
    ? [...orders, previousOrder]
    : orders;
  return history;
}

function createWhatsAppOrderMessage(order, customer) {
  const itemLines = order.items.map((item) => (
    `- ${item.quantity} x ${item.name}: ${money(item.price * item.quantity)}`
  ));
  const address = [customer.address, customer.city, customer.region].filter(Boolean).join(", ");
  const messageLines = [
    "House of Eloria order",
    `Reference: ${order.reference}`,
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery address: ${address}`,
    ...(customer.instructions ? [`Delivery instructions: ${customer.instructions}`] : []),
    "",
    "Items:",
    ...itemLines,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Discount: -${money(order.discount)}`,
    `Shipping: ${money(order.shipping)}`,
    `Total: ${money(order.total)}`,
  ];
  return messageLines.join("\n");
}

function showConfirmation(order, customer) {
  const backLink = document.createElement("a");
  backLink.className = "back-to-store";
  backLink.href = "index.html";
  backLink.textContent = "← Continue shopping";

  const confirmation = document.createElement("section");
  confirmation.className = "order-confirmation";
  confirmation.setAttribute("aria-labelledby", "confirmation-heading");
  const icon = document.createElement("div");
  icon.className = "confirmation-check";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✓";
  confirmation.append(icon);
  appendText(confirmation, "p", "checkout-kicker", "Demo order preview");
  appendText(confirmation, "h1", "", "Your order is ready");
  appendText(confirmation, "p", "confirmation-reference", `Reference ${order.reference}`);
  appendText(confirmation, "p", "confirmation-copy", "Your demo order was saved in this browser. No payment was collected. Send the prepared order details to House of Eloria on WhatsApp below; WhatsApp will ask you to confirm each message.");
  appendText(confirmation, "h2", "", "Order summary");

  const list = document.createElement("div");
  list.className = "confirmation-lines";
  for (const item of order.items) {
    appendText(list, "div", "", `${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}`);
  }
  confirmation.append(list);
  appendText(confirmation, "p", "confirmation-total", `Total ${money(order.total)}`);

  const whatsappActions = document.createElement("div");
  whatsappActions.className = "whatsapp-order-actions";
  whatsappActions.setAttribute("aria-label", "Send order details on WhatsApp");
  appendText(whatsappActions, "p", "whatsapp-order-prompt", "Send this order to House of Eloria on WhatsApp:");
  const message = createWhatsAppOrderMessage(order, customer);
  const link = document.createElement("a");
  link.className = "whatsapp-order-link";
  link.href = `https://wa.me/2347067051873?text=${encodeURIComponent(message)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Send order on WhatsApp";
  whatsappActions.append(link);
  confirmation.append(whatsappActions);

  checkoutMain.replaceChildren(backLink, confirmation);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function placeDemoOrder(customer) {
  let accountId;
  try {
    accountId = sessionStorage.getItem(accountSessionKey);
  } catch (error) {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Place demo order";
    checkoutError.textContent = `Your sign-in session could not be checked: ${error.message}. Your cart has not been cleared.`;
    return;
  }
  const order = {
    reference: createOrderReference(),
    accountId,
    createdAt: new Date().toISOString(),
    status: "demo-pending",
    items: lines.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    ...totals(),
  };

  try {
    const history = readOrderHistory();
    history.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(history));
    localStorage.setItem(lastOrderKey, JSON.stringify(order));
    sessionStorage.removeItem(cartKey);
    sessionStorage.removeItem(couponKey);
    sessionStorage.removeItem(linesKey);
  } catch (error) {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Place demo order";
    checkoutError.textContent = `The demo order could not be saved: ${error.message}. Your cart has not been cleared.`;
    return;
  }

  showConfirmation(order, customer);
}

checkoutForm.addEventListener("input", (event) => {
  if (event.target.matches("input[required]")) clearFieldError(event.target);
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!lines.length || submitButton.disabled) return;
  const customer = validateForm();
  if (!customer) return;

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Preparing your demo order…";
  submitTimer = setTimeout(() => placeDemoOrder(customer), 550);
});

applySavedTheme();
loadCheckoutData();
renderSummary();
