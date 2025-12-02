"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getUserRole, type UserRole } from "@/lib/supabase";

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole>("user");
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  useEffect(() => {
    async function fetchRole() {
      if (isLoaded && user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
        setIsRoleLoaded(true);
      } else if (isLoaded && !user) {
        setRole("user");
        setIsRoleLoaded(true);
      }
    }

    fetchRole();
  }, [isLoaded, user]);

  return {
    role,
    isAdmin: role === "admin",
    isRoleLoaded,
    isLoading: !isLoaded || !isRoleLoaded,
  };
}




