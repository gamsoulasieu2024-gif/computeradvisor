"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Trash2,
  Plus,
  TrendingDown,
  TrendingUp,
  StickyNote,
  ShoppingCart,
  Download,
  Upload,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getWishlist,
  removeFromWishlist,
  updateWishlistItem,
  getWishlistPriceChanges,
  exportWishlist,
  importWishlist,
  type WishlistItem,
} from "@/lib/wishlist/wishlist-storage";
import { useBuild } from "@/hooks/use-build";
import { useCurrency } from "@/hooks/useCurrency";

export default function WishlistPage() {
  const router = useRouter();
  const { addPart } = useBuild();
  const { format } = useCurrency();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [priceChanges, setPriceChanges] = useState<
    {
      itemId: string;
      partName: string;
      priceWhenAdded: number;
      currentPrice: number;
      change: number;
      percentChange: number;
    }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [tagText, setTagText] = useState("");
  const [priorityDraft, setPriorityDraft] = useState<"high" | "medium" | "low">(
    "medium"
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadWishlist();
    loadPriceChanges();
  }, []);

  const loadWishlist = () => {
    const wishlist = getWishlist();
    if (wishlist) setWishlistItems(wishlist.items);
  };

  const loadPriceChanges = () => {
    const changes = getWishlistPriceChanges();
    setPriceChanges(changes);
  };

  const handleRemove = (itemId: string) => {
    if (typeof window !== "undefined" && window.confirm("Remove this item from wishlist?")) {
      removeFromWishlist(itemId);
      loadWishlist();
      loadPriceChanges();
    }
  };

  const handleSaveNotes = (itemId: string) => {
    const tags =
      tagText.trim().length > 0
        ? tagText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

    updateWishlistItem(itemId, {
      notes: noteText || undefined,
      tags,
      priority: priorityDraft,
    });
    setEditingNotes(null);
    setNoteText("");
    setTagText("");
    loadWishlist();
  };

  const handleAddToBuild = (item: WishlistItem) => {
    addPart(item.category as any, item.part as any);
    router.push("/build");
  };

  const handleExport = () => {
    const json = exportWishlist();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wishlist.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        importWishlist(text);
        loadWishlist();
        loadPriceChanges();
      } catch (err) {
        console.error(err);
        if (typeof window !== "undefined") {
          window.alert("Failed to import wishlist. Please check the file format.");
        }
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const toggleSelectItem = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedItems(next);
  };

  const handleCompareSelected = () => {
    if (selectedItems.size < 2) {
      if (typeof window !== "undefined") {
        window.alert("Select at least 2 items to compare");
      }
      return;
    }
    if (selectedItems.size > 4) {
      if (typeof window !== "undefined") {
        window.alert("Maximum 4 items can be compared at once");
      }
      return;
    }
    const itemIds = Array.from(selectedItems).join(",");
    router.push(`/wishlist/compare?items=${itemIds}`);
  };

  const categories = [
    "all",
    "cpu",
    "gpu",
    "motherboard",
    "ram",
    "storage",
    "psu",
    "cooler",
    "case",
  ];

  const filteredItems =
    selectedCategory === "all"
      ? wishlistItems
      : wishlistItems.filter((item) => item.category === selectedCategory);

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      cpu: "🔲",
      gpu: "🎮",
      motherboard: "🔌",
      ram: "💾",
      storage: "💿",
      psu: "⚡",
      cooler: "❄️",
      case: "📦",
    };
    return icons[category] ?? "📦";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">My Wishlist</h1>
          <p className="text-sm text-muted-foreground">
            Save and compare parts you&apos;re considering before committing to a build.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Price Changes Alert */}
      {priceChanges.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <TrendingDown className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                Price Changes Detected
              </h3>
              <div className="space-y-1">
                {priceChanges.slice(0, 3).map((change) => (
                  <div
                    key={change.itemId}
                    className="text-sm text-blue-800 dark:text-blue-200"
                  >
                    <strong>{change.partName}:</strong>{" "}
                    {change.change < 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        ↓ {format(Math.abs(change.change))} (
                        {change.percentChange.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        ↑ {format(change.change)} (
                        {change.percentChange > 0 ? "+" : ""}
                        {change.percentChange.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                ))}
                {priceChanges.length > 3 && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    +{priceChanges.length - 3} more price changes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Bar */}
      {selectedItems.size > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-4">
          <span className="text-sm font-medium text-foreground">
            {selectedItems.size} item
            {selectedItems.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
            <Button size="sm" onClick={handleCompareSelected}>
              Compare Selected
            </Button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-colors ${
              selectedCategory === cat
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat === "all" ? "All" : cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 opacity-50 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {selectedCategory === "all"
              ? "No items in wishlist yet"
              : `No ${selectedCategory.toUpperCase()} items in wishlist`}
          </h2>
          <p className="mb-6 text-muted-foreground">
            Start adding parts you&apos;re considering to compare and track prices.
          </p>
          <Button type="button" onClick={() => router.push("/build")}>
            <Plus className="mr-2 h-4 w-4" />
            Browse Parts
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const priceChange = priceChanges.find((pc) => pc.itemId === item.id);
            const currentPrice = item.part.price_usd;

            return (
              <div
                key={item.id}
                className={`rounded-lg border bg-card transition-all hover:border-primary/50 ${
                  selectedItems.has(item.id)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="mt-1"
                    />

                    {/* Category Icon */}
                    <div className="text-3xl">{getCategoryIcon(item.category)}</div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {item.part.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            {item.priority && (
                              <Badge
                                variant={
                                  item.priority === "high"
                                    ? "error"
                                    : item.priority === "medium"
                                      ? "warning"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="ml-4 text-right">
                          {typeof currentPrice === "number" && (
                            <div className="text-xl font-bold text-foreground">
                              {format(currentPrice)}
                            </div>
                          )}
                          {priceChange && (
                            <div
                              className={`mt-1 flex items-center gap-1 text-sm ${
                                priceChange.change < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {priceChange.change < 0 ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : (
                                <TrendingUp className="h-3 w-3" />
                              )}
                              {format(Math.abs(priceChange.change))} (
                              {priceChange.percentChange > 0 ? "+" : ""}
                              {priceChange.percentChange.toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes / edit panel */}
                      {editingNotes === item.id ? (
                        <div className="mb-2 space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add notes (e.g. pros/cons, review links)..."
                            className="w-full rounded border border-border p-2 text-sm"
                            rows={3}
                          />
                          <input
                            type="text"
                            value={tagText}
                            onChange={(e) => setTagText(e.target.value)}
                            placeholder="Tags (comma separated, e.g. 1440p, quiet, value)"
                            className="w-full rounded border border-border p-2 text-xs"
                          />
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Priority:</span>
                            {(["high", "medium", "low"] as const).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriorityDraft(p)}
                                className={`rounded-full px-2 py-0.5 ${
                                  priorityDraft === p
                                    ? p === "high"
                                      ? "bg-red-500 text-white"
                                      : p === "medium"
                                        ? "bg-yellow-500 text-zinc-900"
                                        : "bg-zinc-200 text-zinc-900"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => handleSaveNotes(item.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingNotes(null);
                                setNoteText("");
                                setTagText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : item.notes ? (
                        <div className="mb-2 rounded bg-muted/40 p-2 text-sm text-muted-foreground">
                          {item.notes}
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddToBuild(item)}
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          Add to Build
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNotes(item.id);
                            setNoteText(item.notes ?? "");
                            setTagText(item.tags?.join(", ") ?? "");
                            setPriorityDraft(item.priority ?? "medium");
                          }}
                        >
                          <StickyNote className="mr-1 h-3 w-3" />
                          {item.notes || item.tags?.length
                            ? "Edit Notes/Tags"
                            : "Add Notes/Tags"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

