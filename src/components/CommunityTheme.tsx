import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Route-scoped theme includes navigation and portalled community dialogs. */
export function CommunityTheme() {
  const { pathname } = useLocation();
  const isCommunity = /^\/(lighthouse|activity-feed|signal-feed|user|find-users|thread\/share)(\/|$)/.test(pathname);

  useLayoutEffect(() => {
    document.body.classList.toggle("editorial-community", isCommunity);
    return () => document.body.classList.remove("editorial-community");
  }, [isCommunity]);

  return null;
}