import { useEffect } from "react";
import { motion } from "framer-motion";

// Configuration for different platforms
export type ChatPlatform = "intercom" | "crisp" | "zendesk" | "tawk";

interface LiveChatWidgetProps {
  platform?: ChatPlatform;
  // Platform-specific IDs (add your own)
  intercomAppId?: string;
  crispWebsiteId?: string;
  zendeskKey?: string;
  tawkPropertyId?: string;
  tawkWidgetId?: string;
}

export const LiveChatWidget = ({
  platform = "crisp",
  intercomAppId,
  crispWebsiteId,
  zendeskKey,
  tawkPropertyId,
  tawkWidgetId,
}: LiveChatWidgetProps) => {
  // Don't render if no platform ID is configured
  const hasValidConfig = 
    (platform === "crisp" && crispWebsiteId) ||
    (platform === "intercom" && intercomAppId) ||
    (platform === "zendesk" && zendeskKey) ||
    (platform === "tawk" && tawkPropertyId && tawkWidgetId);

  if (!hasValidConfig) {
    return null;
  }
  
  useEffect(() => {
    // Intercom Integration
    if (platform === "intercom" && intercomAppId) {
      const initIntercom = () => {
        (window as any).intercomSettings = {
          api_base: "https://api-iam.intercom.io",
          app_id: intercomAppId,
        };

        const w = window as any;
        const ic = w.Intercom;
        if (typeof ic === "function") {
          ic("reattach_activator");
          ic("update", w.intercomSettings);
        } else {
          const d = document;
          const i: any = function () {
            i.c(arguments);
          };
          i.q = [];
          i.c = function (args: any) {
            i.q.push(args);
          };
          w.Intercom = i;
          
          const l = function () {
            const s = d.createElement("script");
            s.type = "text/javascript";
            s.async = true;
            s.src = `https://widget.intercom.io/widget/${intercomAppId}`;
            const x = d.getElementsByTagName("script")[0];
            x.parentNode?.insertBefore(s, x);
          };
          
          if (document.readyState === "complete") {
            l();
          } else if (w.attachEvent) {
            w.attachEvent("onload", l);
          } else {
            w.addEventListener("load", l, false);
          }
        }
      };

      initIntercom();
      (window as any).Intercom("boot", { app_id: intercomAppId });

      return () => {
        if ((window as any).Intercom) {
          (window as any).Intercom("shutdown");
        }
      };
    }

    // Crisp Integration
    if (platform === "crisp" && crispWebsiteId) {
      (window as any).$crisp = [];
      (window as any).CRISP_WEBSITE_ID = crispWebsiteId;

      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);

      return () => {
        const script = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
        if (script) {
          script.remove();
        }
        delete (window as any).$crisp;
        delete (window as any).CRISP_WEBSITE_ID;
      };
    }

    // Zendesk Integration
    if (platform === "zendesk" && zendeskKey) {
      const script = document.createElement("script");
      script.id = "ze-snippet";
      script.src = `https://static.zdassets.com/ekr/snippet.js?key=${zendeskKey}`;
      script.async = true;
      document.getElementsByTagName("head")[0].appendChild(script);

      return () => {
        const script = document.getElementById("ze-snippet");
        if (script) {
          script.remove();
        }
        if ((window as any).zE) {
          delete (window as any).zE;
        }
      };
    }

    // Tawk.to Integration
    if (platform === "tawk" && tawkPropertyId && tawkWidgetId) {
      const Tawk_API: any = (window as any).Tawk_API || {};
      const Tawk_LoadStart = new Date();
      
      (window as any).Tawk_API = Tawk_API;
      (window as any).Tawk_LoadStart = Tawk_LoadStart;

      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`;
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      s0.parentNode?.insertBefore(s1, s0);

      return () => {
        const script = document.querySelector(`script[src*="embed.tawk.to"]`);
        if (script) {
          script.remove();
        }
        delete (window as any).Tawk_API;
        delete (window as any).Tawk_LoadStart;
      };
    }
  }, [platform, intercomAppId, crispWebsiteId, zendeskKey, tawkPropertyId, tawkWidgetId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="live-chat-widget"
    />
  );
};
