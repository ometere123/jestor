"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getProfile } from "@/lib/genlayer/contract";
import { useWallet } from "@/lib/jestora/walletContext";
import type { PlayerProfile } from "@/lib/genlayer/types";

export function useRequireProfile() {
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isConnected || !address) {
      setProfile(null);
      setIsCheckingProfile(false);
      return;
    }

    setIsCheckingProfile(true);

    getProfile(address)
      .then((nextProfile) => {
        if (cancelled) return;
        setProfile(nextProfile);
        if (!nextProfile && pathname !== "/arena") {
          router.replace("/arena");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, pathname, router]);

  return {
    profile,
    setProfile,
    isCheckingProfile,
  };
}
