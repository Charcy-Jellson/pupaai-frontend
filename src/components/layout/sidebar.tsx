"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import {
  Sparkles,
  ImageIcon,
  Video,
  TrendingUp,
  Users,
  Settings,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Shirt,
  User,
  Wand2,
} from "lucide-react";

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
}

interface NavGroup {
  nameKey: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navigationGroups: NavGroup[] = [
  {
    nameKey: "sidebar.creationSuite",
    items: [
      { 
        nameKey: "sidebar.imageTools", 
        href: "/dashboard/image-tools", 
        icon: ImageIcon,
      },
      { 
        nameKey: "sidebar.productMockup", 
        href: "/dashboard/product-mockup", 
        icon: Shirt,
      },
      { 
        nameKey: "sidebar.modelStudio", 
        href: "/dashboard/model-studio", 
        icon: User,
      },
      { 
        nameKey: "sidebar.logoStudio", 
        href: "/dashboard/logo-studio", 
        icon: Wand2,
      },
      { 
        nameKey: "sidebar.videoTools", 
        href: "/dashboard/video-tools", 
        icon: Video,
      },
    ],
  },
  {
    nameKey: "sidebar.marketing",
    items: [
      { 
        nameKey: "sidebar.seo", 
        href: "/dashboard/seo", 
        icon: TrendingUp,
        badgeKey: "common.soon",
      },
    ],
  },
  {
    nameKey: "sidebar.system",
    adminOnly: true,
    items: [
      { 
        nameKey: "sidebar.userManagement", 
        href: "/dashboard/admin/users", 
        icon: Users,
      },
      { 
        nameKey: "sidebar.settings", 
        href: "/dashboard/admin/settings", 
        icon: Settings,
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobile, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useUserRole();
  const t = useTranslations();

  const filteredGroups = navigationGroups.filter(
    (group) => !group.adminOnly || isAdmin
  );

  // Remove locale prefix from pathname for comparison
  const normalizedPathname = pathname.replace(/^\/(en|zh)/, '');

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border-r border-border/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-2 transition-opacity",
            isCollapsed && "opacity-0 pointer-events-none"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Pupa<span className="text-gradient">AI</span>
          </span>
        </Link>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isMobile ? onMobileClose : onToggle}
          className="h-8 w-8 text-muted-foreground hover:text-white"
        >
          {isMobile ? (
            <ChevronLeft className="w-4 h-4" />
          ) : isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-6">
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.nameKey}>
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(group.nameKey)}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = normalizedPathname === item.href || normalizedPathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={isMobile ? onMobileClose : undefined}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-violet-500/10 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="relative">
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors",
                          isActive && "text-violet-400"
                        )} />
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-full"
                          />
                        )}
                      </div>
                      
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium whitespace-nowrap">
                            {t(item.nameKey)}
                          </span>
                          {item.badgeKey && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {t(item.badgeKey)}
                            </span>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-sm whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg border border-border z-50">
                          {t(item.nameKey)}
                          {item.badgeKey && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t(item.badgeKey)})
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              {groupIndex < filteredGroups.length - 1 && (
                <Separator className="mt-4 bg-border/50" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border/50">
          <div className="px-3 py-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground mb-2">
              {t("common.needHelp")}
            </p>
            <Link href="/docs">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                {t("common.viewDocs")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Sidebar Wrapper
export function MobileSidebar({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <motion.div
            key="mobile-sidebar-content"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
          >
            <Sidebar 
              isCollapsed={false} 
              onToggle={() => {}} 
              isMobile 
              onMobileClose={onClose}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
