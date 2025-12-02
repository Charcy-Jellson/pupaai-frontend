"use client";

import { useUserRole } from "@/hooks/use-user-role";
import type { UserRole } from "@/types";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return fallback || null;
  }

  return <>{children}</>;
}




