import { useState } from "react";
import type { ProductDetail } from "../lib/types";

type ProductImageGalleryProps = {
  product: ProductDetail;
};

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const images = product.assets;

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col-reverse">
      {images.length > 1 && (
        <div className="mx-auto mt-6 w-full max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-4 gap-6">
            {images.slice(0, 4).map((asset, index) => (
              <button
                key={asset.id}
                type="button"
                className={`bg-base-200 relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg ${
                  index === activeIndex ? "ring-primary ring-2" : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <span className="sr-only">{product.name}</span>
                <span className="absolute inset-0 overflow-hidden rounded-lg">
                  <img
                    src={asset.preview}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeImage && (
        <div
          key={activeImage.id}
          className="product-gallery-image bg-base-200 aspect-square w-full overflow-hidden rounded-lg"
        >
          <img
            src={activeImage.preview}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
