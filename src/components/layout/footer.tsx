"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Sparkles, Github, Twitter, Linkedin, Mail } from "lucide-react";

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
];

export function Footer() {
  const t = useTranslations();

  const footerLinks = {
    product: [
      { name: t("nav.features"), href: "/#features" },
      { name: t("nav.pricing"), href: "/pricing" },
      { name: t("nav.changelog"), href: "/changelog" },
      { name: t("nav.roadmap"), href: "/roadmap" },
    ],
    company: [
      { name: t("nav.about"), href: "/about" },
      { name: t("nav.blog"), href: "/blog" },
      { name: t("nav.careers"), href: "/careers" },
      { name: t("nav.contact"), href: "/contact" },
    ],
    resources: [
      { name: t("nav.documentation"), href: "/docs" },
      { name: t("nav.apiReference"), href: "/api" },
      { name: t("nav.support"), href: "/support" },
      { name: t("nav.status"), href: "/status" },
    ],
    legal: [
      { name: t("nav.privacyPolicy"), href: "/privacy" },
      { name: t("nav.termsOfService"), href: "/terms" },
      { name: t("nav.cookiePolicy"), href: "/cookies" },
    ],
  };

  return (
    <footer className="relative border-t border-border/50 bg-background/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Pupa<span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              {t("home.footerDescription")}
            </p>
            <a 
              href="mailto:admin@charcyjellson.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
            >
              <Mail className="w-4 h-4" />
              admin@charcyjellson.com
            </a>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
                >
                  <social.icon className="w-5 h-5" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("nav.product")}</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("nav.company")}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("nav.resources")}</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
