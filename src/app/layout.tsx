import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import { ServiceWorkerRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Gestion Église - Suivi des Bergers et Âmes",
  description: "Application PWA de suivi spirituel, de gestion des âmes, de présences et de rapports pour bergers, responsables et pasteur.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gestion Église",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Navbar lives here so it stays mounted across client navigations (SPA feel).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("first_name, last_name, role, groups!profiles_group_id_fkey(name)")
          .eq("id", user.id)
          .single()
      ).data as any
    : null;

  return (
    <html
      lang="fr"
      className="font-sans font-['Plus_Jakarta_Sans'] h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9]">
        <ServiceWorkerRegister />
        {profile && (
          <Navbar
            role={profile.role}
            groupName={profile.groups?.name ?? profile.groups?.[0]?.name}
            userName={`${profile.first_name} ${profile.last_name}`}
          />
        )}
        {children}
      </body>
    </html>
  );
}

