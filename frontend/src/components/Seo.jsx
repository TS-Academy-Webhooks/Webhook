import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_SITE_URL, getPageMetadata } from "../seo/metadata";

function updateMeta(attribute, key, value) {
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector(selector);

  if (!value) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }

  tag.setAttribute("content", value);
}

function updateCanonical(canonicalUrl) {
  let tag = document.head.querySelector('link[rel="canonical"]');

  if (!canonicalUrl) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.append(tag);
  }

  tag.setAttribute("href", canonicalUrl);
}

function updateStructuredData(structuredData) {
  const existingTag = document.head.querySelector("#waybridge-structured-data");

  if (!structuredData) {
    existingTag?.remove();
    return;
  }

  const tag = existingTag || document.createElement("script");
  tag.id = "waybridge-structured-data";
  tag.type = "application/ld+json";
  tag.textContent = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  if (!existingTag) {
    document.head.append(tag);
  }
}

function updateThemeColor() {
  let tag = document.head.querySelector('meta[name="theme-color"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "theme-color";
    document.head.append(tag);
  }
  tag.content = document.documentElement.classList.contains("dark") ? "#141820" : "#f8faff";
}

function applySavedTheme() {
  try {
    document.documentElement.classList.toggle(
      "dark",
      window.localStorage.getItem("webhook-theme") === "dark",
    );
  } catch {
    // Keep the default light theme when browser storage is unavailable.
  }
}

function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    applySavedTheme();
    const siteUrl =
      import.meta.env.VITE_SITE_URL ||
      (import.meta.env.DEV ? window.location.origin : DEFAULT_SITE_URL);
    const metadata = getPageMetadata(pathname, siteUrl);
    updateThemeColor();

    document.title = metadata.title;
    updateMeta("name", "description", metadata.description);
    updateMeta("name", "robots", metadata.robots);
    updateMeta("property", "og:type", "website");
    updateMeta("property", "og:site_name", "Waybridge");
    updateMeta("property", "og:title", metadata.title);
    updateMeta("property", "og:description", metadata.description);
    updateMeta("property", "og:url", metadata.canonicalUrl);
    updateMeta("property", "og:image", metadata.socialImageUrl);
    updateMeta("name", "twitter:card", "summary_large_image");
    updateMeta("name", "twitter:title", metadata.title);
    updateMeta("name", "twitter:description", metadata.description);
    updateMeta("name", "twitter:image", metadata.socialImageUrl);
    updateCanonical(metadata.canonicalUrl);
    updateStructuredData(metadata.structuredData);
  }, [pathname]);

  return null;
}

export default Seo;
