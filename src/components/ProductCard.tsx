import { useState } from "react";
import { formatMoney } from "../lib/util/format-money";
import { addItemToOrder } from "../lib/client/order-service";
import { ArrowUpRight } from "./icons/ArrowUpRight";
import { Plus } from "./icons/Plus";

interface Variant {
  id: string;
}

interface Props {
  slug: string;
  image: string;
  title: string;
  price: number;
  variants: Variant[];
}

export function ProductCard({ slug, image, title, price, variants }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addItemToOrder(window.__locale, variants[0].id, 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <a href={`/p/${slug}`} className="group bg-base-200 block w-full min-w-0">
      <figure className="relative aspect-square">
        <img
          src={`${image}`}
          alt={title}
          className="rounded-box h-full w-full object-cover"
        />
        <div
          className="bg-base-100 rounded-box absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
          aria-hidden="true"
        />
      </figure>
      <div className="bg-base-200 flex items-end justify-between gap-4 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base-content truncate text-xs font-bold tracking-wide uppercase sm:text-base">
            {title}
          </h3>
          {price && (
            <p className="text-base-content text-sm opacity-70">
              {formatMoney(price)}
            </p>
          )}
        </div>
        {variants.length > 1 ? (
          <span className="btn btn-circle btn-primary btn-sm text-base-content shrink-0">
            <ArrowUpRight className="size-4" />
          </span>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="btn btn-circle btn-primary btn-sm text-base-content relative shrink-0"
          >
            <span
              className={`transition-all duration-300 ${loading ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
            >
              <Plus className="size-4" />
            </span>
            <span
              className={`absolute transition-all duration-300 ${loading ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
            >
              <span className="loading loading-spinner loading-xs" />
            </span>
          </button>
        )}
      </div>
    </a>
  );
}
