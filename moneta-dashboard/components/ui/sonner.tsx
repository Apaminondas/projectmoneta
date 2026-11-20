"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  useEffect(() => {
    // Sanitize Sonner injected styles to remove layout property animation (transition: height)
    const sanitize = () => {
      document.querySelectorAll("style").forEach((style) => {
        if (style.textContent && (style.textContent.includes("height .4s") || style.textContent.includes("height 0.4s"))) {
          style.textContent = style.textContent
            .replace("height .4s,", "")
            .replace("height 0.4s,", "");
        }
      });
      for (const sheet of document.styleSheets) {
        try {
          for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i] as CSSStyleRule;
            if (rule?.cssText?.includes("height 0.4s") || rule?.cssText?.includes("height .4s")) {
              rule.style.setProperty("transition", "transform 0.4s, opacity 0.4s, box-shadow 0.2s");
            }
          }
        } catch {}
      }
    };
    sanitize();
    const observer = new MutationObserver(sanitize);
    if (typeof document !== "undefined" && document.head) {
      observer.observe(document.head, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
