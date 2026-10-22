import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { AppHeader } from "@/components/layout/app-header";
import { Footer } from "@/components/layout/footer";
import { FloatingCartBar } from "@/components/layout/floating-cart-bar";
import { LocationModal } from "@/components/location/location-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AuthDrawer } from "@/components/auth/auth-drawer";
import { WebsiteJsonLd } from "@/components/seo/website-json-ld";
import { SITE_CONFIG } from "@/lib/constants/site-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} - Instant Grocery & Essentials Delivery`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_CONFIG.url,
    title: `${SITE_CONFIG.name} - Instant Grocery Delivery`,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} - Instant Grocery Delivery`,
    description: SITE_CONFIG.description,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} style={{ colorScheme: "light" }} data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <WebsiteJsonLd />
      </head>
      <body className={`${poppins.className} font-sans min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased flex flex-col selection:bg-[#18A818]/20 selection:text-[#18A818]`}>
        <AppProviders>
          {/* Top Header */}
          <AppHeader />

          {/* Main Content Area */}
          <main className="flex-1 w-full">{children}</main>

          {/* Footer */}
          <Footer />

          {/* Global Floating Elements & Modals */}
          <FloatingCartBar />
          <LocationModal />
          <CartDrawer />
          <AuthDrawer />
        </AppProviders>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
