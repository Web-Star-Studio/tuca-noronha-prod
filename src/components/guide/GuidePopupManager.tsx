"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GuideSubscriptionPopup } from "./GuideSubscriptionPopup";
import { GuidePopupMobile } from "./GuidePopupMobile";

// Load test utilities in development
if (process.env.NODE_ENV === "development") {
  import("./testPopup");
}

const POPUP_SHOWN_KEY = "guide_popup_shown";
const POPUP_DISMISSED_KEY = "guide_popup_dismissed_at";
const POPUP_VERSION_KEY = "guide_popup_version";
const POPUP_VERSION = "guide-ui-v2";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function GuidePopupManager() {
  const { isLoaded } = useUser();
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const hasGuideAccess = useQuery(
    api.domains.subscriptions.queries.hasGuideAccess,
    isLoaded ? {} : "skip"
  );

  // Detect mobile viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset storage when popup version changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedVersion = localStorage.getItem(POPUP_VERSION_KEY);
    if (storedVersion !== POPUP_VERSION) {
      sessionStorage.removeItem(POPUP_SHOWN_KEY);
      localStorage.removeItem(POPUP_DISMISSED_KEY);
      localStorage.setItem(POPUP_VERSION_KEY, POPUP_VERSION);
    }
  }, []);

  // Popup display logic
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    // Don't show if not loaded yet
    if (!isLoaded) return;
    if (hasGuideAccess === undefined) return;

    // Don't show if user already has access (active subscription or master role)
    if (hasGuideAccess) {
      return;
    }

    // Check if popup was dismissed recently
    const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissedAt) {
      const timeSinceDismissed = Date.now() - parseInt(dismissedAt);
      if (timeSinceDismissed < DISMISS_DURATION) {
        return; // Don't show if dismissed in last 7 days
      }
    }

    // Check if popup was already shown in this session
    const wasShownInSession = sessionStorage.getItem(POPUP_SHOWN_KEY);
    if (wasShownInSession) {
      return;
    }

    // Show popup after a short delay for better UX
    const timer = setTimeout(() => {
      setShowPopup(true);
      sessionStorage.setItem(POPUP_SHOWN_KEY, "true");
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, [isLoaded, hasGuideAccess]);

  // Close popup automatically when access is granted (e.g., after assinatura)
  useEffect(() => {
    if (hasGuideAccess) {
      setShowPopup(false);
    }
  }, [hasGuideAccess]);

  const handleClose = () => {
    setShowPopup(false);
    // Store dismissal timestamp
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  };

  // Render mobile or desktop version based on viewport
  return isMobile ? (
    <GuidePopupMobile 
      isOpen={showPopup} 
      onClose={handleClose}
    />
  ) : (
    <GuideSubscriptionPopup 
      isOpen={showPopup} 
      onClose={handleClose}
    />
  );
}
