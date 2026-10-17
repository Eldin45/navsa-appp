// ui/components/products-table.tsx
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash, Edit, ImageIcon } from "lucide-react";
import { Button } from "~/ui/primitives/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  description?: string;
  variants?: string;
  colorVariants?: string;
  salePrice?: number;
}

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => Promise<void>;
}

const MAX_DESCRIPTION_LENGTH = 50;

export function ProductsTable({
  products,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteClick = useCallback(
    async (productId: string, productName: string) => {
      if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
        setIsDeleting(productId);
        try {
          await onDelete(productId);
          toast.success("Product deleted successfully");
        } catch (err) {
          toast.error("Failed to delete product");
        } finally {
          setIsDeleting(null);
        }
      }
    },
    [onDelete],
  );

  const parseVariants = (variants?: string) => {
    if (!variants) return [];
    try {
      const variantsData =
        typeof variants === "string" ? JSON.parse(variants) : variants;
      return Array.isArray(variantsData) ? variantsData : [];
    } catch (error) {
      console.error("Failed to parse variants JSON:", error);
      return [];
    }
  };

  const truncateDescription = (description?: string) => {
    if (!description) return "";
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
    }
    return description;
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => {
              const variants = parseVariants(product.variants);
              const truncatedDesc = truncateDescription(product.description);

              return (
                <TableRow key={product.id}>
                  <TableCell className="p-2">
                    {product.images?.[0] ? (
                      <div className="relative h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          // Corrected Next.js Image props for v13+
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                    {variants.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {variants.length} variant
                        {variants.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    {product.salePrice &&
                    product.salePrice !== product.price ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">
                          ₦{product.salePrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          ₦{product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold">
                        ₦{product.price.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        product.stock > 50
                          ? "text-green-600"
                          : product.stock > 10
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>{truncatedDesc}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteClick(product.id, product.name)
                        }
                        disabled={isDeleting === product.id}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
