"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, QrCode, Link as LinkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";
import { Textarea } from "~/ui/primitives/textarea";

const BUSINESS_TYPES = ["Store", "Restaurant", "Service Provider", "Other"];

export function SignUpPageClient() {
  const router = useRouter();
  const [step, setStep] = useState<"business" | "personal">("personal");
  const [formData, setFormData] = useState({
    address: "",
    aboutBusiness: "",
    businessName: "",
    email: "",
    name: "",
    password: "",
    phone: "",
    state: "",
    referal: "",
    type: "",
    whatsapp: "",
    customType: "",
    logo: null as File | null,
    storeUrl: "", // Added storeUrl
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasEditedStoreUrl, setHasEditedStoreUrl] = useState(false); // Added for store URL auto-fill
  const searchParams = useSearchParams();
  const referal = searchParams.get("ref") as string;

  console.log("The referal its self", referal);

  // Auto-generate store URL when business name changes (only if user hasn't manually edited the URL)
  useEffect(() => {
    if (formData.businessName && !hasEditedStoreUrl) {
      const generatedUrl = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

      setFormData((prev) => ({
        ...prev,
        storeUrl: generatedUrl,
      }));
    }
  }, [formData.businessName, hasEditedStoreUrl]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStoreUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "") // Only allow letters, numbers, and hyphens
      .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    setFormData((prev) => ({
      ...prev,
      storeUrl: value,
    }));

    // Mark that user has manually edited the URL
    if (!hasEditedStoreUrl) {
      setHasEditedStoreUrl(true);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setError("Please fill all required fields");
      return;
    }
    setError("");
    setStep("business");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalBusinessType =
      formData.type === "Other" ? formData.customType : formData.type;

    if (!formData.businessName || !formData.address || !finalBusinessType) {
      setError("Please fill all required business fields");
      setLoading(false);
      return;
    }

    // Validate store URL
    const storeUrlValue = formData.storeUrl || "";
    if (storeUrlValue.trim().length > 0) {
      // 1. Length Validation (ONLY runs if content is present)
      if (storeUrlValue.length < 3) {
        setError("Store URL must be at least 3 characters long");
        setLoading(false);
        return;
      }

      // 2. Format Validation (ONLY runs if content is present)
      if (!/^[a-z0-9-]+$/.test(storeUrlValue)) {
        setError(
          "Store URL can only contain lowercase letters, numbers, and hyphens",
        );
        setLoading(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("address", formData.address);
      formDataToSend.append("aboutBusiness", formData.aboutBusiness);
      formDataToSend.append("businessName", formData.businessName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("type", finalBusinessType);
      formDataToSend.append("referal", referal || "");
      formDataToSend.append("whatsapp", formData.whatsapp);
      formDataToSend.append("storeUrl", formData.storeUrl); // Added storeUrl
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      console.log("store url", formData.storeUrl);

      const response = await fetch("../../../api/user", {
        body: formDataToSend,
        method: "POST",
      });

      if (!response.ok) {
        const errorData: any = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage =
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error === "AccessDenied"
              ? "Your account is not authorized"
              : "Login failed. Please try again";

        setError(errorMessage);
      } else if (result?.url) {
        const callbackUrl = new URL(result.url).searchParams.get("callbackUrl");
        router.push(callbackUrl || "/dashboard");
      } else {
        setError("Login successful but no redirect URL found");
        router.push("/");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-4 text-center">
          <Link
            className="flex items-center space-x-2 text-2xl font-extrabold tracking-tight text-primary transition-transform duration-300 hover:scale-105"
            href="/"
          >
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <span>Qreta</span>
          </Link>
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Setup your business in Qreta in 2 minutes and start selling.
          </p>
          <div className="flex justify-center">
            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step === "personal"
                    ? `bg-primary text-primary-foreground`
                    : `bg-muted`
                }`}
              >
                1
              </div>
              <div className="mx-2 h-0.5 w-8 bg-muted"></div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step === "business"
                    ? `bg-primary text-primary-foreground`
                    : `bg-muted`
                }`}
              >
                2
              </div>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-2">
            {step === "personal" ? (
              <form className="space-y-4" onSubmit={handleContinue}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    type="text"
                    value={formData.name}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    onChange={handleChange}
                    placeholder="234 XXX XXX XXXX"
                    required
                    type="tel"
                    value={formData.phone}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      onChange={handleChange}
                      required
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" type="submit">
                  Continue to Business Info
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      onChange={handleChange}
                      placeholder="Your Business Name"
                      required
                      type="text"
                      value={formData.businessName}
                    />
                  </div>

                  {/* Store URL Input - Added to business section */}
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="storeUrl">Your Store URL *</Label>
                    <div className="flex items-center">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        myqreta.com/
                      </div>
                      <Input
                        id="storeUrl"
                        name="storeUrl"
                        onChange={handleStoreUrlChange}
                        placeholder="your-store-name"
                        type="text"
                        value={formData.storeUrl}
                        className="rounded-l-none border-l-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your store will be available at:{" "}
                      <span className="font-medium text-primary">
                        myqreta.com/{formData.storeUrl || "your-store-name"}
                      </span>
                    </p>
                    {!hasEditedStoreUrl && formData.businessName && (
                      <p className="text-xs text-blue-600">
                        💡 This was auto-generated from your business name. You
                        can edit it.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Input
                      id="address"
                      name="address"
                      onChange={handleChange}
                      placeholder="123 Business St"
                      required
                      type="text"
                      value={formData.address}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="type">
                      Business Type{" "}
                      <span className="text-xs text-orange-500">
                        (Service Provider: Can be a consultant, artisan,
                        mechanic, graphics designer, etc.)
                      </span>
                    </Label>
                    <select
                      className={`
                        flex h-10 w-full rounded-md border border-input
                        bg-background px-3 py-2 text-sm ring-offset-background
                        file:border-0 file:bg-transparent file:text-sm
                        file:font-medium
                        placeholder:text-muted-foreground
                        focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:ring-offset-2 focus-visible:outline-none
                        disabled:cursor-not-allowed disabled:opacity-50
                      `}
                      id="type"
                      name="type"
                      onChange={handleChange}
                      required
                      value={formData.type}
                    >
                      <option value="">Select your business type </option>
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.type === "Other" && (
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="customType">Specify Business Type </Label>
                      <Input
                        id="customType"
                        name="customType"
                        onChange={handleChange}
                        placeholder="e.g., Landscaping, Pet Grooming"
                        required
                        type="text"
                        value={formData.customType}
                      />
                    </div>
                  )}
                  <div className="grid gap-2 md:col-span-2">
                    <Label className="mb-1 block text-sm font-medium">
                      Business Logo{" "}
                      <span className="text-xs text-orange-500">
                        (Optional; you can upload your logo later.)
                      </span>
                    </Label>
                    <div className="flex items-center gap-4">
                      {previewLogo ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-full">
                          <img
                            alt="Logo preview"
                            className="h-full w-full object-cover"
                            src={previewLogo}
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      )}
                      <label className="flex-1">
                        <div className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                          {formData.logo ? "Change logo" : "Upload logo"}
                        </div>
                        <input
                          accept="image/*"
                          className="hidden"
                          id="logo"
                          name="logo"
                          onChange={handleLogoChange}
                          type="file"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-orange-500 text-muted-foreground">
                      <span className="text-xs text-orange-500">
                        Recommended size 500x500px
                      </span>
                    </p>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="aboutBusiness">About Business</Label>
                    <Textarea
                      id="aboutBusiness"
                      name="aboutBusiness"
                      onChange={handleChange}
                      placeholder="Describe your business, services, or products..."
                      value={formData.aboutBusiness}
                      maxLength={180}
                    />
                    <p className="text-xs flex justify-between mt-1">
                      <span className="text-xs text-orange-500">
                        {" "}
                        This will be displayed on your storefront.
                      </span>
                      <span>{formData.aboutBusiness.length}/180</span>
                    </p>
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      onChange={handleChange}
                      placeholder="234 XXX XXX XXXX"
                      type="tel"
                      value={formData.whatsapp}
                    />
                    <p className="text-xs text-orange-500 text-muted-foreground">
                      <span className="text-xs text-orange-500">
                        {" "}
                        for customer communications
                      </span>
                    </p>
                  </div>
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setStep("personal")}
                    type="button"
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button className="flex-1" disabled={loading} type="submit">
                    {loading ? (
                      <>
                        <svg
                          className={`
                            mr-3 -ml-1 h-4 w-4 animate-spin text-white
                          `}
                          fill="none"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            fill="currentColor"
                          ></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
            {step === "personal" && (
              <>
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </>
            )}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className={`
                  text-primary underline-offset-4
                  hover:underline
                `}
                href="/auth/sign-in"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
