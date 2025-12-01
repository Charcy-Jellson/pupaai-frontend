"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ImageIcon,
  Palette,
  Video,
  TrendingUp,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navigationGroups: NavGroup[] = [
  {
    name: "Creation Suite",
    items: [
      { 
        name: "Image Tools", 
        href: "/dashboard/image-tools", 
        icon: ImageIcon,
      },
      { 
        name: "Model Studio", 
        href: "/dashboard/model-studio", 
        icon: Palette,
        badge: "Soon",
      },
      { 
        name: "Video Tools", 
        href: "/dashboard/video-tools", 
        icon: Video,
        badge: "Soon",
      },
    ],
  },
  {
    name: "Marketing",
    items: [
      { 
        name: "SEO", 
        href: "/dashboard/seo", 
        icon: TrendingUp,
        badge: "Soon",
      },
    ],
  },
  {
    name: "System",
    adminOnly: true,
    items: [
      { 
        name: "User Management", 
        href: "/dashboard/admin/users", 
        icon: Users,
      },
      { 
        name: "Settings", 
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
  const { isAdmin, isLoading } = useUserRole();

  const filteredGroups = navigationGroups.filter(
    (group) => !group.adminOnly || isAdmin
  );

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
            <div key={group.name}>
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.name}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
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
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-sm whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg border border-border z-50">
                          {item.name}
                          {item.badge && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({item.badge})
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
              Need help getting started?
            </p>
            <Link href="/docs">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                View Documentation
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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.div
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


