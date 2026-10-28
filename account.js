const accountStorageKey = "house-of-eloria-account-v1";
const accountSessionKey = "house-of-eloria-session-v1";
const settingsStorageKey = "house-of-eloria-settings-v1";
const maxAvatarBytes = 5 * 1024 * 1024;
const passwordIterations = 120000;
let accountState = { accounts: [], activeAccountId: null };
let storageIssue = "";
let passwordValidationAttempted = false;

function readAccountState() {
  let stored;
  try {
    stored = localStorage.getItem(accountStorageKey);
  } catch (error) {
    storageIssue = `Account storage is unavailable: ${error.message}`;
    return { accounts: [], activeAccountId: null };
  }
  if (!stored) return { accounts: [], activeAccountId: null };

  try {
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      storageIssue = "Saved account data is invalid. Clear this browser’s House of Eloria account data to continue.";
      return { accounts: [], activeAccountId: null };
    }
    const accounts = parsed.accounts.filter((account) => (
      account
      && typeof account.id === "string"
      && typeof account.name === "string"
      && typeof account.email === "string"
      && typeof account.phone === "string"
      && typeof account.avatar === "string"
      && typeof account.passwordSalt === "string"
      && typeof account.passwordHash === "string"
    ));
    if (accounts.length !== parsed.accounts.length) {
      storageIssue = "Some saved account data is invalid. Clear this browser’s House of Eloria account data to continue.";
    }
    return {
      accounts,
      activeAccountId: accounts.some((account) => account.id === parsed.activeAccountId)
        ? parsed.activeAccountId
        : null,
    };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    storageIssue = "Saved account data could not be read. Clear this browser’s House of Eloria account data to continue.";
    return { accounts: [], activeAccountId: null };
  }
}

function saveAccountState(nextState) {
  try {
    localStorage.setItem(accountStorageKey, JSON.stringify(nextState));
    accountState = nextState;
    storageIssue = "";
    return true;
  } catch (error) {
    showMessage(`Your account could not be saved in this browser: ${error.message}`, true);
    return false;
  }
}

function showMessage(message, isError = false) {
  const element = document.querySelector("#account-message");
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.classList.toggle("is-visible", Boolean(message));
}

function activeAccount() {
  let accountId;
  try {
    accountId = sessionStorage.getItem(accountSessionKey);
  } catch (error) {
    storageIssue = `Your sign-in session could not be accessed: ${error.message}`;
    return null;
  }
  return accountState.accounts.find((account) => account.id === accountId) ?? null;
}

function setMode(mode) {
  const isSignup = mode === "signup";
  document.querySelector("#account-signed-out").hidden = true;
  document.querySelector("#account-switch").hidden = false;
  document.querySelector("#account-heading").textContent = "Sign in or create an account";
  document.querySelector("#account-description").textContent = "Your account session is saved for this browser tab.";
  document.querySelector("#signin-form").hidden = isSignup;
  document.querySelector("#signup-form").hidden = !isSignup;
  document.querySelectorAll("[data-account-mode]").forEach((button) => {
    const selected = button.dataset.accountMode === mode;
    if (button.closest(".account-switch")) {
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  });
  if (!activeAccount()) showMessage("");
}

function renderAccount() {
  const account = activeAccount();
  const profile = document.querySelector("#account-profile");
  const signedOut = document.querySelector("#account-signed-out");
  const accountSwitch = document.querySelector("#account-switch");
  const signinForm = document.querySelector("#signin-form");
  const signupForm = document.querySelector("#signup-form");

  if (account) {
    profile.hidden = false;
    signedOut.hidden = true;
    accountSwitch.hidden = true;
    signinForm.hidden = true;
    signupForm.hidden = true;
    document.querySelector("#account-heading").textContent = "Your account";
    document.querySelector("#account-description").textContent = "You’re signed in in this browser tab.";
    document.querySelector("#account-name").textContent = account.name;
    document.querySelector("#account-email").textContent = account.email;
    document.querySelector("#account-phone").textContent = account.phone;
    document.querySelector("#account-avatar").src = account.avatar;
  } else {
    profile.hidden = true;
    if (!signedOut.hidden) return;
    accountSwitch.hidden = false;
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    setMode(requestedMode === "signup" ? "signup" : "signin");
  }
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  return new Uint8Array(hex.match(/.{2}/g).map((part) => Number.parseInt(part, 16)));
}

async function hashPassword(password, saltHex) {
  if (!crypto.subtle) throw new Error("Secure password hashing is unavailable in this browser.");
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  if (!salt) throw new Error("The saved password data is invalid.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: passwordIterations, hash: "SHA-256" },
    key,
    256,
  );
  return { salt: bytesToHex(salt), hash: bytesToHex(new Uint8Array(hash)) };
}

async function prepareAvatar(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Choose a valid image for your profile picture.");
  }
  if (file.size > maxAvatarBytes) {
    throw new Error("That image is larger than 5 MB. Choose a smaller picture.");
  }

  const image = await createImageBitmap(file);
  const scale = Math.min(1, 320 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("Your browser could not prepare that profile picture.");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function showSignedOutPage(message) {
  document.querySelector("#account-profile").hidden = true;
  document.querySelector("#account-switch").hidden = true;
  document.querySelector("#signin-form").hidden = true;
  document.querySelector("#signup-form").hidden = true;
  document.querySelector("#account-signed-out").hidden = false;
  document.querySelector("#account-heading").textContent = "Account access";
  document.querySelector("#account-description").textContent = "Your session has ended.";
  showMessage(message);
}

function clearShoppingSession() {
  for (const key of [
    "novashop-cart-v1",
    "novashop-coupon-v1",
    "novashop-checkout-lines-v1",
    "house-of-eloria-recent-v1",
    "house-of-eloria-visit-v1",
  ]) {
    sessionStorage.removeItem(key);
  }
}

function signOut() {
  if (storageIssue) {
    showMessage(storageIssue, true);
    return;
  }
  try {
    sessionStorage.removeItem(accountSessionKey);
    clearShoppingSession();
  } catch (error) {
    showMessage(`Your session could not be cleared: ${error.message}`, true);
    return;
  }
  showSignedOutPage("You have been signed out successfully.");
  history.replaceState(null, "", "account.html?mode=signedout");
}

function passwordRuleViolations(password) {
  const violations = [];
  if (password.length < 8) violations.push("at least 8 characters");
  if (!/[a-z]/.test(password)) violations.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) violations.push("an uppercase letter");
  if (!/[^A-Za-z0-9]/.test(password)) violations.push("a special character");
  return violations;
}

function updatePasswordFeedback() {
  const input = document.querySelector("#signup-password");
  const feedback = document.querySelector("#password-feedback");
  const violations = passwordRuleViolations(input.value);
  feedback.hidden = (!input.value && !passwordValidationAttempted) || !violations.length;
  feedback.textContent = feedback.hidden
    ? ""
    : `Password needs ${violations.join(", ")}.`;
  input.setAttribute("aria-invalid", String(Boolean(input.value && violations.length)));
  return violations.length === 0;
}

async function handleSignIn(event) {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) {
    event.currentTarget.reportValidity();
    return;
  }
  if (storageIssue) {
    showMessage(storageIssue, true);
    return;
  }
  if (activeAccount()) {
    showMessage("An account is already signed in on this browser. Sign out before signing in again.", true);
    return;
  }

  const email = document.querySelector("#signin-email").value.trim().toLowerCase();
  const password = document.querySelector("#signin-password").value;
  if (!email || !password) {
    showMessage("Enter your email address and password.", true);
    return;
  }
  const account = accountState.accounts.find((item) => item.email === email);
  if (!account) {
    showMessage("No account was found for that email. You can create one with Sign Up.", true);
    return;
  }

  try {
    const result = await hashPassword(password, account.passwordSalt);
    if (result.hash !== account.passwordHash) {
      showMessage("That password does not match this account.", true);
      return;
    }
  } catch (error) {
    showMessage(`Sign in could not be completed: ${error.message}`, true);
    return;
  }

  try {
    sessionStorage.setItem(accountSessionKey, account.id);
  } catch (error) {
    showMessage(`Sign-in could not be saved for this browser tab: ${error.message}`, true);
    return;
  }
  redirectAfterSignIn();
  if (isSidebarReturn() || isOrdersReturn()) return;
  showMessage(`Welcome back, ${account.name}. Your profile is now active in this tab.`);
  renderAccount();
}

async function handleSignUp(event) {
  event.preventDefault();
  passwordValidationAttempted = true;
  const validPassword = updatePasswordFeedback();
  if (!validPassword) {
    document.querySelector("#signup-password").focus();
    return;
  }
  if (!event.currentTarget.checkValidity()) {
    event.currentTarget.reportValidity();
    return;
  }
  if (storageIssue) {
    showMessage(storageIssue, true);
    return;
  }
  if (activeAccount()) {
    showMessage("An account is already signed in on this browser. Sign out before creating another session.", true);
    return;
  }

  const name = document.querySelector("#signup-name").value.trim();
  const email = document.querySelector("#signup-email").value.trim().toLowerCase();
  const phone = document.querySelector("#signup-phone").value.trim();
  const password = document.querySelector("#signup-password").value;
  const file = document.querySelector("#signup-avatar").files[0];
  if (!name || !email || !phone || password.length < 8 || !file) {
    showMessage("Complete every field, choose a profile picture, and use a password with at least 8 characters.", true);
    return;
  }
  if (accountState.accounts.some((account) => account.email === email)) {
    showMessage("An account with that email already exists. Sign in instead.", true);
    return;
  }

  const submitButton = document.querySelector("#signup-form button[type=submit]");
  submitButton.disabled = true;
  submitButton.textContent = "Creating your account…";
  try {
    const avatar = await prepareAvatar(file);
    const passwordData = await hashPassword(password);
    const account = {
      id: bytesToHex(crypto.getRandomValues(new Uint8Array(16))),
      name,
      email,
      phone,
      avatar,
      passwordSalt: passwordData.salt,
      passwordHash: passwordData.hash,
      createdAt: new Date().toISOString(),
    };
    const nextState = { accounts: [...accountState.accounts, account], activeAccountId: null };
    if (saveAccountState(nextState)) {
      try {
        sessionStorage.setItem(accountSessionKey, account.id);
      } catch (sessionError) {
        accountState.accounts = accountState.accounts.filter((savedAccount) => savedAccount.id !== account.id);
        saveAccountState(accountState);
        showMessage(`Your account was created, but the sign-in session could not be started: ${sessionError.message}`, true);
        return;
      }
      redirectAfterSignIn();
      if (isSidebarReturn() || isOrdersReturn()) return;
      showMessage(`Welcome, ${account.name}. Your profile has been created and signed in on this browser.`);
      renderAccount();
    }
  } catch (error) {
    showMessage(`Your account could not be created: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Account";
  }
}

function isSidebarReturn() {
  return new URLSearchParams(window.location.search).get("return") === "sidebar";
}

function isOrdersReturn() {
  return new URLSearchParams(window.location.search).get("return") === "orders";
}

function redirectAfterSignIn() {
  if (isSidebarReturn()) window.location.assign("index.html?openSidebar=1");
  if (isOrdersReturn()) window.location.assign("orders.html");
}

function applySavedTheme() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsStorageKey) ?? "{}");
    document.body.classList.toggle("dark-mode", settings.theme !== "light");
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      showMessage(`Saved appearance could not be loaded: ${error.message}`, true);
    } else {
      showMessage("Saved appearance preferences could not be read.", true);
    }
  }
}

document.querySelectorAll("[data-account-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    if (activeAccount()) {
      showMessage("Sign out before switching accounts.", true);
      return;
    }
    setMode(button.dataset.accountMode);
  });
});
document.querySelector("#signin-form").addEventListener("submit", handleSignIn);
document.querySelector("#signup-form").addEventListener("submit", handleSignUp);
document.querySelector("#account-signout").addEventListener("click", signOut);
document.querySelector("#signup-password").addEventListener("input", updatePasswordFeedback);
document.querySelector("#signup-avatar").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const preview = document.querySelector("#avatar-preview");
  if (!file) {
    preview.hidden = true;
    return;
  }
  if (!file.type.startsWith("image/") || file.size > maxAvatarBytes) {
    event.target.value = "";
    preview.hidden = true;
    showMessage("Choose an image file no larger than 5 MB.", true);
    return;
  }
  if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
  preview.dataset.objectUrl = URL.createObjectURL(file);
  preview.src = preview.dataset.objectUrl;
  preview.hidden = false;
  showMessage("");
});

accountState = readAccountState();
const requestedMode = new URLSearchParams(window.location.search).get("mode");
if (requestedMode === "signout") {
  signOut();
} else if (requestedMode === "signedout") {
  showSignedOutPage("You have been signed out successfully.");
} else {
  renderAccount();
}
applySavedTheme();
if (storageIssue) showMessage(storageIssue, true);
