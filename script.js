const products = window.houseOfEloriaProducts;

const suggestions = [
  {
    id: "ray-ban",
    name: "Ray-Ban Wayfarer",
    description: "Classic Black",
    price: 155,
    stock: 8,
    image: "images/suggestion-sunglasses.jpg",
  },
  {
    id: "nike-air",
    name: "Nike Air Force 1 '07",
    description: "White",
    price: 109.99,
    stock: 10,
    image: "images/suggestion-shoes.jpg",
  },
];

const cartStorageKey = "novashop-cart-v1";
const couponStorageKey = "novashop-coupon-v1";
const recentStorageKey = "house-of-eloria-recent-v1";
const recentProductLimit = 5;
let storageWarning = "";
const settingsStorageKey = "house-of-eloria-settings-v1";
const accountStorageKey = "house-of-eloria-account-v1";
const accountSessionKey = "house-of-eloria-session-v1";
const defaultSettings = {
  theme: "dark",
  autoRotate: true,
  reducedMotion: false,
  compactCards: false,
  showRatings: true,
  showSaleBadges: true,
};

function readSettings() {
  let stored;
  try {
    stored = localStorage.getItem(settingsStorageKey);
  } catch (error) {
    storageWarning = `App settings could not be accessed: ${error.message}`;
    return { ...defaultSettings };
  }
  if (!stored) return { ...defaultSettings };
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      storageWarning = "Saved app settings were invalid; defaults were restored";
      return { ...defaultSettings };
    }
    return {
      ...defaultSettings,
      theme: parsed.theme === "light" ? "light" : "dark",
      autoRotate: typeof parsed.autoRotate === "boolean" ? parsed.autoRotate : defaultSettings.autoRotate,
      reducedMotion: typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : defaultSettings.reducedMotion,
      compactCards: typeof parsed.compactCards === "boolean" ? parsed.compactCards : defaultSettings.compactCards,
      showRatings: typeof parsed.showRatings === "boolean" ? parsed.showRatings : defaultSettings.showRatings,
      showSaleBadges: typeof parsed.showSaleBadges === "boolean" ? parsed.showSaleBadges : defaultSettings.showSaleBadges,
    };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    storageWarning = "Saved app settings could not be read; defaults were restored";
    return { ...defaultSettings };
  }
}

const settings = readSettings();

function cartProduct(id) {
  return products.find((product) => product.id === id)
    ?? suggestions.find((product) => product.id === id);
}

function readStoredRecent() {
  let stored;
  try {
    stored = sessionStorage.getItem(recentStorageKey);
  } catch (error) {
    storageWarning = `Recently viewed items could not be accessed: ${error.message}`;
    return [];
  }
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      storageWarning = "Recently viewed data was invalid; a fresh list was started";
      return [];
    }
    const validIds = parsed.filter((id) => typeof id === "string" && products.some((product) => product.id === id));
    const recent = [...new Set(validIds)].slice(0, recentProductLimit);
    if (recent.length !== parsed.length) {
      storageWarning = "Unavailable recently viewed items were removed";
    }
    return recent;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    storageWarning = "Recently viewed data could not be read; a fresh list was started";
    return [];
  }
}

function readStoredCart() {
  let stored;
  try {
    stored = sessionStorage.getItem(cartStorageKey);
  } catch (error) {
    storageWarning = `Saved cart could not be accessed: ${error.message}`;
    return null;
  }
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      storageWarning = "Saved cart data was invalid; a fresh cart was started";
      return null;
    }
    const storedEntries = Object.entries(parsed);
    const entries = storedEntries.filter(([id, quantity]) => {
      const product = cartProduct(id);
      return product && Number.isInteger(quantity) && quantity > 0 && quantity <= product.stock;
    });
    if (entries.length !== storedEntries.length) {
      storageWarning = "Unavailable items were removed from your saved cart";
    }
    return new Map(entries);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    storageWarning = "Saved cart data could not be read; a fresh cart was started";
    return null;
  }
}

function readStoredCoupon() {
  try {
    return sessionStorage.getItem(couponStorageKey) === "NOVA10";
  } catch (error) {
    storageWarning = `Saved coupon could not be accessed: ${error.message}`;
    return false;
  }
}

const state = {
  cart: readStoredCart() ?? new Map(),
  favorites: new Set(),
  recent: readStoredRecent(),
  category: "All",
  query: "",
  couponApplied: readStoredCoupon(),
};

const money = (value) => `$${value.toFixed(2)}`;
const bestProducts = document.querySelector("#best-products");
const recommendedProducts = document.querySelector("#recommended-products");
const cartItems = document.querySelector("#cart-items");
const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function updateHeaderAccount() {
  const accountActions = document.querySelector("#account-actions");
  const profileButton = document.querySelector("#profile-button");
  const profileImage = profileButton.querySelector("img");
  const profileName = document.querySelector("#profile-name");
  const signoutLink = document.querySelector("#signout-link");
  let stored;

  try {
    stored = localStorage.getItem(accountStorageKey);
  } catch (error) {
    showToast(`Account information could not be accessed: ${error.message}`);
    return;
  }

  if (!stored) return;

  try {
    const accountState = JSON.parse(stored);
    if (!accountState || !Array.isArray(accountState.accounts)) {
      showToast("Saved account information was invalid.");
      return;
    }
    const accountId = sessionStorage.getItem(accountSessionKey);
    const account = accountState.accounts.find((item) => (
      item && typeof item === "object" && item.id === accountId
    ));
    if (!account || typeof account.name !== "string" || typeof account.avatar !== "string") return;
    accountActions.hidden = true;
    profileButton.hidden = false;
    signoutLink.hidden = false;
    profileName.textContent = account.name;
    profileImage.src = account.avatar;
    profileButton.setAttribute("aria-label", `Profile for ${account.name}`);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    showToast("Saved account information could not be read.");
  }
}

function signedInAccount() {
  const accountId = sessionStorage.getItem(accountSessionKey);
  if (!accountId) return null;
  const stored = localStorage.getItem(accountStorageKey);
  if (!stored) return null;
  const accountState = JSON.parse(stored);
  if (!accountState || !Array.isArray(accountState.accounts)) {
    throw new TypeError("Saved account information was invalid");
  }
  return accountState.accounts.find((account) => account?.id === accountId) ?? null;
}

updateHeaderAccount();

function applySettings() {
  document.body.classList.toggle("dark-mode", settings.theme === "dark");
  document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  document.body.classList.toggle("compact-cards", settings.compactCards);
  document.body.classList.toggle("hide-ratings", !settings.showRatings);
  document.body.classList.toggle("hide-sale-badges", !settings.showSaleBadges);
  document.querySelector(".theme-button span:nth-child(2)").textContent = settings.theme === "dark" ? "Light Mode" : "Dark Mode";
  document.querySelector(".theme-button").setAttribute("aria-pressed", String(settings.theme === "dark"));
  document.querySelector("#setting-theme").value = settings.theme;
  for (const [key, id] of [
    ["autoRotate", "setting-autoplay"],
    ["compactCards", "setting-compact"],
    ["reducedMotion", "setting-reduced-motion"],
    ["showRatings", "setting-ratings"],
    ["showSaleBadges", "setting-discounts"],
  ]) {
    document.querySelector(`#${id}`).checked = settings[key];
  }
  updateSlideshowControl();
}

function saveSettings() {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  } catch (error) {
    showToast(`App settings could not be saved: ${error.message}`);
  }
}

const slides = [...document.querySelectorAll(".hero-slide")];
const slideDots = [...document.querySelectorAll("[data-slide-to]")];
let activeSlide = 0;

function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
    slide.inert = !isActive;
  });
  slideDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeSlide;
    dot.classList.toggle("selected", isActive);
    dot.setAttribute("aria-pressed", String(isActive));
  });
}

function updateSlideshowControl() {
  const button = document.querySelector(".hero-pause");
  button.textContent = settings.autoRotate ? "Ⅱ" : "▶";
  button.setAttribute("aria-label", settings.autoRotate ? "Pause slideshow" : "Play slideshow");
  button.setAttribute("aria-pressed", String(!settings.autoRotate));
}

applySettings();
if (storageWarning) showToast(storageWarning);

function productCard(product) {
  const favorite = state.favorites.has(product.id);
  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <button class="product-image-button" type="button" data-details="${product.id}" aria-label="View details for ${product.name}">
          <img class="product-image" src="${product.image}" alt="" loading="lazy" />
        </button>
        <span class="sale-badge">-${product.discount}%</span>
        <button class="favorite-button${favorite ? " is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-label="${favorite ? "Remove from" : "Add to"} wishlist">
          <svg viewBox="0 0 24 24"><path d="M20.8 8.6c0 4.5-8.8 10-8.8 10s-8.8-5.5-8.8-10a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" /></svg>
        </button>
      </div>
      <div class="product-info">
        <button class="product-name" type="button" data-details="${product.id}" aria-label="View details for ${product.name}">${product.name}</button>
        <span class="product-category">${product.description}</span>
        <div class="product-price-row"><strong class="product-price">${money(product.price)}</strong><span class="old-price">${money(product.oldPrice)}</span></div>
        <div class="product-rating"><span class="star">★</span><span>${product.rating}</span><span>(${product.reviews})</span>
          <button class="add-cart" type="button" data-add="${product.id}" aria-label="Add ${product.name} to cart">
            <svg viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
          </button>
        </div>
      </div>
    </article>`;
}

function matchesFilter(product) {
  const searchText = `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase();
  const matchesCategory = state.query || state.category === "All" || product.category === state.category;
  return matchesCategory && searchText.includes(state.query.toLocaleLowerCase());
}

function renderProducts() {
  const filtered = products.filter(matchesFilter);
  const best = filtered.slice(0, 4);
  const recommended = [...filtered].reverse().slice(0, 4);
  const empty = '<div class="empty-results">No products found. Try a different search or category.</div>';
  bestProducts.innerHTML = best.length ? best.map(productCard).join("") : empty;
  recommendedProducts.innerHTML = recommended.length ? recommended.map(productCard).join("") : empty;
  const searchStatus = document.querySelector("#search-status");
  searchStatus.textContent = state.query
    ? `${filtered.length} product${filtered.length === 1 ? "" : "s"} found for ${state.query}.`
    : `${filtered.length} products available.`;
}

function cartQuantity() {
  return [...state.cart.values()].reduce((total, quantity) => total + quantity, 0);
}

function persistCart() {
  try {
    sessionStorage.setItem(cartStorageKey, JSON.stringify(Object.fromEntries(state.cart)));
    sessionStorage.setItem(couponStorageKey, state.couponApplied ? "NOVA10" : "");
    const checkoutItems = [...state.cart.entries()].map(([id, quantity]) => ({
      ...cartProduct(id),
      quantity,
    }));
    sessionStorage.setItem("novashop-checkout-lines-v1", JSON.stringify(checkoutItems));
  } catch (error) {
    showToast(`Cart changes could not be saved: ${error.message}`);
  }
}

function renderCart() {
  const entries = [...state.cart.entries()];
  const quantity = cartQuantity();
  const subtotal = entries.reduce((sum, [id, count]) => sum + cartProduct(id).price * count, 0);
  const discount = state.couponApplied ? subtotal * 0.1 : 0;
  cartItems.innerHTML = entries.length
    ? entries.map(([id, count]) => {
      const product = cartProduct(id);
      return `
        <article class="cart-item">
          <img class="cart-image" src="${product.image}" alt="" />
          <div class="cart-item-details">
            <span class="cart-item-name">${product.name}</span>
            <span class="cart-item-variant">${product.description}</span>
            <strong class="cart-item-price">${money(product.price)}</strong>
            <span class="cart-line-total">Line total ${money(product.price * count)}</span>
            <div class="quantity-control" aria-label="Quantity for ${product.name}">
              <button type="button" data-quantity="${id}" data-change="-1" aria-label="Decrease quantity">−</button>
              <span>${count}</span>
              <button type="button" data-quantity="${id}" data-change="1" aria-label="Increase quantity" ${count >= product.stock ? "disabled" : ""}>+</button>
            </div>
          </div>
          <button class="remove-item" type="button" data-remove="${id}" aria-label="Remove ${product.name}">
            <svg viewBox="0 0 24 24"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
          </button>
        </article>`;
    }).join("")
    : '<div class="empty-cart">Your cart is waiting for something lovely.</div>';

  document.querySelector("#cart-count").textContent = `(${quantity})`;
  document.querySelector("#header-cart-count").textContent = quantity;
  document.querySelector(".cart-open-action").setAttribute("aria-label", `My cart, ${quantity} item${quantity === 1 ? "" : "s"}`);
  document.querySelector("#checkout-count").textContent = quantity;
  document.querySelector("#subtotal").textContent = money(subtotal);
  document.querySelector("#discount").textContent = `-${money(discount)}`;
  document.querySelector("#shipping").textContent = subtotal === 0 || subtotal >= 50 ? "Free" : "$5.00";
  const shipping = subtotal > 0 && subtotal < 50 ? 5 : 0;
  document.querySelector("#total").textContent = money(subtotal - discount + shipping);
  document.querySelector("#checkout-button").disabled = quantity === 0;
  persistCart();
}

function renderSuggestions() {
  document.querySelector("#suggestions").innerHTML = suggestions.map((product) => `
    <article class="suggestion-item">
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <div class="suggestion-details"><strong>${product.name}<br />${product.description}</strong><span>${money(product.price)}</span></div>
      <button type="button" data-add="${product.id}" aria-label="Add ${product.name} to cart">+</button>
    </article>`).join("");
}

function renderRecent() {
  const recentItems = document.querySelector("#recent-items");
  const recentProducts = state.recent
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
  recentItems.innerHTML = recentProducts.length
    ? recentProducts.map((product) => `
      <button type="button" data-details="${product.id}" aria-label="View ${product.name} again" title="${product.name}">
        <img src="${product.image}" alt="" loading="lazy" />
      </button>`).join("")
    : '<span class="recent-empty">Products you view will appear here.</span>';
}

function recordProductView(id) {
  state.recent = [id, ...state.recent.filter((recentId) => recentId !== id)].slice(0, recentProductLimit);
  renderRecent();
  try {
    sessionStorage.setItem(recentStorageKey, JSON.stringify(state.recent));
  } catch (error) {
    showToast(`Recently viewed items could not be saved: ${error.message}`);
  }
}

function addToCart(id) {
  const item = cartProduct(id);
  if (!item) {
    showToast("That product is no longer available");
    return;
  }
  const quantity = state.cart.get(id) ?? 0;
  if (quantity >= item.stock) {
    showToast(`Only ${item.stock} ${item.name} available`);
    return;
  }
  state.cart.set(id, quantity + 1);
  renderCart();
  showToast(`${item.name} added to your cart`);
}

function openProductDetails(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  recordProductView(id);
  const dialog = document.querySelector("#product-dialog");
  document.querySelector("#product-detail").innerHTML = `
    <img class="detail-image" src="${product.image}" alt="${product.name}" />
    <div class="detail-copy">
      <button class="detail-close" type="button" aria-label="Close product details">×</button>
      <span class="eyebrow detail-category">${product.category}</span>
      <h2 id="product-detail-name">${product.name}</h2>
      <p class="detail-rating">★ ${product.rating} <span>(${product.reviews} reviews)</span></p>
      <p class="detail-description">${product.description}. Thoughtfully selected for quality, comfort, and everyday style.</p>
      <p class="detail-stock">${product.stock - (state.cart.get(id) ?? 0)} available</p>
      <strong class="detail-price">${money(product.price)} <del>${money(product.oldPrice)}</del></strong>
      <button class="detail-add" type="button" data-add="${product.id}" ${(state.cart.get(id) ?? 0) >= product.stock ? "disabled" : ""}>Add to Cart</button>
    </div>`;
  dialog.showModal();
  dialog.querySelector(".detail-close").focus();
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(addButton.dataset.add);
    if (addButton.classList.contains("detail-add")) document.querySelector("#product-dialog").close();
    return;
  }

  const detailButton = event.target.closest("[data-details]");
  if (detailButton) {
    openProductDetails(detailButton.dataset.details);
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    renderProducts();
    showToast(state.favorites.has(id) ? "Added to your wishlist" : "Removed from your wishlist");
    return;
  }

  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    const next = state.cart.get(id) + Number(quantityButton.dataset.change);
    if (next > cartProduct(id).stock) {
      showToast(`Only ${cartProduct(id).stock} available`);
      return;
    }
    if (next <= 0) state.cart.delete(id);
    else state.cart.set(id, next);
    renderCart();
    return;
  }

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    state.cart.delete(removeButton.dataset.remove);
    renderCart();
    showToast("Item removed from your cart");
    return;
  }

});

document.querySelector("#search-input").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  if (state.query) {
    state.category = "All";
    document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
  }
  renderProducts();
});

document.querySelector("#search-input").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const firstMatch = products.find(matchesFilter);
  if (firstMatch) openProductDetails(firstMatch.id);
  else showToast(`No products found for "${state.query}"`);
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#search-input").focus();
  }
});

document.querySelector("#coupon-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#coupon-code");
  if (input.value.trim().toUpperCase() !== "NOVA10") {
    showToast("Enter NOVA10 to get 10% off");
    return;
  }
  state.couponApplied = true;
  renderCart();
  showToast("NOVA10 applied — 10% off your order");
});

document.querySelector(".close-cart").addEventListener("click", () => {
  state.cart.clear();
  state.couponApplied = false;
  renderCart();
  document.querySelector("#coupon-code").value = "";
  showToast("Your cart has been cleared");
});

const cartDialog = document.querySelector("#cart-dialog");
const cartOpenButton = document.querySelector(".cart-open-action");
cartOpenButton.addEventListener("click", () => cartDialog.showModal());
document.querySelector(".cart-dialog-close").addEventListener("click", () => cartDialog.close());
cartDialog.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  if (cartQuantity() > 0) window.location.href = "checkout.html";
});

const sidebarDialog = document.querySelector("#sidebar-dialog");
const sidebar = document.querySelector("#primary-sidebar");
const sidebarToggle = document.querySelector(".sidebar-toggle");
function closeSidebar() {
  if (sidebarDialog.open) sidebarDialog.close();
  sidebarToggle.setAttribute("aria-expanded", "false");
  sidebarToggle.setAttribute("aria-label", "Open navigation");
}

sidebarToggle.addEventListener("click", () => {
  try {
    if (!signedInAccount()) {
      window.location.assign("account.html?mode=signin&return=sidebar");
      return;
    }
  } catch (error) {
    showToast(`Sign-in status could not be checked: ${error.message}`);
    return;
  }
  sidebarDialog.showModal();
  sidebarToggle.setAttribute("aria-expanded", "true");
  sidebarToggle.setAttribute("aria-label", "Close navigation");
});
sidebarDialog.addEventListener("close", () => {
  sidebarToggle.setAttribute("aria-expanded", "false");
  sidebarToggle.setAttribute("aria-label", "Open navigation");
});
sidebarDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSidebar();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebarDialog.open) {
    event.preventDefault();
    closeSidebar();
  }
});
sidebarDialog.addEventListener("click", (event) => {
  if (event.target === sidebarDialog) closeSidebar();
});
document.addEventListener("pointerdown", (event) => {
  if (!sidebarDialog.open) return;
  const bounds = sidebarDialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left
    || event.clientX > bounds.right
    || event.clientY < bounds.top
    || event.clientY > bounds.bottom
  ) {
    closeSidebar();
  }
});
document.querySelector(".sidebar-close").addEventListener("click", closeSidebar);
sidebar.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

document.querySelector("#product-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget || event.target.closest(".detail-close")) {
    event.currentTarget.close();
  }
});

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = "images/product-placeholder.svg";
}, true);

document.querySelector(".wishlist-action").addEventListener("click", () => {
  if (!state.favorites.size) {
    showToast("Tap a heart to save your favorite finds");
    return;
  }
  state.category = "All";
  state.query = "";
  document.querySelector("#search-input").value = "";
  renderProducts();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  showToast(`${state.favorites.size} item${state.favorites.size === 1 ? "" : "s"} saved to your wishlist`);
});

document.querySelector(".theme-button").addEventListener("click", () => {
  settings.theme = settings.theme === "dark" ? "light" : "dark";
  applySettings();
  saveSettings();
});

document.querySelectorAll(".settings-open-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (sidebarDialog.open) sidebarDialog.close();
    document.querySelector("#settings-dialog").showModal();
  });
});

document.querySelector("#settings-dialog").addEventListener("change", (event) => {
  const field = event.target.closest("[data-setting]");
  if (!field) return;
  settings[field.dataset.setting] = field.type === "checkbox" ? field.checked : field.value;
  applySettings();
  saveSettings();
});

document.querySelector("#settings-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

document.querySelector("#reset-settings").addEventListener("click", () => {
  Object.assign(settings, defaultSettings);
  applySettings();
  saveSettings();
  showToast("App settings restored to defaults");
});

slideDots.forEach((dot) => {
  dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideTo)));
});
document.querySelector(".hero-previous").addEventListener("click", () => showSlide(activeSlide - 1));
document.querySelector(".hero-next").addEventListener("click", () => showSlide(activeSlide + 1));
document.querySelector(".hero-pause").addEventListener("click", () => {
  settings.autoRotate = !settings.autoRotate;
  document.querySelector("#setting-autoplay").checked = settings.autoRotate;
  updateSlideshowControl();
  saveSettings();
});
setInterval(() => {
  if (settings.autoRotate) showSlide(activeSlide + 1);
}, 2000);

document.querySelectorAll(".carousel-dots button").forEach((dot, index) => {
  dot.addEventListener("click", () => {
    document.querySelectorAll(".carousel-dots button").forEach((button) => button.classList.remove("current"));
    dot.classList.add("current");
    const offset = (index * 2) % products.length;
    const nextProducts = [...products.slice(offset), ...products.slice(0, offset)].filter(matchesFilter).slice(0, 4);
    bestProducts.innerHTML = nextProducts.length
      ? nextProducts.map(productCard).join("")
      : '<div class="empty-results">No products found. Try a different search or category.</div>';
  });
});

document.querySelectorAll(".text-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.category = "All";
    state.query = "";
    document.querySelector("#search-input").value = "";
    document.querySelectorAll(".category-item").forEach((item) => item.classList.toggle("selected", item.dataset.category === "All"));
    renderProducts();
    document.querySelector(button.dataset.view === "recommended" ? "#recommended-products" : "#best-products")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

let countdownSeconds = 2 * 3600 + 45 * 60 + 10;
setInterval(() => {
  countdownSeconds = countdownSeconds > 0 ? countdownSeconds - 1 : 3 * 3600;
  const hours = String(Math.floor(countdownSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(countdownSeconds % 60).padStart(2, "0");
  document.querySelector("#countdown").textContent = `${hours} : ${minutes} : ${seconds}`;
}, 1000);

renderProducts();
renderCart();
renderSuggestions();
renderRecent();
if (state.couponApplied) document.querySelector("#coupon-code").value = "NOVA10";
if (new URLSearchParams(window.location.search).get("cart") === "open") cartDialog.showModal();
if (new URLSearchParams(window.location.search).get("openSidebar") === "1") {
  try {
    if (signedInAccount()) {
      sidebarDialog.showModal();
      sidebarToggle.setAttribute("aria-expanded", "true");
      sidebarToggle.setAttribute("aria-label", "Close navigation");
    } else {
      window.location.replace("account.html?mode=signin&return=sidebar");
    }
  } catch (error) {
    showToast(`Sign-in status could not be checked: ${error.message}`);
  }
}
if (storageWarning) showToast(storageWarning);
