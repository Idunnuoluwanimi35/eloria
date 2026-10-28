const ordersKey = "novashop-demo-orders-v1";
const lastOrderKey = "novashop-last-demo-order-v1";
const accountStorageKey = "house-of-eloria-account-v1";
const accountSessionKey = "house-of-eloria-session-v1";
const ordersList = document.querySelector("#orders-list");
const ordersMessage = document.querySelector("#orders-message");

function isOrderRecord(order) {
  return Boolean(
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
}

function loadOrders() {
  const storedOrders = localStorage.getItem(ordersKey);
  const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(parsedOrders)) throw new TypeError("Saved order history is not a list");
  if (!parsedOrders.every(isOrderRecord)) {
    throw new TypeError("One or more saved order records are invalid");
  }

  const storedLastOrder = localStorage.getItem(lastOrderKey);
  if (!storedLastOrder) return parsedOrders;
  const previousOrder = JSON.parse(storedLastOrder);
  if (!isOrderRecord(previousOrder)) throw new TypeError("The previous saved order is invalid");
  return parsedOrders.some((order) => order.reference === previousOrder.reference)
    ? parsedOrders
    : [...parsedOrders, previousOrder];
}

function appendText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

function renderOrder(order) {
  const card = document.createElement("article");
  card.className = "order-card";

  const header = document.createElement("header");
  header.className = "order-card-header";
  const heading = document.createElement("div");
  appendText(heading, "span", "order-card-label", "Demo checkout");
  appendText(heading, "h2", "", `Order ${order.reference}`);
  appendText(heading, "p", "order-card-date", new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt)));
  appendText(header, "span", "order-status", "Saved locally");
  header.prepend(heading);
  card.append(header);

  const itemList = document.createElement("ul");
  itemList.className = "order-line-list";
  for (const item of order.items) {
    const line = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${item.quantity} × ${item.name}`;
    const price = document.createElement("strong");
    price.textContent = formatMoney(item.price * item.quantity);
    line.append(description, price);
    itemList.append(line);
  }
  card.append(itemList);

  const totals = document.createElement("dl");
  totals.className = "order-totals";
  for (const [label, value] of [
    ["Subtotal", order.subtotal],
    ["Discount", -order.discount],
    ["Shipping", order.shipping],
    ["Total", order.total],
  ]) {
    const row = document.createElement("div");
    row.className = label === "Total" ? "order-grand-total" : "";
    appendText(row, "dt", "", label);
    appendText(row, "dd", "", formatMoney(value));
    totals.append(row);
  }
  card.append(totals);
  return card;
}

function applySavedTheme() {
  const savedSettings = localStorage.getItem("house-of-eloria-settings-v1");
  if (!savedSettings) return;
  const settings = JSON.parse(savedSettings);
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new TypeError("Saved appearance preferences are invalid");
  }
  document.body.classList.toggle("dark-mode", settings.theme !== "light");
}

function getSignedInAccountId() {
  const accountId = sessionStorage.getItem(accountSessionKey);
  if (!accountId) return null;
  const storedAccounts = localStorage.getItem(accountStorageKey);
  if (!storedAccounts) return null;
  const accountState = JSON.parse(storedAccounts);
  if (!accountState || !Array.isArray(accountState.accounts)) {
    throw new TypeError("Saved account information is invalid");
  }
  return accountState.accounts.some((account) => account?.id === accountId) ? accountId : null;
}

try {
  const accountId = getSignedInAccountId();
  if (!accountId) {
    window.location.replace("account.html?mode=signin&return=orders");
    throw new Error("Sign in is required to view your orders");
  }
  applySavedTheme();
  const orders = loadOrders()
    .filter((order) => order.accountId === accountId)
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  document.querySelector("#orders-count").textContent = `${orders.length} ${orders.length === 1 ? "order" : "orders"}`;
  if (orders.length) {
    for (const order of orders) ordersList.append(renderOrder(order));
  } else {
    const empty = document.createElement("div");
    empty.className = "orders-empty";
    appendText(empty, "span", "orders-empty-icon", "◇");
    appendText(empty, "h2", "", "No orders yet");
    appendText(empty, "p", "", "Your completed demo checkouts will appear here.");
    const shopLink = document.createElement("a");
    shopLink.className = "account-primary-button";
    shopLink.href = "index.html";
    shopLink.textContent = "Explore the store";
    empty.append(shopLink);
    ordersList.append(empty);
  }
} catch (error) {
  ordersMessage.hidden = false;
  ordersMessage.textContent = `Order history could not be loaded: ${error.message}`;
}
