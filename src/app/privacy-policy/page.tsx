"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Menu,
  X,
  Instagram,
  Facebook,
  QrCode,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
} from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

// Reusable components from HomePage
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

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/about", name: "About Us" },
    { href: "/contact", name: "Contact" },
    { href: "/pricing", name: "Pricing" },
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
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" variant="ghost">
                  Log In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
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

function ScrollToTop() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
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

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white">
                <QrCode className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold">Qreta</h3>
            </div>
            <p className="text-gray-400">
              Your business just a scan away. Connect with customers instantly.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-400 hover:text-white transition-colors"
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
                  href="/help"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Abuja, FCT, Nigeria
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5" /> +234 801 234 5678
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5" /> info@qreta.com
              </li>
            </ul>
            <div className="mt-4 flex space-x-4">
              <Link href="https://facebook.com/qreta" target="_blank">
                <Facebook className="h-6 w-6 text-gray-400 transition-colors hover:text-white" />
              </Link>
              <Link href="https://instagram.com/qreta" target="_blank">
                <Instagram className="h-6 w-6 text-gray-400 transition-colors hover:text-white" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Qreta. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-muted/50">
        <section className="bg-background py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto text-center">
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Privacy Policy
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
                Your privacy is important to us. This policy outlines how we
                handle your personal information.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                This Privacy Policy describes how{" "}
                <strong>Qreta ("we," "us," or "our")</strong> collects, uses,
                and discloses your information when you use our service and the
                choices you have associated with that information.
              </p>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                1. Information We Collect
              </h2>
              <p>
                We collect several different types of information for various
                purposes to provide and improve our Service to you.
              </p>
              <h3 className="text-foreground mt-6 mb-2 font-semibold text-2xl">
                Personal Data
              </h3>
              <p>
                While using our Service, we may ask you to provide us with
                certain personally identifiable information that can be used to
                contact or identify you. Personally identifiable information may
                include, but is not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Usage Data</li>
              </ul>
              <h3 className="text-foreground mt-6 mb-2 font-semibold text-2xl">
                Usage Data
              </h3>
              <p>
                We may also collect information on how the Service is accessed
                and used. This Usage Data may include information such as your
                computer's IP address, browser type, browser version, the pages
                of our Service that you visit, the time and date of your visit,
                the time spent on those pages, unique device identifiers, and
                other diagnostic data.
              </p>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                2. Use of Data
              </h2>
              <p>Qreta uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer care and support</li>
                <li>
                  To provide analysis or valuable information so that we can
                  improve the Service
                </li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent, and address technical issues</li>
              </ul>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                3. Your Data Protection Rights
              </h2>
              <p>
                We aim to take reasonable steps to allow you to correct, amend,
                delete, or limit the use of your Personal Data.
              </p>
              <p>
                If you wish to be informed what Personal Data we hold about you
                and if you want it to be removed from our systems, please
                contact us.
              </p>
              <p>
                In certain circumstances, you have the following data protection
                rights:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>The right to access</strong>, update or to delete the
                  information we have on you.
                </li>
                <li>
                  <strong>The right of rectification</strong>. You have the
                  right to have your information rectified if that information
                  is inaccurate or incomplete.
                </li>
                <li>
                  <strong>The right to object</strong>. You have the right to
                  object to our processing of your Personal Data.
                </li>
                <li>
                  <strong>The right to data portability</strong>. You have the
                  right to be provided with a copy of the information we have on
                  you in a structured, machine-readable and commonly used
                  format.
                </li>
                <li>
                  <strong>The right to withdraw consent</strong>. You also have
                  the right to withdraw your consent at any time where we relied
                  on your consent to process your personal information.
                </li>
              </ul>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                4. Data Security
              </h2>
              <p>
                The security of your data is important to us, but remember that
                no method of transmission over the Internet or method of
                electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your Personal Data, we
                cannot guarantee its absolute security.
              </p>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                5. Links to Other Sites
              </h2>
              <p>
                Our Service may contain links to other sites that are not
                operated by us. If you click on a third-party link, you will be
                directed to that third party's site. We strongly advise you to
                review the Privacy Policy of every site you visit.
              </p>
              <p>
                We have no control over and assume no responsibility for the
                content, privacy policies, or practices of any third-party sites
                or services.
              </p>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                6. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for
                any changes. Changes to this Privacy Policy are effective when
                they are posted on this page.
              </p>

              <h2 className="text-foreground mt-8 mb-4 font-bold text-3xl">
                7. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>By email: info@qreta.com</li>
                <li>By visiting this page on our website: /contact</li>
                <li>By phone number: +234 801 234 5678</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-xl bg-primary/10 p-8 shadow-lg md:p-12">
              <div className="bg-grid-white/[0.05] absolute inset-0 bg-[length:16px_16px]" />
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  Ready to Start Your Journey?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                  Join thousands of vendors and transform every interaction into
                  a sale.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="px-8">
                      Sign Up Now
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button size="lg" variant="outline" className="px-8">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
