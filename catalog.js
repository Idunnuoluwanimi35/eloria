const categoryDescriptions = new Map([
  ["All", "Explore a little bit of everything, all in one place."],
  ["Fashion", "Everyday favorites and polished pieces for your personal style."],
  ["Beauty", "Thoughtful little luxuries for your everyday rituals."],
  ["Electronics", "Useful everyday technology with a considered touch."],
  ["Home & Living", "Comforting details to make your space feel like you."],
  ["Sports", "Easy essentials for movement, training, and time outdoors."],
]);
const cartStorageKey = "novashop-cart-v1";
const checkoutLinesKey = "novashop-checkout-lines-v1";
const products = window.houseOfEloriaProducts;
const requestedCategory = new URLSearchParams(window.location.search).get("category") ?? "All";
const category = categoryDescriptions.has(requestedCategory) ? requestedCategory : "All";
const grid = document.querySelector("#catalog-grid");
const toast = document.querySelector("#catalog-toast");
let toastTimer;
let cart = new Map();

function showFeedback(message, isError = false) {
  const feedback = document.querySelector("#catalog-feedback");
  feedback.textContent = message;
  feedback.hidden = !message;
  feedback.classList.toggle("is-error", isError);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function loadCart() {
  const storedCart = sessionStorage.getItem(cartStorageKey);
  if (!storedCart) return new Map();
  const parsedCart = JSON.parse(storedCart);
  if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) {
    throw new TypeError("Saved cart data is invalid");
  }
  return new Map(Object.entries(parsedCart).filter(([id, quantity]) => (
    products.some((product) => product.id === id)
    && Number.isInteger(quantity)
    && quantity > 0
  )));
}

function cartQuantity() {
  return [...cart.values()].reduce((total, quantity) => total + quantity, 0);
}

function updateCartCount() {
  const quantity = cartQuantity();
  document.querySelector("#catalog-cart-count").textContent = String(quantity);
  document.querySelector(".catalog-cart-link").setAttribute(
    "aria-label",
    `Return to the store to open your cart, ${quantity} items`,
  );
}

function persistCart() {
  const nextCart = Object.fromEntries(cart);
  const checkoutLines = [...cart.entries()].map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { ...product, quantity };
  });
  sessionStorage.setItem(checkoutLinesKey, JSON.stringify(checkoutLines));
  sessionStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "catalog-product-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "catalog-product-image-wrap";
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = "true";
    image.src = "images/product-placeholder.svg";
  });
  const badge = document.createElement("span");
  badge.className = "catalog-sale-badge";
  badge.textContent = `-${product.discount}%`;
  imageWrap.append(image, badge);

  const details = document.createElement("div");
  details.className = "catalog-product-details";
  const categoryLabel = document.createElement("span");
  categoryLabel.className = "catalog-product-category";
  categoryLabel.textContent = product.category;
  const name = document.createElement("h2");
  name.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  const rating = document.createElement("span");
  rating.className = "catalog-product-rating";
  rating.textContent = `★ ${product.rating} · ${product.reviews} reviews`;
  const pricing = document.createElement("div");
  pricing.className = "catalog-product-pricing";
  const price = document.createElement("strong");
  price.textContent = `$${product.price.toFixed(2)}`;
  const oldPrice = document.createElement("del");
  oldPrice.textContent = `$${product.oldPrice.toFixed(2)}`;
  pricing.append(price, oldPrice);
  const button = document.createElement("button");
  button.className = "catalog-add-button";
  button.type = "button";
  button.dataset.addProduct = product.id;
  button.textContent = cart.get(product.id) >= product.stock ? "Out of stock" : "Add to cart";
  button.disabled = cart.get(product.id) >= product.stock;
  button.setAttribute("aria-label", `Add ${product.name} to cart`);
  details.append(categoryLabel, name, description, rating, pricing, button);
  card.append(imageWrap, details);
  return card;
}

function renderCatalog() {
  const selectedProducts = products.filter((product) => category === "All" || product.category === category);
  const sort = document.querySelector("#catalog-sort").value;
  if (sort === "price-low") selectedProducts.sort((first, second) => first.price - second.price);
  if (sort === "price-high") selectedProducts.sort((first, second) => second.price - first.price);
  if (sort === "name") selectedProducts.sort((first, second) => first.name.localeCompare(second.name));

  grid.replaceChildren(...selectedProducts.map(createProductCard));
  document.querySelector("#catalog-results-count").textContent =
    `${selectedProducts.length} ${selectedProducts.length === 1 ? "item" : "items"}`;
  showFeedback("");
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

document.querySelector("#catalog-sort").addEventListener("change", renderCatalog);
grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.addProduct);
  if (!product) {
    showFeedback("That item is not available in the catalog.", true);
    return;
  }
  const quantity = cart.get(product.id) ?? 0;
  if (quantity >= product.stock) {
    showToast(`Only ${product.stock} ${product.name} available.`);
    return;
  }

  cart.set(product.id, quantity + 1);
  try {
    persistCart();
    updateCartCount();
    renderCatalog();
    showToast(`${product.name} added to your cart.`);
  } catch (error) {
    cart.set(product.id, quantity);
    if (!quantity) cart.delete(product.id);
    showFeedback(`Cart changes could not be saved: ${error.message}`, true);
  }
});

try {
  applySavedTheme();
  cart = loadCart();
  const title = category === "All" ? "Shop all items" : `Shop ${category}`;
  document.title = `${title} — House of Eloria`;
  document.querySelector("#catalog-title").textContent = title;
  document.querySelector("#catalog-description").textContent = categoryDescriptions.get(category);
  document.querySelector("#catalog-breadcrumb-category").textContent = category === "All" ? "All items" : category;
  document.querySelectorAll("[data-category-link]").forEach((link) => {
    if (link.dataset.categoryLink === category) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
  updateCartCount();
  renderCatalog();
} catch (error) {
  showFeedback(`The catalog could not be loaded: ${error.message}`, true);
}
