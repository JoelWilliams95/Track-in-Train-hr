import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';
import ThemeProviderClient from '@/components/ThemeProviderClient';
import Footer from '@/components/Footer';
import { ModalProvider } from '@/contexts/ModalContext';
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Track-IN-Train HR",
  description: "Human Resources Management System for Track-IN-Train",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // userPhoto can be fetched server-side if needed
  const userPhoto = undefined;
  const cookieStore = await cookies();
  const userName = cookieStore.get('userName')?.value || '';
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ThemeProviderClient>
          <ModalProvider>
            <Header userPhoto={userPhoto} userName={userName} />
            <div style={{ flex: 1 }}>{children}</div>
            <Footer />
          </ModalProvider>
        </ThemeProviderClient>

        {/* Script to completely hide all dev tools and indicators */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Completely suppress all development tools and indicators
              if (typeof window !== 'undefined') {
                // Disable React DevTools global hook
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;

                // Override console methods to filter out dev messages
                const originalLog = console.log;
                const originalWarn = console.warn;
                const originalInfo = console.info;
                const originalError = console.error;

                const filterDevMessages = (args) => {
                  const message = args.join(' ').toLowerCase();
                  return !message.includes('react devtools') &&
                         !message.includes('download the react devtools') &&
                         !message.includes('react-devtools') &&
                         !message.includes('next.js') &&
                         !message.includes('webpack') &&
                         !message.includes('hot reload') &&
                         !message.includes('fast refresh') &&
                         !message.includes('dev server') &&
                         !message.includes('development mode');
                };

                console.log = function(...args) {
                  if (filterDevMessages(args)) {
                    originalLog.apply(console, args);
                  }
                };

                console.warn = function(...args) {
                  if (filterDevMessages(args)) {
                    originalWarn.apply(console, args);
                  }
                };

                console.info = function(...args) {
                  if (filterDevMessages(args)) {
                    originalInfo.apply(console, args);
                  }
                };

                console.error = function(...args) {
                  if (filterDevMessages(args)) {
                    originalError.apply(console, args);
                  }
                };

                // Hide any development indicators that appear
                const hideDevElements = () => {
                  const selectors = [
                    '[data-nextjs-toast]',
                    '[data-nextjs-dialog]',
                    '[data-nextjs-dialog-overlay]',
                    '.__next-dev-overlay',
                    '#__next-dev-overlay',
                    '[data-nextjs-errors-dialog]',
                    '[data-nextjs-terminal]',
                    '.nextjs-portal',
                    '[data-nextjs-scroll-lock]',
                    'div[style*="position: fixed"][style*="z-index: 9000"]',
                    'div[style*="position: fixed"][style*="bottom: 16px"]',
                    'div[style*="position: fixed"][style*="right: 16px"]'
                  ];

                  selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      if (el && el.style) {
                        el.style.display = 'none !important';
                        el.style.visibility = 'hidden !important';
                        el.style.opacity = '0 !important';
                        el.style.pointerEvents = 'none !important';
                        el.style.zIndex = '-9999 !important';
                        el.remove();
                      }
                    });
                  });
                };

                // Run immediately and on DOM changes
                hideDevElements();

                // Set up observer for dynamic elements
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                      hideDevElements();
                    }
                  });
                });

                // Start observing
                if (document.body) {
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                  });
                }

                // Also observe document changes
                document.addEventListener('DOMContentLoaded', hideDevElements);
                window.addEventListener('load', hideDevElements);

                // Periodic cleanup (aggressive approach)
                setInterval(hideDevElements, 1000);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
