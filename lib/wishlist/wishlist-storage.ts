import type { PCComponent } from "@/types/components";

export interface WishlistItem {
  id: string;
  part: PCComponent;
  addedAt: string;
  category: string;
  notes?: string;
  tags?: string[];
  priceWhenAdded?: number;
  priority?: "high" | "medium" | "low";
}

export interface Wishlist {
  id: string;
  name: string;
  description?: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "pc-wishlists";
const DEFAULT_WISHLIST_ID = "default";

function safeGetStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/**
 * Get all wishlists
 */
export function getWishlists(): Wishlist[] {
  const storage = safeGetStorage();
  if (!storage) return [];

  try {
    const data = storage.getItem(STORAGE_KEY);
    if (!data) {
      const now = new Date().toISOString();
      const defaultList: Wishlist = {
        id: DEFAULT_WISHLIST_ID,
        name: "My Wishlist",
        description: "Parts you're considering across builds",
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      storage.setItem(STORAGE_KEY, JSON.stringify([defaultList]));
      return [defaultList];
    }
    return JSON.parse(data) as Wishlist[];
  } catch (err) {
    console.error("Failed to load wishlists:", err);
    return [];
  }
}

/**
 * Persist wishlists
 */
function saveWishlists(wishlists: Wishlist[]) {
  const storage = safeGetStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(wishlists));
}

/**
 * Get specific wishlist
 */
export function getWishlist(wishlistId: string = DEFAULT_WISHLIST_ID): Wishlist | null {
  const wishlists = getWishlists();
  return wishlists.find((w) => w.id === wishlistId) ?? null;
}

/**
 * Add part to wishlist
 */
export function addToWishlist(
  part: PCComponent,
  category: string,
  wishlistId: string = DEFAULT_WISHLIST_ID,
  options?: {
    notes?: string;
    tags?: string[];
    priority?: "high" | "medium" | "low";
  }
): WishlistItem {
  const wishlists = getWishlists();
  const wishlist = wishlists.find((w) => w.id === wishlistId);

  if (!wishlist) {
    throw new Error("Wishlist not found");
  }

  const existingIndex = wishlist.items.findIndex((item) => item.part.id === part.id);

  const newItem: WishlistItem = {
    id: `wishlist-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    part,
    category,
    addedAt: new Date().toISOString(),
    priceWhenAdded: part.price_usd,
    notes: options?.notes,
    tags: options?.tags,
    priority: options?.priority ?? "medium",
  };

  if (existingIndex >= 0) {
    wishlist.items[existingIndex] = newItem;
  } else {
    wishlist.items.push(newItem);
  }

  wishlist.updatedAt = new Date().toISOString();
  saveWishlists(wishlists);

  return newItem;
}

/**
 * Remove part from wishlist
 */
export function removeFromWishlist(
  itemId: string,
  wishlistId: string = DEFAULT_WISHLIST_ID
): void {
  const wishlists = getWishlists();
  const wishlist = wishlists.find((w) => w.id === wishlistId);
  if (!wishlist) return;

  wishlist.items = wishlist.items.filter((item) => item.id !== itemId);
  wishlist.updatedAt = new Date().toISOString();
  saveWishlists(wishlists);
}

/**
 * Update wishlist item
 */
export function updateWishlistItem(
  itemId: string,
  updates: Partial<Pick<WishlistItem, "notes" | "tags" | "priority">>,
  wishlistId: string = DEFAULT_WISHLIST_ID
): void {
  const wishlists = getWishlists();
  const wishlist = wishlists.find((w) => w.id === wishlistId);
  if (!wishlist) return;

  const item = wishlist.items.find((i) => i.id === itemId);
  if (!item) return;

  Object.assign(item, updates);
  wishlist.updatedAt = new Date().toISOString();
  saveWishlists(wishlists);
}

/**
 * Get items by category
 */
export function getWishlistItemsByCategory(
  category: string,
  wishlistId: string = DEFAULT_WISHLIST_ID
): WishlistItem[] {
  const wishlist = getWishlist(wishlistId);
  if (!wishlist) return [];
  return wishlist.items.filter((item) => item.category === category);
}

/**
 * Check if part is in wishlist
 */
export function isInWishlist(
  partId: string,
  wishlistId: string = DEFAULT_WISHLIST_ID
): boolean {
  const wishlist = getWishlist(wishlistId);
  if (!wishlist) return false;
  return wishlist.items.some((item) => item.part.id === partId);
}

/**
 * Create new wishlist
 */
export function createWishlist(name: string, description?: string): Wishlist {
  const wishlists = getWishlists();

  const now = new Date().toISOString();
  const newWishlist: Wishlist = {
    id: `wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    items: [],
    createdAt: now,
    updatedAt: now,
  };

  wishlists.push(newWishlist);
  saveWishlists(wishlists);

  return newWishlist;
}

/**
 * Delete wishlist
 */
export function deleteWishlist(wishlistId: string): void {
  if (wishlistId === DEFAULT_WISHLIST_ID) {
    throw new Error("Cannot delete default wishlist");
  }
  const wishlists = getWishlists().filter((w) => w.id !== wishlistId);
  saveWishlists(wishlists);
}

/**
 * Get price changes for wishlist items
 */
export function getWishlistPriceChanges(
  wishlistId: string = DEFAULT_WISHLIST_ID
): {
  itemId: string;
  partName: string;
  priceWhenAdded: number;
  currentPrice: number;
  change: number;
  percentChange: number;
}[] {
  const wishlist = getWishlist(wishlistId);
  if (!wishlist) return [];

  return wishlist.items
    .filter((item) => typeof item.priceWhenAdded === "number" && typeof item.part.price_usd === "number")
    .map((item) => {
      const priceWhenAdded = item.priceWhenAdded as number;
      const currentPrice = item.part.price_usd as number;
      const change = currentPrice - priceWhenAdded;
      const percentChange = (change / priceWhenAdded) * 100;

      return {
        itemId: item.id,
        partName: item.part.name,
        priceWhenAdded,
        currentPrice,
        change,
        percentChange,
      };
    })
    .filter((item) => item.change !== 0);
}

/**
 * Export wishlist as JSON
 */
export function exportWishlist(wishlistId: string = DEFAULT_WISHLIST_ID): string {
  const wishlist = getWishlist(wishlistId);
  if (!wishlist) throw new Error("Wishlist not found");
  return JSON.stringify(wishlist, null, 2);
}

/**
 * Import wishlist from JSON
 */
export function importWishlist(jsonString: string): Wishlist {
  const storage = safeGetStorage();
  if (!storage) {
    throw new Error("Wishlist import not available on server");
  }

  try {
    const parsed = JSON.parse(jsonString) as Wishlist;
    const now = new Date().toISOString();
    const wishlist: Wishlist = {
      ...parsed,
      id: `wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const wishlists = getWishlists();
    wishlists.push(wishlist);
    saveWishlists(wishlists);

    return wishlist;
  } catch (err) {
    console.error("Failed to import wishlist:", err);
    throw new Error("Invalid wishlist format");
  }
}

