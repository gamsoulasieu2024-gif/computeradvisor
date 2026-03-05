"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getWishlist,
  type WishlistItem,
} from "@/lib/wishlist/wishlist-storage";
import { useCurrency } from "@/hooks/useCurrency";

function CompareContent() {
  const searchParams = useSearchParams();
  const { format } = useCurrency();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const itemIds = searchParams.get("items")?.split(",") ?? [];
    const wishlist = getWishlist();
    if (!wishlist) return;
    const selected = wishlist.items.filter((item) => itemIds.includes(item.id));
    setItems(selected);
  }, [searchParams]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          No items selected for comparison.
        </p>
        <Button as="link" href="/wishlist" className="mt-4">
          Back to Wishlist
        </Button>
      </div>
    );
  }

  const allSpecKeys = new Set<string>();
  items.forEach((item) => {
    Object.keys(item.part.specs ?? {}).forEach((key) => {
      allSpecKeys.add(key);
    });
  });

  const specKeys = Array.from(allSpecKeys).filter((k) => k !== "price_usd");

  const firstCategory = items[0]?.category ?? "part";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button as="link" href="/wishlist" variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wishlist
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compare Parts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparing {items.length} {firstCategory.toUpperCase()} option
            {items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              {/* Headers - Part Names */}
              <thead className="bg-muted/30">
                <tr>
                  <th className="sticky left-0 z-10 px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/30">
                    Specification
                  </th>
                  {items.map((item) => (
                    <th
                      key={item.id}
                      className="min-w-[200px] px-4 py-3 text-left text-sm font-semibold text-foreground"
                    >
                      <div className="mb-1">{item.part.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border bg-card">
                {/* Price Row */}
                <tr className="bg-primary/5">
                  <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold text-foreground bg-primary/5">
                    💰 Price
                  </td>
                  {items.map((item) => {
                    const price = item.part.price_usd;
                    const minPrice = Math.min(
                      ...items.map((it) => it.part.price_usd ?? Infinity)
                    );
                    const isLowest =
                      typeof price === "number" && price === minPrice;

                    return (
                      <td key={item.id} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-foreground">
                            {typeof price === "number"
                              ? format(price)
                              : "N/A"}
                          </span>
                          {isLowest && typeof price === "number" && (
                            <Badge variant="success" className="text-xs">
                              Lowest
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Spec Rows */}
                {specKeys.map((key) => {
                  const values = items.map(
                    (item) => (item.part.specs as any)?.[key]
                  );
                  const allSame = values.every((v) => v === values[0]);

                  const label = key
                    .split("_")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    )
                    .join(" ");

                  return (
                    <tr
                      key={key}
                      className={
                        allSame ? "" : "bg-yellow-50 dark:bg-yellow-950/20"
                      }
                    >
                      <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-foreground bg-card">
                        <div className="flex items-center gap-2">
                          <span>{label}</span>
                          {!allSame && (
                            <Badge variant="warning" className="text-xs">
                              Different
                            </Badge>
                          )}
                        </div>
                      </td>
                      {items.map((item) => {
                        const value = (item.part.specs as any)?.[key];
                        return (
                          <td
                            key={item.id + key}
                            className="px-4 py-3 text-sm text-foreground"
                          >
                            {typeof value === "boolean"
                              ? value
                                ? "✓ Yes"
                                : "✗ No"
                              : value !== undefined && value !== null
                                ? String(value)
                                : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items
          .filter((item) => item.notes)
          .map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h4 className="mb-2 font-semibold text-foreground">
                Notes: {item.part.name}
              </h4>
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}

