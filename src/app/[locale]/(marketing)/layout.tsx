import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { setRequestLocale } from "next-intl/server";

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MarketingLayout({
  children,
  params,
}: MarketingLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

