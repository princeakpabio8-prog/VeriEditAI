import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { canonicalUrl, isPublicContentPath, publicPageMetadata, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";

export function RouteMetadata() {
  const { pathname } = useLocation();
  const path = pathname === "/index" ? "/" : pathname.replace(/\/$/, "") || "/";
  const page = publicPageMetadata[path];
  const indexable = Boolean(page) || isPublicContentPath(path);
  const title = page?.title ?? SITE_TITLE;
  const description = page?.description ?? SITE_DESCRIPTION;
  const url = canonicalUrl(path);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={indexable ? "index, follow" : "noindex, follow"} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}