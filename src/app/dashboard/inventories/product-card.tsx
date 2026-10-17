// ui/components/product-card.tsx
"use client";

import { ImageIcon, Trash } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  images?: string;
  description?: string;
  variants?: string;
  colorVariants?: string;
  salePrice?: number;
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onEditVariants: (product: Product) => void;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onEditVariants,
}: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      setIsDeleting(true);
      try {
        await onDelete();
        toast.success("Product deleted successfully");
      } catch (err) {
        toast.error("Failed to delete product");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const parseVariants = () => {
    if (!product.variants) return [];
    try {
      const variantsData =
        typeof product.variants === "string"
          ? JSON.parse(product.variants)
          : product.variants;
      return Array.isArray(variantsData) ? variantsData : [];
    } catch (error) {
      console.error("Failed to parse variants JSON:", error);
      return [];
    }
  };

  const parseColorVariants = (): string[] => {
    if (!product.colorVariants) return [];
    try {
      const colorVariantsData =
        typeof product.colorVariants === "string"
          ? JSON.parse(product.colorVariants)
          : product.colorVariants;
      return Array.isArray(colorVariantsData)
        ? (colorVariantsData as string[])
        : [];
    } catch (error) {
      console.error("Failed to parse color variants JSON:", error);
      return [];
    }
  };

  const variants = parseVariants();
  const hasVariants = variants.length > 0;

  const colorVariants = parseColorVariants();
  const hasColorVariants = colorVariants.length > 0;

  const prices = variants.map((v: any) => Number.parseFloat(v.price) || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : product.price;

  return (
    <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex aspect-square w-full items-center justify-center rounded-t-lg bg-gray-100 dark:bg-gray-800">
        {product.images ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-gray-400" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-1 font-medium">{product.name}</h3>
          <div className="text-right">
            {hasVariants ? (
              <span className="font-bold text-primary">
                ₦{product.salePrice?.toFixed(2)}
              </span>
            ) : product.salePrice && product.salePrice !== product.price ? (
              <div>
                <span className="font-bold text-primary">
                  ${product.salePrice.toFixed(2)}
                </span>
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {product.category}
        </p>

        {hasVariants && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Size Variants:
              </p>
              {/* <button
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => onEditVariants(product)}
              >
                Edit Variants
              </button> */}
            </div>
            {variants.slice(0, 3).map((variant: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{variant.size}</span>
                <span>₦{Number.parseFloat(variant.price).toFixed(2)}</span>
              </div>
            ))}
            {variants.length > 3 && (
              <p className="text-xs text-gray-500">
                +{variants.length - 3} more
              </p>
            )}
          </div>
        )}

        {hasColorVariants && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Colors:
              </p>
            </div>
            {colorVariants.slice(0, 3).map((color, index) => (
              <div key={index} className="text-xs">
                <span>{color}</span>
              </div>
            ))}
            {colorVariants.length > 3 && (
              <p className="text-xs text-gray-500">
                +{colorVariants.length - 3} more colors
              </p>
            )}
          </div>
        )}

        {product.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-xs ${
              product.stock > 50
                ? "text-green-600 dark:text-green-400"
                : product.stock > 10
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          >
            {product.stock} in stock
          </span>
          <div className="flex gap-2">
            <button
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={onEdit}
            >
              Edit Product
            </button>
            <button
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
