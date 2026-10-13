# Project rules
- Scope editorial semantic tokens to homepage and community routes; CommunityTheme applies the community body class so navigation and portalled dialogs match while unrelated verification, wallet and badge pages retain their presentation.
- Keep the homepage verification input connected to the existing pending-verification handoff so redesigns do not replace verification logic.
- Use a focused editorial navigation on the homepage while retaining the existing navigation on tool pages to keep the entry point uncluttered without removing account features.
- Manage route head tags with HelmetProvider, RouteMetadata, and DynamicMeta; keep canonical URLs self-referencing and static social fallbacks in index.html to prevent stale metadata across navigation.
- List only public page routes in the static sitemap, never authenticated tools or feed/sitemap files, to avoid sending crawlers to sign-in screens.