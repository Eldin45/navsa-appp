"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Menu,
  X,
  Instagram,
  Facebook,
  QrCode,
  Store,
  MessageSquare,
  Smartphone,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
} from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  [key: string]: any; // For other props like onClick, etc.
}

interface JoinNowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Reusable components from HomePage
// --- Reusable Button Component ---
function Button({
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default:
      "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md",
    outline:
      "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-9 w-9",
  };

  const finalClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ""}`;

  return (
    <button className={finalClasses} {...props}>
      {children}
    </button>
  );
}

// --- Reusable Header Component ---
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#about", name: "About Us" },
    { href: "#how-it-works", name: "How It Works" },
    { href: "#pricing", name: "Pricing" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? "py-2 shadow-md" : "py-4"}`}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link
              className="flex items-center space-x-2 text-2xl font-extrabold tracking-tight text-primary transition-transform duration-300 hover:scale-105"
              href="/"
            >
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white">
                <QrCode className="h-5 w-5" />
              </div>
              <span>Qreta</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="#"
                className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary hover:scale-105"
              >
                Home
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary hover:scale-105"
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Link href="https://instagram.com" target="_blank">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full transition-all duration-300 hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://facebook.com" target="_blank">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full transition-all duration-300 hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="h-6 w-px bg-border mx-2" />
            <Link href="/auth/sign-in">
              <Button
                size="sm"
                variant="ghost"
                className="transition-all duration-300 hover:scale-105"
              >
                Log In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="sm"
                className="transition-all duration-300 hover:scale-105"
              >
                Sign Up
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-1.5 rounded-md transition-all duration-300 hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden w-full border-b bg-background/95 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col space-y-2 p-4">
            <Link
              className="text-base font-medium text-foreground hover:text-primary py-2 px-4 rounded-md transition-all duration-300 hover:bg-muted"
              href="#"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                className="text-base font-medium text-foreground hover:text-primary py-2 px-4 rounded-md transition-all duration-300 hover:bg-muted"
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t mt-2 flex flex-col space-y-2">
              <Link
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full" variant="ghost">
                  Log In
                </Button>
              </Link>
              <Link
                href="/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full transition-all duration-300 hover:scale-[1.02]">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// --- Reusable Footer Component ---
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-50 py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white">
                <QrCode className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold">Qreta</h3>
            </div>
            <p className="text-gray-300">
              Your business just a scan away. Connect with customers instantly.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href=""
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href=""
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href=""
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-2" /> info@myqreta.com
              </li>
              <li className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-2" /> +2348123699909
              </li>
              <li className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-2" /> Abuja Nigeria
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © {new Date().getFullYear()} Qreta. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              href="https://instagram.com"
              target="_blank"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="https://facebook.com"
              target="_blank"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- ScrollToTop Component ---
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    // biome-ignore lint/a11y/useButtonType: <explanation>
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

// --- Join Now Modal Component ---
function JoinNowModal({ isOpen, onClose }: JoinNowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-sm md:max-w-md animate-in fade-in zoom-in-90 duration-300">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-2xl font-bold text-foreground">
            Join Qreta Today!
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <p className="text-muted-foreground mb-6 text-center">
          Choose how you'd like to set up your digital storefront.
        </p>
        <div className="flex flex-col space-y-4">
          <Link href="/auth/sign-up" passHref>
            <Button
              as="a"
              size="lg"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-lg"
            >
              <Smartphone className="h-6 w-6" /> Join via Web
            </Button>
          </Link>
          <a
            href="https://wa.me/2348012345678?text=Hello%2C%20I%20want%20to%20get%20started%20with%20Qreta!"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-lg bg-green-500 text-white hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              <MessageSquare className="h-6 w-6" /> Join via WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function GetStartedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-muted/50">
        {/* Hero / Introduction Section */}
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-background via-muted/50 to-background">
          <div className="bg-grid-black/[0.03] absolute inset-0 bg-[length:20px_20px]" />
          <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Qreta: Your Business, Just a Scan Away
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
              Transform how you sell and connect with customers across Nigeria.
              Get your instant digital storefront today!
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="h-14 px-10 text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => setIsModalOpen(true)}
              >
                Join Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works - Visual & Concise */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-primary/20">
                <Image
                  src="/about.png"
                  alt="Phone displaying Qreta digital storefront"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 via-transparent to-transparent" />
              </div>
              <div className="space-y-6">
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Connect, Showcase, Sell: It's That Simple
                </h2>
                <ul className="space-y-4 text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>
                      **Instant Storefront:** Get your personalized online shop
                      up and running in minutes, no coding needed.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>
                      **QR & Link Powered:** Share your unique QR code or link
                      to instantly connect customers to your products.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>
                      **Direct Orders:** Receive orders directly via WhatsApp,
                      SMS, or calls. Maintain full control and personal touch.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>
                      **Expand Your Reach:** Turn every interaction into a sales
                      opportunity. Perfect for businesses in Lugbe, Abuja, and
                      beyond!
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Repeating for strong call to action */}
        <section className="py-12 md:py-16 bg-muted">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Join thousands of smart vendors already boosting their sales and
              outreach with Qreta.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="h-14 px-10 text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => setIsModalOpen(true)}
              >
                Start Selling Today! <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
      <JoinNowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
