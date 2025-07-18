"use client";

import { useEffect } from "react";

export function ClerkCaptchaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Garantir que o elemento CAPTCHA existe no DOM
    if (!document.getElementById("clerk-captcha")) {
      const captchaDiv = document.createElement("div");
      captchaDiv.id = "clerk-captcha";
      captchaDiv.style.position = "fixed";
      captchaDiv.style.top = "-9999px";
      captchaDiv.style.left = "-9999px";
      document.body.appendChild(captchaDiv);
    }

    // Cleanup
    return () => {
      const captchaDiv = document.getElementById("clerk-captcha");
      if (captchaDiv && captchaDiv.parentNode === document.body) {
        document.body.removeChild(captchaDiv);
      }
    };
  }, []);

  return <>{children}</>;
} 