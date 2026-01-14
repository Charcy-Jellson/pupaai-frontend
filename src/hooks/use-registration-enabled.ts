"use client";

import { useEffect, useState } from "react";

interface RegistrationSettings {
  registrationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRegistrationEnabled(): RegistrationSettings {
  const [registrationEnabled, setRegistrationEnabled] = useState(true); // Default to enabled
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/settings/system");
      
      if (!response.ok) {
        throw new Error("Failed to fetch registration settings");
      }
      
      const data = await response.json();
      setRegistrationEnabled(data.registration_enabled);
    } catch (err) {
      console.error("Error fetching registration settings:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Default to enabled on error
      setRegistrationEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    registrationEnabled,
    isLoading,
    error,
    refresh: fetchSettings,
  };
}



