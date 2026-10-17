"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardFooter } from "~/ui/primitives/card";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  currentQuantity?: number;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  product: {
    category: string;
    id: string;
    image: string;
    inStock?: boolean;
    name: string;
    originalPrice?: number;
    description: string;
    price: number;
    stock: number;
    rating?: number;
  };
};

export function ProductCard({
  className,
  currentQuantity = 0,
  onAddToCart,
  onAddToWishlist,
  product,
  ...props
}: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      setIsAddingToCart(true);
      setTimeout(() => {
        onAddToCart(product.id);
        setIsAddingToCart(false);
      }, 300);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      onAddToWishlist(product.id);
    }
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className={cn("h-full", className)} {...props}>
      <Link href={`/products/${product.id}`}>
        <Card className="h-full overflow-hidden rounded-lg border-0 bg-white p-0 shadow-none">
          {/* Image container - reduced height */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {product.image && (
              <Image
                alt={product.name}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                src={product.image}
              />
            )}

            {/* Discount badge - top left */}
            {discount > 0 && (
              <Badge className="absolute left-1 top-1 bg-red-500 px-1.5 py-0 text-xs font-bold text-white">
                -{discount}%
              </Badge>
            )}

            {/* Wishlist button - top right */}
            <button
              className="absolute right-1 top-1 z-10 rounded-full bg-white/80 p-1 backdrop-blur-sm"
              onClick={handleAddToWishlist}
              type="button"
            >
              <Heart
                className={cn(
                  "h-3 w-3",
                  isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600",
                )}
              />
            </button>
          </div>

          {/* Content - extremely compact */}
          <CardContent className="p-1.5">
            <h3 className="line-clamp-2 text-xs leading-tight">
              {product.name}
            </h3>

            <h5 className="line-clamp-2 text-xs leading-tight">
              {product.description}
            </h5>

            {/* Price section - single line */}
            <div className="mt-1 flex items-baseline justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-red-500">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-[0.65rem] text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Add to cart button - tiny and inline */}
              <button
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full bg-red-500 p-0 text-white",
                  currentQuantity > 0 && "bg-green-500",
                  isAddingToCart && "opacity-70",
                )}
                disabled={isAddingToCart || !product.stock}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <ShoppingCart className="h-3 w-3" />
                )}
              </button>
            </div>

            {/* Rating - very small */}
            {product.rating && (
              <div className="mt-0.5 flex items-center">
                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                <span className="ml-0.5 text-[0.6rem] text-gray-500">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </CardContent>

          {/* Out of stock indicator */}
          {!product.stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <span className="rounded bg-red-500 px-1 py-0.5 text-[0.6rem] font-medium text-white">
                Sold Out
              </span>
            </div>
          )}
        </Card>
      </Link>
    </div>
  );
}
