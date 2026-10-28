const featureNames = new Map([
  ["Brands", "Brands"],
  ["Collections", "Collections"],
  ["Wishlist", "Wishlist"],
  ["Coupons", "Coupons"],
  ["Addresses", "Addresses"],
]);

try {
  const savedSettings = localStorage.getItem("house-of-eloria-settings-v1");
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new TypeError("Saved appearance preferences are invalid");
    }
    document.body.classList.toggle("dark-mode", settings.theme !== "light");
  }
} catch (error) {
  console.error(`Saved appearance preferences could not be loaded: ${error.message}`);
}

const requestedFeature = new URLSearchParams(window.location.search).get("feature");
const featureName = featureNames.get(requestedFeature) ?? "A new experience";
document.querySelector("#feature-name").textContent = featureName;
document.querySelector("#feature-title").textContent = `${featureName} — event coming soon...`;
