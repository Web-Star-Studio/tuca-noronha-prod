/**
 * Development utility to test the Guide Subscription Popup
 * 
 * Usage in browser console:
 * 
 * 1. Force show popup:
 *    window.testGuidePopup.show()
 * 
 * 2. Reset all popup state:
 *    window.testGuidePopup.reset()
 * 
 * 3. Check popup state:
 *    window.testGuidePopup.getState()
 */

export const guidePopupTestUtils = {
  /**
   * Force show the popup by clearing all storage
   */
  show: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("guide_popup_shown");
    localStorage.removeItem("guide_popup_dismissed_at");
    console.log("✅ Popup state cleared. Refresh the page to see the popup.");
  },

  /**
   * Reset popup completely
   */
  reset: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("guide_popup_shown");
    localStorage.removeItem("guide_popup_dismissed_at");
    console.log("✅ Popup completely reset. Refresh to test again.");
  },

  /**
   * Check current popup state
   */
  getState: () => {
    if (typeof window === "undefined") return null;
    
    const shownInSession = sessionStorage.getItem("guide_popup_shown");
    const dismissedAt = localStorage.getItem("guide_popup_dismissed_at");
    
    const state = {
      shownInSession: !!shownInSession,
      dismissedAt: dismissedAt ? new Date(parseInt(dismissedAt)) : null,
      willShowOnNextRefresh: !shownInSession && (!dismissedAt || 
        Date.now() - parseInt(dismissedAt) > 7 * 24 * 60 * 60 * 1000)
    };
    
    console.table(state);
    return state;
  },

  /**
   * Simulate dismissal
   */
  dismiss: () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("guide_popup_dismissed_at", Date.now().toString());
    console.log("✅ Popup marked as dismissed. Won't show for 7 days.");
  }
};

// Make available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).testGuidePopup = guidePopupTestUtils;
  console.log("🧪 Guide Popup test utils loaded. Try: window.testGuidePopup.getState()");
}
