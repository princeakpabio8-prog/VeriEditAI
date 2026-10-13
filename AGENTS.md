# Project rules
- Define the ivory and charcoal editorial theme globally through semantic CSS tokens so all routes, navigation and portalled dialogs share one identity; preserve verification/payment logic and intentional NFT artwork effects.
- Keep the homepage verification input connected to the existing pending-verification handoff so redesigns do not replace verification logic.
- Use a focused editorial navigation on the homepage while retaining the existing navigation on tool pages to keep the entry point uncluttered without removing account features.
- Manage route head tags with HelmetProvider, RouteMetadata, and DynamicMeta; keep canonical URLs self-referencing and static social fallbacks in index.html to prevent stale metadata across navigation.
- List only public page routes in the static sitemap, never authenticated tools or feed/sitemap files, to avoid sending crawlers to sign-in screens.
