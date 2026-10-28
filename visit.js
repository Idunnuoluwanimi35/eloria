function prepareFreshShoppingVisit() {
  const visitKey = "house-of-eloria-visit-v1";
  if (sessionStorage.getItem(visitKey)) return;

  for (const key of [
    "novashop-cart-v1",
    "novashop-coupon-v1",
    "novashop-checkout-lines-v1",
    "house-of-eloria-recent-v1",
  ]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  sessionStorage.setItem(visitKey, "started");
}

prepareFreshShoppingVisit();
