import { products, formatPrice, getProductById } from "./products.js";
import { cart } from "./cart.js";

/* ---- State ---- */
let currentCategory = "all";
let currentSort = "featured";
let selectedSize = null;

/* ---- DOM Refs ---- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  pageLoader: $("#pageLoader"),
  header: $("#header"),
  nav: $("#nav"),
  menuToggle: $("#menuToggle"),
  productGrid: $("#productGrid"),
  filterTabs: $("#filterTabs"),
  sortSelect: $("#sortSelect"),
  cartToggle: $("#cartToggle"),
  cartSidebar: $("#cartSidebar"),
  cartClose: $("#cartClose"),
  cartItems: $("#cartItems"),
  cartCount: $("#cartCount"),
  cartItemCount: $("#cartItemCount"),
  cartTotal: $("#cartTotal"),
  checkoutBtn: $("#checkoutBtn"),
  continueShopping: $("#continueShopping"),
  overlay: $("#overlay"),
  productModal: $("#productModal"),
  modalClose: $("#modalClose"),
  modalContent: $("#modalContent"),
  searchToggle: $("#searchToggle"),
  searchOverlay: $("#searchOverlay"),
  searchInput: $("#searchInput"),
  searchResults: $("#searchResults"),
  searchClose: $("#searchClose"),
  toast: $("#toast"),
  newsletterForm: $("#newsletterForm")
};

/* ---- Init ---- */
document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initHeader();
  initNavigation();
  initScrollReveal();
  initProducts();
  initCart();
  initSearch();
  initModal();
  initNewsletter();
  initCollectionLinks();
});

/* ---- Page Loader ---- */
function initLoader() {
  window.addEventListener("load", () => {
    setTimeout(() => els.pageLoader.classList.add("hidden"), 1400);
  });
}

/* ---- Header Scroll ---- */
function initHeader() {
  const onScroll = () => {
    els.header.classList.toggle("scrolled", window.scrollY > 50);
    updateActiveNavLink();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function updateActiveNavLink() {
  const sections = ["hero", "shop", "collections", "about"];
  const scrollPos = window.scrollY + 100;

  sections.forEach((id) => {
    const section = document.getElementById(id);
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (!section || !link) return;

    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    link.classList.toggle("active", scrollPos >= top && scrollPos < bottom);
  });
}

/* ---- Navigation ---- */
function initNavigation() {
  els.menuToggle.addEventListener("click", () => {
    const isOpen = els.nav.classList.toggle("open");
    els.menuToggle.classList.toggle("active", isOpen);
    els.menuToggle.setAttribute("aria-expanded", isOpen);
    document.body.classList.toggle("no-scroll", isOpen);
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      els.nav.classList.remove("open");
      els.menuToggle.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });
  });

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

/* ---- Scroll Reveal ---- */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
    observer.observe(el);
  });
}

/* ---- Products ---- */
function initProducts() {
  els.filterTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".filter-tab");
    if (!tab) return;

    $$(".filter-tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    currentCategory = tab.dataset.category;
    renderProducts();
  });

  els.sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderProducts();
  });

  renderProducts();
}

function getFilteredProducts() {
  let filtered =
    currentCategory === "all"
      ? [...products]
      : products.filter((p) => p.category === currentCategory);

  switch (currentSort) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  els.productGrid.innerHTML = filtered
    .map(
      (product) => `
    <article class="product-card reveal visible" role="listitem" data-id="${product.id}">
      <div class="product-image-wrap">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-actions">
          <button class="product-action-btn" data-action="quick-view" data-id="${product.id}">Quick View</button>
          <button class="product-action-btn primary" data-action="add-to-cart" data-id="${product.id}">Add to Bag</button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">
          ${product.originalPrice ? `<span class="original">${formatPrice(product.originalPrice)}</span>` : ""}
          ${formatPrice(product.price)}
        </p>
      </div>
    </article>
  `
    )
    .join("");

  els.productGrid.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === "quick-view") openModal(id);
      if (btn.dataset.action === "add-to-cart") addToCartQuick(id);
    });
  });

  els.productGrid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => openModal(Number(card.dataset.id)));
  });
}

function addToCartQuick(id) {
  const product = getProductById(id);
  if (!product) return;
  const size = product.sizes.includes("M") ? "M" : product.sizes[0];
  cart.add(product, size);
  updateCartUI();
  showToast(`${product.name} added to bag`);
}

/* ---- Cart ---- */
function initCart() {
  els.cartToggle.addEventListener("click", openCart);
  els.cartClose.addEventListener("click", closeCart);
  els.continueShopping.addEventListener("click", closeCart);
  els.overlay.addEventListener("click", () => {
    closeCart();
    closeModal();
    closeSearch();
  });

  els.checkoutBtn.addEventListener("click", () => {
    if (cart.count === 0) {
      showToast("Your bag is empty");
      return;
    }
    showToast("Thank you! Checkout is a demo feature.");
    cart.clear();
    updateCartUI();
    closeCart();
  });

  updateCartUI();
}

function openCart() {
  els.cartSidebar.classList.add("open");
  els.cartSidebar.setAttribute("aria-hidden", "false");
  els.overlay.classList.add("visible");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  els.cartSidebar.classList.remove("open");
  els.cartSidebar.setAttribute("aria-hidden", "true");
  els.overlay.classList.remove("visible");
  document.body.classList.remove("no-scroll");
}

function updateCartUI() {
  const count = cart.count;
  els.cartCount.textContent = count;
  els.cartCount.classList.toggle("visible", count > 0);
  els.cartItemCount.textContent = `(${count})`;
  els.cartTotal.textContent = formatPrice(cart.total);
  renderCartItems();
}

function renderCartItems() {
  const items = cart.items;

  if (items.length === 0) {
    els.cartItems.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p>Your bag is empty</p>
      </div>`;
    return;
  }

  els.cartItems.innerHTML = items
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-meta">Size: ${item.size}</p>
        <div class="cart-item-bottom">
          <div class="cart-qty">
            <button data-qty="-1" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button data-qty="1" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
        <button class="cart-item-remove">Remove</button>
      </div>
    </div>
  `
    )
    .join("");

  els.cartItems.querySelectorAll(".cart-item").forEach((el) => {
    const id = Number(el.dataset.id);
    const size = el.dataset.size;

    el.querySelector("[data-qty='-1']").addEventListener("click", () => {
      const item = cart.items.find((i) => i.id === id && i.size === size);
      cart.updateQuantity(id, size, item.quantity - 1);
      updateCartUI();
    });

    el.querySelector("[data-qty='1']").addEventListener("click", () => {
      const item = cart.items.find((i) => i.id === id && i.size === size);
      cart.updateQuantity(id, size, item.quantity + 1);
      updateCartUI();
    });

    el.querySelector(".cart-item-remove").addEventListener("click", () => {
      cart.remove(id, size);
      updateCartUI();
    });
  });
}

/* ---- Product Modal ---- */
function initModal() {
  els.modalClose.addEventListener("click", closeModal);
}

function openModal(id) {
  const product = getProductById(id);
  if (!product) return;

  selectedSize = product.sizes[0];

  els.modalContent.innerHTML = `
    <div class="modal-image">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="modal-details">
      <p class="product-category">${product.category}</p>
      <h2 class="product-name" id="modalTitle">${product.name}</h2>
      <p class="product-price">
        ${product.originalPrice ? `<span class="original">${formatPrice(product.originalPrice)}</span>` : ""}
        ${formatPrice(product.price)}
      </p>
      <p class="modal-description">${product.description}</p>
      <div class="modal-sizes">
        <label>Select Size</label>
        <div class="size-options" id="sizeOptions">
          ${product.sizes
            .map(
              (s) =>
                `<button class="size-btn${s === selectedSize ? " selected" : ""}" data-size="${s}">${s}</button>`
            )
            .join("")}
        </div>
      </div>
      <button class="btn btn-primary modal-add-btn" id="modalAddBtn">Add to Bag — ${formatPrice(product.price)}</button>
    </div>
  `;

  els.modalContent.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      els.modalContent.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  els.modalContent.querySelector("#modalAddBtn").addEventListener("click", () => {
    cart.add(product, selectedSize);
    updateCartUI();
    showToast(`${product.name} added to bag`);
    closeModal();
    openCart();
  });

  els.productModal.classList.add("open");
  els.overlay.classList.add("visible");
  document.body.classList.add("no-scroll");
}

function closeModal() {
  els.productModal.classList.remove("open");
  if (!els.cartSidebar.classList.contains("open")) {
    els.overlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
  }
}

/* ---- Search ---- */
function initSearch() {
  els.searchToggle.addEventListener("click", () => {
    els.searchOverlay.classList.add("open");
    els.searchOverlay.setAttribute("aria-hidden", "false");
    els.searchInput.focus();
  });

  els.searchClose.addEventListener("click", closeSearch);

  els.searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      els.searchResults.innerHTML = "";
      return;
    }

    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );

    els.searchResults.innerHTML = results.length
      ? results
          .slice(0, 5)
          .map(
            (p) => `
        <div class="search-result-item" data-id="${p.id}">
          <img src="${p.image}" alt="${p.name}">
          <div>
            <span>${p.name}</span><br>
            <small>${formatPrice(p.price)}</small>
          </div>
        </div>
      `
          )
          .join("")
      : "<p style='padding:12px;color:var(--color-text-muted)'>No products found</p>";

    els.searchResults.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        openModal(Number(item.dataset.id));
        closeSearch();
      });
    });
  });
}

function closeSearch() {
  els.searchOverlay.classList.remove("open");
  els.searchOverlay.setAttribute("aria-hidden", "true");
  els.searchInput.value = "";
  els.searchResults.innerHTML = "";
}

/* ---- Newsletter ---- */
function initNewsletter() {
  els.newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Thanks for subscribing!");
    els.newsletterForm.reset();
  });
}

/* ---- Collection Links ---- */
function initCollectionLinks() {
  $$(".collection-card[data-filter]").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const category = card.dataset.filter;
      currentCategory = category;

      $$(".filter-tab").forEach((t) => {
        const isActive = t.dataset.category === category;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive);
      });

      renderProducts();
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ---- Toast ---- */
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.remove("show"), 2800);
}
