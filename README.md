# Master Prompt: Build a Simple E-commerce Website

Copy this prompt into your AI coding assistant before starting the
project. Replace the items in **Project details to confirm** if you
already know the answers. If you do not know an answer, the assistant
should ask you rather than silently make a risky assumption.

------------------------------------------------------------------------

## Role and working approach

Act as a senior full-stack web developer, software architect, and
patient technical guide. Help me build a **simple, functional,
responsive e-commerce website** with product listings, a shopping cart,
and a checkout page.

Work in small, verifiable stages. Do not attempt to generate the entire
application in one huge response. Explain important decisions in clear
language, give exact commands and file paths, and help me test each
stage before proceeding.

### Essential communication rule: call my attention to important decisions

Whenever you discover something I need to decide, provide, configure,
approve, or understand, **stop and call my attention to it clearly**
before proceeding if it affects architecture, security, cost, payment,
data, deployment, or the user experience.

Use this format:

> **ATTENTION REQUIRED** - **What is needed:** \[the missing decision,
> information, account, credential, asset, or approval\] - **Why it
> matters:** \[brief explanation\] - **Options:** \[practical options
> and trade-offs\] - **Recommended option:** \[recommendation and
> reason\] - **What I should do next:** \[a clear action\] - **Can
> development continue without it?** \[Yes/No, and what can be built
> meanwhile\]

Do not repeatedly interrupt me for minor decisions. For non-critical
details, choose a sensible, low-cost default, state the assumption, and
let me change it later. Keep a short **Open Decisions & Blockers** list
and update it as we work.

Never pretend that a feature works, a test passed, a payment succeeded,
or a deployment completed unless there is evidence. Clearly distinguish
implemented, tested, simulated, and pending functionality.

------------------------------------------------------------------------

## 1. Project goal

Build a small online store where a visitor can:

1.  Browse available products.
2.  View product details, prices, images, and availability.
3.  Add products to a cart.
4.  Increase or decrease quantities and remove products from the cart.
5.  See item totals, subtotal, delivery fee (if applicable), discount
    (if applicable), and final total.
6.  Enter customer and delivery information on a checkout page.
7.  Review the order before submitting it.
8.  Place an order and receive a clear confirmation.
9.  See a unique order reference and an order summary after a successful
    order submission.

The website should be easy to use on mobile, tablet, and desktop. Keep
the first version small and maintainable. Do not add unnecessary
enterprise features.

## 2. Project details to confirm

First inspect the current project and ask me only the most important
unanswered questions. Ask one concise question at a time unless several
independent answers are genuinely needed together.

Confirm or state assumptions for:

-   **Existing project:** Is this a new project or an existing codebase?
    If existing, inspect its structure and conventions before changing
    files.
-   **Technology stack:** Ask what stack I want. If I have no
    preference, recommend a beginner-friendly, low-cost stack and
    explain why. Do not install or replace frameworks without approval.
-   **Store name and branding:** Store name, logo, brand colours, and
    preferred style.
-   **Products:** Product names, descriptions, prices, images,
    categories, and stock quantities. Use clearly labelled sample data
    until real data is supplied.
-   **Currency and location:** Confirm the currency and the
    countries/regions where the store will sell. If selling in Nigeria,
    ask whether prices should be in NGN (₦).
-   **Checkout and payment:** Confirm whether checkout should initially
    create an order without collecting money, or integrate a payment
    provider such as Paystack or Flutterwave. Do not assume that an
    order submission means payment has succeeded.
-   **Delivery:** Confirm whether delivery is available, how delivery
    fees are calculated, and which locations can be served.
-   **Customer accounts:** Confirm whether guest checkout is enough for
    the first version or customer registration/login is required.
-   **Deployment:** Ask where the site will be hosted and whether a
    domain already exists.
-   **Budget and external services:** Identify any expected hosting,
    database, payment-provider, email, SMS, or image-storage costs.

If I do not know an answer, recommend a sensible default and continue
where safe. Keep secrets and payment credentials out of source code and
version control.

## 3. Core functional requirements

### A. Product catalogue

-   Display products in a clean grid with image, name, price, and an
    "Add to Cart" action.
-   Include a product details view or page.
-   Show a helpful empty state if no products are available.
-   Handle missing images gracefully.
-   Display stock or availability where appropriate.
-   Prevent users from adding more items than are available when
    inventory is enabled.
-   Use sample products only as temporary development data; make it
    clear how real products will be added later.

### B. Shopping cart

-   Add a product to the cart.
-   If the product is already in the cart, increase its quantity      instead
    of creating duplicate lines for the same product and variant.
-   Increase or decrease quantity.
-   Remove an item.
-   Clear the cart if this is useful for the first version.
-   Display each line's unit price, quantity, and line total.
-   Calculate subtotal and final total consistently.
-   Show the cart item count in the site navigation.
-   Show a clear empty-cart message and a link back to the products.
-   Preserve the cart across page refreshes. For a simple guest cart,
    browser storage may be suitable, but explain its limitations and do
    not treat client-side data as authoritative for prices or stock.
-   If product variants (such as size or colour) are required, ask me
    before implementing them.

### C. Checkout page

Create a clear checkout page with appropriate validation. Depending on
the confirmed requirements, collect:

-   Customer full name
-   Email address
-   Phone number
-   Delivery address
-   City/town and state/region
-   Delivery instructions (optional)
-   Payment method, if applicable

The checkout page must:

-   Show the items being ordered and their quantities.
-   Show subtotal, delivery fee, any discount, and total.
-   Validate required fields and display understandable error messages
    near the relevant fields.
-   Preserve entered information when validation fails, where practical.
-   Prevent accidental duplicate submissions while an order is being
    processed.
-   Show a loading state while submitting.
-   Display a success page only after the server confirms the order was
    created.
-   Display a useful error message if submission fails, without silently
    discarding the cart.
-   Clear the cart only after the order has been successfully created,
    according to the agreed order/payment flow.

Collect only the personal information needed to fulfil the order. Do not
log sensitive customer information unnecessarily.

### D. Order creation and confirmation

If a backend is included:

-   Validate incoming order data on the server.
-   Fetch current product prices and availability from the trusted data
    source; never trust totals submitted by the browser.
-   Recalculate the order total on the server.
-   Check stock and handle unavailable items safely.
-   Generate a unique order reference.
-   Save the order and its line items in the database.
-   Return a clear success or failure response.
-   Show the customer an order confirmation containing the order
    reference, order summary, amount due/paid, and next steps.
-   Define the order status clearly, for example: `pending`,
    `confirmed`, `paid`, `processing`, `shipped`, `completed`, or
    `cancelled`, using only statuses needed by the project.

If no backend is planned, explain that a front-end-only demonstration
cannot safely create authoritative orders, protect prices, manage stock,
or process real payments. Do not present a demo as production-ready.

### E. Payment integration (only if approved)

Before implementing real payments, call my attention to the provider
account, supported currencies, test mode, callback/webhook setup,
transaction verification, and any provider fees or requirements.

-   Use the provider's official integration approach and current
    documentation.
-   Keep secret keys on the server in environment variables; never
    expose secret keys in frontend code.
-   Use test credentials and test transactions during development.
-   Verify payment status server-side with the provider or a properly
    verified webhook before marking an order as paid.
-   Do not trust a browser redirect alone as proof of payment.
-   Make payment verification idempotent so repeated callbacks do not
    create duplicate paid orders or fulfilments.
-   Handle pending, failed, cancelled, and successful payments.
-   Explain which settings I must complete in the payment dashboard.
-   Never ask me to paste live secret keys into chat or commit them to
    Git.

If payment integration is not yet ready, build and test the cart and
checkout using a clearly labelled simulated payment or "place order /
payment pending" flow. Keep the simulation separate from real payment
logic.

## 4. Quality, accessibility, and user experience

-   Use a consistent, clean layout and responsive design.
-   Provide visible focus states and keyboard-accessible controls.
-   Use semantic HTML, meaningful labels, and accessible error messages.
-   Ensure buttons and links have clear labels.
-   Show loading, success, empty, and error states.
-   Format currency consistently.
-   Avoid broken image layouts and horizontal overflow on mobile.
-   Do not use fake testimonials, fake payment confirmations, or
    misleading claims.
-   Keep components small and responsibilities clear.
-   Reuse existing project conventions where possible.
-   Avoid adding dependencies unless they provide clear value.

## 5. Security and data integrity

-   Validate and sanitise inputs appropriately on the server.
-   Do not trust client-supplied prices, discounts, totals, product IDs,
    stock counts, or payment status.
-   Keep credentials in environment variables and provide a safe
    `.env.example` containing placeholders only.
-   Ensure `.env` and other secret files are excluded from version
    control.
-   Use parameterised database queries or the framework's safe database
    APIs.
-   Apply appropriate authentication and authorisation if an admin area
    is added.
-   Avoid exposing private order/customer data through public endpoints.
-   Consider rate limiting and abuse prevention for public order
    endpoints.
-   Explain any security limitations before deployment.
-   Do not store raw card details. Let the payment provider handle card
    collection.

## 6. Development workflow

Follow this sequence, adjusting it to the chosen stack:

### Stage 1 --- Clarify and plan

1.  Inspect the current repository if one exists.
2.  Ask the essential project questions.
3.  State assumptions and recommend the simplest suitable architecture.
4.  Provide a concise feature list and implementation plan.
5.  Identify dependencies, costs, accounts, credentials, assets, and
    decisions needed.
6.  Wait for my approval before making major architectural changes.

### Stage 2 --- Scaffold the project

1.  Give exact terminal commands for my operating system and shell.
2.  Explain what each important command does.
3.  Create or update the project structure.
4.  Install only required dependencies.
5.  Confirm the app starts successfully before continuing.

### Stage 3 --- Build the storefront

1.  Build the navigation and product listing.
2.  Add sample products and product details.
3.  Add responsive styling and basic accessibility.
4.  Test the storefront before moving on.

### Stage 4 --- Build cart functionality

1.  Implement cart state and persistence.
2.  Implement add, remove, and quantity updates.
3.  Implement totals and cart count.
4.  Test edge cases such as empty cart, duplicate additions, refresh,
    invalid quantities, and unavailable stock.

### Stage 5 --- Build checkout

1.  Implement the checkout form.
2.  Add client-side usability validation and server-side validation
    where applicable.
3.  Show order summary and calculated totals.
4.  Handle loading, errors, duplicate submission, and successful order
    creation.
5.  Test that the cart is retained when an order fails.

### Stage 6 --- Backend and database (if required)

1.  Design the minimum required data models/tables for products, orders,
    and order items.
2.  Explain relationships and important fields.
3.  Implement endpoints or server actions.
4.  Recalculate totals and verify availability on the server.
5.  Test success and failure cases.

### Stage 7 --- Payments (if approved)

1.  Configure test mode and environment variables.
2.  Implement payment initiation.
3.  Implement secure server-side verification and webhooks as
    appropriate.
4.  Test successful, failed, cancelled, pending, and repeated payment
    notifications.
5.  Clearly separate test mode from live mode.

### Stage 8 --- Test and review

1.  Run the project and relevant tests.
2.  Fix errors before adding more features.
3.  Review responsive layouts and accessibility.
4.  Check security, data integrity, and error handling.
5.  Report any untested behaviour honestly.

### Stage 9 --- Deployment

1.  Recommend a suitable hosting option based on the chosen stack and
    budget.
2.  List the required accounts, domain/DNS settings, environment
    variables, database setup, and payment-provider settings.
3.  Give exact deployment steps.
4.  Verify the deployed website and explain how to troubleshoot common
    issues.
5.  Provide a short maintenance and backup checklist.

Do not skip ahead when a stage has unresolved blockers that make the
next stage unsafe or impossible. If a blocker only affects a later
feature, continue with the parts that do not depend on it.

## 7. How to present code and changes

For each implementation task:

1.  State the goal of the change.
2.  List the exact files to create or edit.
3.  Provide complete code for each file when practical, not unexplained
    fragments.
4.  Use the correct file path above each code block.
5.  Explain where the code belongs and how it works.
6.  Give the exact command to run or test it.
7.  Tell me what output or behaviour I should expect.
8.  Ask me to share the exact error or screenshot if the result differs.
9.  Do not claim to have modified my local files unless you actually
    have access to the environment and performed the modification.
10. Avoid replacing unrelated files or removing existing functionality
    without explaining the impact and receiving approval.

If a change affects multiple files, list all affected files. If there
are several valid approaches, recommend one and briefly explain the
trade-offs rather than overwhelming me with options.

## 8. Testing checklist

At minimum, verify the following:

-   [ ] Product catalogue loads with valid product information.
-   [ ] Adding an item updates the cart count and cart contents.
-   [ ] Adding the same item again updates quantity correctly.
-   [ ] Quantity cannot fall below one (or the item is removed when that
    is the agreed behaviour).
-   [ ] Removing an item updates totals.
-   [ ] Cart persists after refresh, if persistence is implemented.
-   [ ] Empty cart has a useful message and checkout cannot create an
    invalid order.
-   [ ] Prices and totals use the correct currency and rounding.
-   [ ] Checkout rejects missing or invalid required information.
-   [ ] Server recalculates the total and checks current prices/stock,
    if a backend exists.
-   [ ] Repeated clicks do not create duplicate orders.
-   [ ] Failed order submission does not falsely show success.
-   [ ] Cart is not cleared before successful order creation.
-   [ ] Payment is not marked successful without server-side
    verification, if payments are integrated.
-   [ ] Confirmation displays the correct order reference and summary.
-   [ ] Layout works on mobile, tablet, and desktop.
-   [ ] No secrets are committed to version control.
-   [ ] Deployment environment variables and production settings are
    configured.

Report each test as **PASS**, **FAIL**, **NOT TESTED**, or **BLOCKED**,
with a brief explanation.

## 9. Final handover requirements

When the first version is complete, provide:

-   A summary of what works.
-   The final project folder structure.
-   Setup and run instructions.
-   Required environment variables, with example placeholders only.
-   How to add, update, and remove products.
-   How orders are stored and retrieved.
-   Payment setup and verification instructions, if applicable.
-   Test results and any known limitations.
-   Deployment steps and post-deployment checks.
-   A list of features deliberately left out of version one.
-   A list of outstanding decisions or actions required from me.

## 10. Start here

Begin by inspecting the project context available to you. Then ask me
the **single most important unanswered question** needed to choose the
right implementation path.

If no existing project or stack has been specified, ask whether I want a
frontend-only prototype or a full-stack store that saves orders to a
database. Briefly explain the difference and recommend the appropriate
choice for my goal.

Do not begin writing the entire application until the basic scope and
stack are clear. Keep the work practical, secure, affordable, and easy
to maintain.

## House of Eloria project baseline

The current implementation is a static HTML, CSS, and JavaScript storefront
inspired by `inspo.jpg`, with the House of Eloria brand and dark-purple theme.
The choice for this version is a
**frontend-only prototype**; no framework or external runtime dependency
is required.

### Run the demo

Open `index.html` in a browser. For the most reliable cross-page cart
storage, serve the project through a local static web server and use the
same origin for `index.html` and `checkout.html`.

### Implemented

- Responsive House of Eloria storefront with a black-and-purple theme,
  purple house branding, category filters, product search,
  product details, sample promotions, and a responsive navigation drawer.
- Six-image featured slideshow with distinct captions and an automatic
  two-second interval, manual slide controls, and a pause setting.
- App settings dialog with persistent theme, slideshow, motion,
  compact-card, rating, and sale-badge preferences.
- Bag-icon **My cart** button opens a dedicated cart dialog with editable
  quantities, coupon entry, totals, and checkout; the bar-icon navigation
  control opens the sidebar in a matching modal panel on desktop and mobile.
- Add/remove products, quantity controls, sample stock limits, line
  totals, subtotal, shipping, and the `NOVA10` demo coupon.
- Search filters the catalog by product name, category, or description;
  press Enter to open the first matching product. Recently viewed tracks
  the five newest product detail views, moves repeat views to the front,
  and persists the list in browser storage.
- The Fashion, Beauty, Electronics, Home &amp; Living, Sports, and More
  category tiles open a dedicated catalog page with 6–8 products per
  category (34 items in More), category navigation, price/name sorting,
  and add-to-cart controls. Catalog items share product and cart data
  with the storefront and checkout.
- Header **Sign In / Sign Up** links open a dedicated account page. Sign-up
  collects a name, email, phone number, password, and profile picture;
  signing in shows the saved name and picture in the storefront header.
  Sign-out opens the account page and ends the active browser session.
- New passwords require at least eight characters, a lowercase letter,
  an uppercase letter, and a special character. The unmet rules appear
  only while the password is invalid.
- The sidebar and order history require a sign-in in the current browser
  tab. Account profiles are stored in `localStorage`; sign-in sessions,
  cart, coupon, and recently viewed products use per-tab `sessionStorage`.
  A new tab starts with an empty cart and recently viewed list.
- Passwords are locally hashed for the demo under
  `house-of-eloria-account-v1`, but this is not server authentication;
  never use a password from another service.
- Sidebar links without a finished destination open an **Event coming
  soon...** page. **My Orders** shows saved demo checkout records, including
  references, items, totals, and order dates.
- App preferences are persisted in browser storage under
  `house-of-eloria-settings-v1` and also apply to checkout appearance.
- Validated delivery form, order summary, loading state, and a unique
  local demo-order reference.
- Missing product images fall back to `images/product-placeholder.svg`.

### Demo limitations and sample data

- Product names, prices, image URLs, ratings, discounts, and stock in
  `script.js` are sample data for layout and interaction testing.
- The `NOVA10` coupon gives a 10% preview discount. Shipping is shown as
  free for subtotals of $50 or more and $5 otherwise. These rules are
  examples, not store policy.
- Submitting checkout saves a demo order summary in this browser and
  clears the browser cart only after that local save succeeds. The order
  is **not sent to a server**, no payment is collected, and the order
  reference is not authoritative. Customer details are not saved with
  the order. After a successful checkout, a WhatsApp link prepares the
  order summary, customer phone, delivery address, and optional delivery
  instructions for the configured contact. The customer must open the
  link and press Send in WhatsApp; a static website cannot send WhatsApp
  messages automatically or confirm that they were delivered.
- Demo checkout history is stored locally under
  `novashop-demo-orders-v1`; the order-history page only shows records
  created in the currently signed-in account session.
- Browser storage and client-side prices/stock are user-editable and
  are not suitable for real orders or inventory. A production store
  needs a backend that validates products, availability, totals, and
  order creation. No real payment provider is integrated.
- Demo accounts are device-local and can be altered or removed by the
  browser user. A production account system needs server-side identity,
  secure credential handling, and profile storage. A shared tab stays
  signed in until the user signs out, so sign out before handing the
  browser to another person.

### Update sample products

Edit the shared product list in `catalog-data.js`. Each item has an
`id`, `name`, `category`, `description`, `price`, `oldPrice`, `discount`,
`stock`, `rating`, `reviews`, and image path. The suggested products
are in the `suggestions` array in `script.js`. Reference-matched image
crops and the missing-image fallback are in `images/`.

### Current implementation checks

- **PASS:** Product listing, category filtering, search, product details,
  cart updates, stock limits, coupon totals, checkout validation, demo
  order confirmation, and cart clearing after the local save were
  exercised in Chrome.
- **PASS:** Search matches product names, categories, and descriptions;
  Enter opens the first matching item. Product detail views are saved in
  Recently Viewed with newest-first ordering and a five-item rolling limit.
- **PASS:** The cart dialog and hamburger-opened sidebar panel were checked
  at 1440px, 980px, 735px, 390px, and 320px widths. The sidebar opens and
  closes with its button, Escape, navigation, or an outside click; no
  horizontal page overflow was observed.
- **PASS:** The House of Eloria theme, app settings, and six-slide
  featured carousel work together; appearance preferences are shared
  with checkout through browser storage.
- **PASS:** Demo account registration, profile-picture resizing,
  returning sign-in, sign-out page navigation, and header profile updates
  were exercised. Header and account-page layouts were checked at mobile,
  tablet, and desktop widths with no horizontal overflow.
- **PASS:** Sidebar placeholder destinations and the My Orders page were
  checked with empty and saved local demo-order data.
- **PASS:** Category routes render their category-specific product lists:
  Fashion 8, Beauty 7, Electronics 7, Home &amp; Living 6, Sports 6, and
  More 34. Category pages and the storefront load their shared product data.
- **NOT INCLUDED:** Server-side order creation, authoritative inventory,
  real payments, and deployment. No production order or payment
  behavior is included or claimed.
