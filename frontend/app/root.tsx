import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import SplashScreen from "./components/SplashScreen";
import type { Route } from "./+types/root";
import "./app.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10,         // keep in cache for 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous" as const,
  },
  // Preload the font stylesheet so it doesn't block rendering
  {
    rel: "preload",
    as: "style",
    href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "apple-touch-icon", href: "/icon-192.png" },
  { rel: "manifest", href: "/manifest.json" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "StudyCircle" },
    { name: "description", content: "Learn, Connect, Grow" },
    { name: "theme-color", content: "#0a0f1e" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black-translucent",
    },
    { name: "apple-mobile-web-app-title", content: "StudyCircle" },
    { name: "mobile-web-app-capable", content: "yes" },
    { property: "og:title", content: "StudyCircle" },
    {
      property: "og:description",
      content: "Study together. Succeed together.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://studycircle-2026.netlify.app" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthModalProvider>{children}</AuthModalProvider>
          </AuthProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function useSplashCheck(): [boolean, () => void] {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (!isMobile) {
      // Desktop: skip splash entirely
      setShowSplash(false);
      return;
    }

    // Mobile: show only once (first visit)
    const visited = localStorage.getItem("sc_splash_seen");
    if (visited) {
      setShowSplash(false);
    } else {
      localStorage.setItem("sc_splash_seen", "true");
      setShowSplash(true);
    }
  }, []);

  return [showSplash, () => setShowSplash(false)];
}

export default function App() {
  const [showSplash, dismissSplash] = useSplashCheck();
  return (
    <>
      {showSplash && <SplashScreen onDone={dismissSplash} />}
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
