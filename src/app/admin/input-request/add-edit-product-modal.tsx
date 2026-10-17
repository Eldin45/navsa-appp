"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Plus,
  MinusCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@headlessui/react";
import CurrencyInput from "react-currency-input-field";

interface Product {
  id: string;
  name: string;
  price: number | string;
  category: string;
  stock: number;
  description?: string;
  images?: string[];
  salePrice?: number | string;
  variants?: string;
  colorVariants?: string;
}

interface Variant {
  size: string;
  price: string;
}

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSave: (formData: FormData, editingId?: string) => Promise<void>;
  businessId?: string;
  busType?: string;
}

// Default categories as fallback
const DEFAULT_CATEGORIES = [
  "Electronics",
  "Apparel",
  "Accessories",
  "Food",
  "Beverages",
  "Home",
  "Beauty",
  "Sports",
  "Other",
];

// Restaurant-specific categories
const RESTAURANT_CATEGORIES = [
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Soups",
  "Salads",
  "Sides",
  "Specials",
  "Other",
];

// Validate image file - SIMPLIFIED VERSION
const validateImageFile = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return "Image size must be less than 5MB";
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }

  return null;
};

export function AddEditProductModal({
  isOpen,
  onClose,
  editingProduct,
  onSave,
  businessId,
  busType,
}: AddEditProductModalProps) {
  interface Variant {
    size: string;
    price: string;
  }

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    description: "",
    price: "",
    salePrice: "",
    variants: [{ size: "", price: "" }],
    colorVariants: [""],
  });

  const MAX_IMAGES = 3;
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariants, setEditingVariants] = useState<Variant[]>([]);
  const [editingColorVariants, setEditingColorVariants] = useState<string[]>(
    [],
  );
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Check business type (case-insensitive)
  const businessType = busType?.toLowerCase();
  const isServiceProvider = businessType === "service provider";
  const isRestaurant = businessType === "restaurant";

  // Dynamic labels based on business type
  const labels = {
    item: isRestaurant ? "Menu" : isServiceProvider ? "Service" : "Product",
    itemLower: isRestaurant
      ? "menu"
      : isServiceProvider
        ? "service"
        : "product",
    items: isRestaurant ? "Menus" : isServiceProvider ? "Services" : "Products",
    itemsLower: isRestaurant
      ? "menus"
      : isServiceProvider
        ? "services"
        : "products",
    variantLabel: isRestaurant ? "Portion" : "Size",
    variantPlaceholder: isRestaurant
      ? "Portion (e.g., Small, Medium, Large, Family)"
      : "Size (e.g., Small, Medium, 250ml)",
    variantSectionTitle: isRestaurant ? "Portion Variants" : "Size Variants",
    variantDescription: isRestaurant
      ? "Different portions and prices of the same menu item"
      : "Different sizes and prices of the same product if available",
  };

  // Use restaurant categories if business is restaurant
  const baseCategories = isRestaurant
    ? RESTAURANT_CATEGORIES
    : DEFAULT_CATEGORIES;

  // Fetch categories when modal opens and businessId is available
  useEffect(() => {
    const fetchCategories = async () => {
      if (!businessId) {
        setCategories(baseCategories);
        return;
      }

      setIsLoadingCategories(true);
      try {
        const res = await fetch(
          `/api/category?bussinessId=${encodeURIComponent(businessId)}`,
        );

        if (res.ok) {
          const data: any = await res.json();
          const foundCategories = data.foundCategory;

          // Extract category names from objects and add "Other" option
          const categoryNames =
            foundCategories?.map((cat: any) => cat.name) || [];
          setCategories([...categoryNames, "Other"]);
        } else {
          throw new Error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Use appropriate default categories as fallback
        setCategories(baseCategories);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen && businessId) {
      fetchCategories();
    }
  }, [isOpen, businessId, baseCategories]);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Check if the product's category exists in the current categories (excluding "Other")
        const isPredefined = categories
          .slice(0, -1)
          .includes(editingProduct.category);
        setIsCustomCategory(!isPredefined);

        const parseVariants = (variantsData: any): Variant[] => {
          if (!variantsData) return [];

          let data = variantsData;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (error) {
              console.error("Failed to parse variants JSON:", error);
              return [];
            }
          }

          if (Array.isArray(data)) {
            return data.filter(
              (item): item is Variant =>
                typeof item === "object" &&
                item !== null &&
                "size" in item &&
                "price" in item,
            );
          }
          return [];
        };

        const parseColorVariants = (colorData: any): string[] => {
          if (!colorData) return [];

          let data = colorData;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (error) {
              console.error("Failed to parse color variants JSON:", error);
              return [];
            }
          }

          if (Array.isArray(data)) {
            return data.filter(
              (item): item is string => typeof item === "string",
            );
          }
          return [];
        };

        const parsedVariants = parseVariants(editingProduct.variants);
        const parsedColorVariants = parseColorVariants(
          editingProduct.colorVariants,
        );

        setEditingVariants(parsedVariants);
        setEditingColorVariants(parsedColorVariants);

        setFormData({
          name: editingProduct.name,
          category: isPredefined ? editingProduct.category : "",
          stock: editingProduct.stock,
          description: editingProduct.description || "",
          price: editingProduct.price?.toString() || "",
          salePrice: editingProduct.salePrice?.toString() || "",
          variants:
            parsedVariants.length > 0
              ? parsedVariants
              : [{ size: "", price: "" }],
          colorVariants:
            parsedColorVariants.length > 0 ? parsedColorVariants : [""],
        });

        setImagePreviewUrls(editingProduct.images || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingProduct, categories]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      stock: 0,
      description: "",
      price: "",
      salePrice: "",
      variants: [{ size: "", price: "" }],
      colorVariants: [""],
    });
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setSubmitError("");
    setIsCustomCategory(false);
    setIsProcessingImages(false);
  };

  // SIMPLIFIED Image Handling - No Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_IMAGES) {
      toast.error(`You can only upload a maximum of ${MAX_IMAGES} images.`);
      if (e.target) e.target.value = "";
      return;
    }

    setIsProcessingImages(true);
    setSubmitError("");

    try {
      const validFiles: File[] = [];
      const previewUrls: string[] = [];

      // Process files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validationError = validateImageFile(file);
        if (validationError) {
          toast.error(`"${file.name}": ${validationError}`);
          continue;
        }

        validFiles.push(file);

        // Create preview URL
        try {
          const previewUrl = URL.createObjectURL(file);
          previewUrls.push(previewUrl);
        } catch (previewError) {
          console.error(
            "Failed to create preview for:",
            file.name,
            previewError,
          );
          toast.error(`Failed to preview "${file.name}"`);
          // Remove the file if preview fails
          validFiles.pop();
        }
      }

      if (validFiles.length > 0) {
        setSelectedImages(validFiles);
        setImagePreviewUrls(previewUrls);
        toast.success(`Added ${validFiles.length} image(s)`);
      } else {
        setSubmitError(
          "No valid images were selected. Please check file formats and sizes.",
        );
      }
    } catch (error) {
      console.error("Image processing error:", error);
      const errorMessage =
        "Failed to process images. Please try different images.";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessingImages(false);
      // Reset file input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleImageClick = () => {
    if (!isProcessingImages) {
      fileInputRef.current?.click();
    }
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }

    const newFiles = [...selectedImages];
    newFiles.splice(index, 1);
    setSelectedImages(newFiles);

    const newUrls = [...imagePreviewUrls];
    newUrls.splice(index, 1);
    setImagePreviewUrls(newUrls);
  };

  // Clean up object URLs when component unmounts or modal closes
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === "Other") {
      setIsCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setIsCustomCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  const addVariant = () =>
    setFormData({
      ...formData,
      variants: [...formData.variants, { size: "", price: "" }],
    });

  const removeVariant = (index: number) => {
    if (formData.variants.length === 1) return;
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (
    index: number,
    field: "size" | "price",
    value: string,
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const addColorVariant = () =>
    setFormData({
      ...formData,
      colorVariants: [...formData.colorVariants, ""],
    });

  const removeColorVariant = (index: number) => {
    if (formData.colorVariants.length === 1) return;
    const newColors = [...formData.colorVariants];
    newColors.splice(index, 1);
    setFormData({ ...formData, colorVariants: newColors });
  };

  const updateColorVariant = (index: number, value: string) => {
    const newColors = [...formData.colorVariants];
    newColors[index] = value;
    setFormData({ ...formData, colorVariants: newColors });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (
        !formData.name ||
        (!isCustomCategory && !formData.category) ||
        (isCustomCategory && !formData.category.trim())
      ) {
        setSubmitError("Please fill in all required fields.");
        return;
      }

      // Skip stock validation for service providers and restaurants
      if (!isServiceProvider && !isRestaurant && formData.stock < 0) {
        setSubmitError("Stock must be a non-negative number.");
        return;
      }

      // Skip variant validation for service providers
      if (!isServiceProvider) {
        for (const variant of formData.variants) {
          if (
            (variant.size.trim() && !variant.price.trim()) ||
            (variant.price.trim() && !variant.size.trim())
          ) {
            setSubmitError(
              `All ${labels.variantLabel.toLowerCase()} variants must have both a ${labels.variantLabel.toLowerCase()} and a price.`,
            );
            return;
          }
        }
      }

      const priceValue = Number(formData.price);
      const salePriceValue = formData.salePrice
        ? Number(formData.salePrice)
        : undefined;

      if (salePriceValue !== undefined && salePriceValue >= priceValue) {
        setSubmitError("Discount price must be less than the base price.");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);

      // Only append stock if not service provider or restaurant
      if (!isServiceProvider && !isRestaurant) {
        formDataToSend.append("stock", formData.stock.toString());
      } else {
        formDataToSend.append("stock", "0"); // Default to 0 for service providers and restaurants
      }

      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", priceValue.toString());

      if (salePriceValue !== undefined && !isNaN(salePriceValue)) {
        formDataToSend.append("salePrice", salePriceValue.toString());
      } else {
        formDataToSend.append("salePrice", "0");
      }

      // Only append variants if not service provider
      if (!isServiceProvider) {
        formDataToSend.append("variants", JSON.stringify(formData.variants));
        formDataToSend.append(
          "colorVariants",
          JSON.stringify(formData.colorVariants),
        );
      } else {
        // Send empty arrays for service providers
        formDataToSend.append("variants", JSON.stringify([]));
        formDataToSend.append("colorVariants", JSON.stringify([]));
      }

      selectedImages.forEach((file) => {
        formDataToSend.append("images", file);
      });

      await onSave(formDataToSend, editingProduct?.id);
      onClose();
      toast.success(
        editingProduct
          ? `${labels.item} updated successfully!`
          : `${labels.item} added successfully!`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to save ${labels.itemLower}`;
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-start justify-center overflow-y-auto p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-lg dark:bg-gray-900">
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
            <h2 className="text-xl font-bold">
              {editingProduct ? `Edit ${labels.item}` : `Add ${labels.item}`}
            </h2>
            <button
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onClose}
              disabled={isSubmitting || isProcessingImages}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {labels.item} Name*
                  </label>
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    required
                    value={formData.name}
                    placeholder={`${labels.item} Name`}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category*{" "}
                    <span className="text-xs text-orange-500">
                      (Select Other to add new category)
                    </span>
                  </label>
                  <select
                    className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    required={!isCustomCategory}
                    value={isCustomCategory ? "Other" : formData.category}
                    onChange={handleCategoryChange}
                    disabled={isLoadingCategories}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {isLoadingCategories && (
                    <p className="text-xs text-gray-500 mt-1">
                      Loading categories...
                    </p>
                  )}
                </div>
                {isCustomCategory && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Custom Category*
                    </label>
                    <input
                      className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder={
                        isRestaurant
                          ? "e.g., Vegan Options, Chef's Special"
                          : "e.g., Handmade Jewelry"
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 sm:col-span-5">
                    <label className="mb-1 block text-sm font-medium">
                      {isRestaurant
                        ? "Menu"
                        : isServiceProvider
                          ? "Service"
                          : "Base"}{" "}
                      Price *
                    </label>
                    <CurrencyInput
                      className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      required
                      placeholder="0.00"
                      decimalsLimit={2}
                      prefix="₦"
                      groupSeparator=","
                      decimalSeparator="."
                      value={formData.price}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          price: value ?? "",
                        })
                      }
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-5">
                    <label className="mb-1 block text-sm font-medium">
                      Discount Price
                    </label>
                    <CurrencyInput
                      className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      placeholder="0.00"
                      decimalsLimit={2}
                      prefix="₦"
                      groupSeparator=","
                      decimalSeparator="."
                      value={formData.salePrice}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          salePrice: value ?? "",
                        })
                      }
                    />
                  </div>

                  {/* Stock field - only show for regular products (not service providers or restaurants) */}
                  {!isServiceProvider && !isRestaurant && (
                    <div className="col-span-full sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium">
                        Stock{" "}
                        <span className="text-xs text-orange-500">
                          (Optional)
                        </span>
                      </label>
                      <input
                        className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Size/Portion Variants - only show for non-service providers */}
                {!isServiceProvider && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      {labels.variantSectionTitle}{" "}
                      <span className="text-xs text-orange-500">
                        ({labels.variantDescription})
                      </span>
                    </label>
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div
                          key={index}
                          className="flex flex-col md:flex-row items-center gap-2 w-full"
                        >
                          <input
                            className="w-full md:w-auto flex-1 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                            placeholder={labels.variantPlaceholder}
                            value={variant.size || ""}
                            onChange={(e) =>
                              updateVariant(index, "size", e.target.value)
                            }
                          />
                          <CurrencyInput
                            className="w-30 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                            placeholder="Price"
                            decimalsLimit={2}
                            prefix="₦"
                            groupSeparator=","
                            decimalSeparator="."
                            value={variant.price || ""}
                            onValueChange={(value) => {
                              updateVariant(index, "price", value ?? "");
                            }}
                          />
                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4" />
                        Add {labels.variantLabel} Variant
                      </button>
                    </div>
                  </div>
                )}

                {/* Color Variants - only show for non-service providers and non-restaurants */}
                {!isServiceProvider && !isRestaurant && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Color Variants{" "}
                      <span className="text-xs text-orange-500">
                        (Available colors if any)
                      </span>
                    </label>
                    <div className="space-y-3">
                      {formData.colorVariants.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            className="flex-1 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                            placeholder="Color (e.g., Red, Blue)"
                            value={color}
                            onChange={(e) =>
                              updateColorVariant(index, e.target.value)
                            }
                          />
                          {formData.colorVariants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeColorVariant(index)}
                              className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addColorVariant}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4" />
                        Add Color Variant
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {labels.item} Description
                  </label>
                  <textarea
                    className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={
                      isRestaurant
                        ? "e.g., Freshly prepared with locally sourced ingredients, served with your choice of sides..."
                        : isServiceProvider
                          ? "e.g., Professional cleaning service with eco-friendly products..."
                          : "e.g., Made from 100% organic cotton..."
                    }
                  />
                </div>
                {submitError && (
                  <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {submitError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {labels.item} Images
                  </label>
                  <div
                    className={`relative flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center dark:border-gray-800 ${
                      !isProcessingImages
                        ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        : "cursor-not-allowed opacity-60"
                    }`}
                    onClick={handleImageClick}
                  >
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      type="file"
                      multiple
                      disabled={isProcessingImages}
                    />

                    {isProcessingImages ? (
                      <div className="space-y-2">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Processing images... Please wait
                        </p>
                      </div>
                    ) : imagePreviewUrls.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              alt={`${labels.item} Preview ${index + 1}`}
                              className="h-24 w-24 rounded-lg object-cover"
                              src={url}
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Click to upload (Max {MAX_IMAGES} images)
                        </p>
                        <p className="text-xs text-gray-400">
                          Recommended: JPEG, PNG, WebP under 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t p-4 dark:border-gray-800">
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
                disabled={isSubmitting || isProcessingImages}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                disabled={isSubmitting || isProcessingImages}
                type="submit"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingProduct
                    ? `Save ${labels.item}`
                    : `Add ${labels.item}`}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
