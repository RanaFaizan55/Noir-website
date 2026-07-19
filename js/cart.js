import { formatPrice } from "./products.js";

const STORAGE_KEY = "noir_cart";

class Cart {
  #items = [];

  constructor() {
    this.#load();
  }

  #load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.#items = saved ? JSON.parse(saved) : [];
    } catch {
      this.#items = [];
    }
  }

  #save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#items));
  }

  get items() {
    return [...this.#items];
  }

  get count() {
    return this.#items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get total() {
    return this.#items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  add(product, size = "M", quantity = 1) {
    const existing = this.#items.find(
      (item) => item.id === product.id && item.size === size
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.#items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        quantity
      });
    }

    this.#save();
    return this;
  }

  remove(id, size) {
    this.#items = this.#items.filter(
      (item) => !(item.id === id && item.size === size)
    );
    this.#save();
    return this;
  }

  updateQuantity(id, size, quantity) {
    const item = this.#items.find(
      (item) => item.id === id && item.size === size
    );
    if (!item) return this;

    if (quantity <= 0) {
      return this.remove(id, size);
    }

    item.quantity = quantity;
    this.#save();
    return this;
  }

  clear() {
    this.#items = [];
    this.#save();
    return this;
  }
}

export const cart = new Cart();
export { formatPrice };
