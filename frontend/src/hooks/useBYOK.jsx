import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

const BYOKContext = createContext();

export function BYOKProvider({ children }) {
  const { user } = useAuth();
  const [hasKey, setHasKey] = useState(false);
  const [provider, setProvider] = useState("google");
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const checkKeys = async () => {
    if (!user) {
      setHasKey(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/settings/apikeys");
      if (data.providers && data.providers[data.default_provider]?.has_key) {
        setHasKey(true);
        setProvider(data.default_provider);
      } else {
        setHasKey(false);
      }
    } catch (err) {
      console.error("Failed to check API keys", err);
      setHasKey(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKeys();
  }, [user]);

  const requireKey = (callback) => {
    if (hasKey) {
      if (callback) callback();
    } else {
      setWizardOpen(true);
    }
  };

  return (
    <BYOKContext.Provider
      value={{
        hasKey,
        provider,
        loading,
        wizardOpen,
        setWizardOpen,
        checkKeys,
        requireKey,
      }}
    >
      {children}
    </BYOKContext.Provider>
  );
}

export function useBYOK() {
  return useContext(BYOKContext);
}
