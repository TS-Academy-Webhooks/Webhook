export const DEFAULT_SITE_URL = "https://waybridge-six.vercel.app";
export const SOCIAL_IMAGE_PATH = "/social-card.svg";

const homeDescription =
  "Manage shipment progress, logistics webhooks, event delivery, and retry history in one workspace.";

const staticPages = {
  "/": {
    title: "Waybridge | Shipment & Webhook Operations",
    description: homeDescription,
    indexable: true,
  },
  "/about": {
    title: "About Waybridge | Connected Logistics",
    description:
      "Learn how Waybridge connects shipment timelines, webhook delivery, and the teams who rely on each update.",
    indexable: true,
  },
  "/docs": {
    title: "API Docs | Waybridge",
    description:
      "Explore the Waybridge API for shipment tracking, webhook subscriptions, delivery history, and signature verification.",
    indexable: true,
  },
  "/track": {
    title: "Track a Shipment | Waybridge",
    description:
      "Look up a Waybridge tracking number to see a shipment’s current status and public timeline.",
    indexable: true,
  },
  "/tracking": {
    title: "Shipment Tracking | Waybridge",
    description: "Track a Waybridge shipment by its tracking number.",
    indexable: false,
  },
  "/login": {
    title: "Sign In | Waybridge",
    description: "Sign in to manage shipments and logistics webhook deliveries.",
    indexable: false,
  },
  "/signup": {
    title: "Create an Account | Waybridge",
    description: "Create a Waybridge account to manage shipments and webhook endpoints.",
    indexable: false,
  },
  "/forgot-password": {
    title: "Password Recovery Unavailable | Waybridge",
    description:
      "Email-backed password recovery is not available because no recovery provider is configured.",
    indexable: false,
  },
  "/dashboard": {
    title: "Dashboard | Waybridge",
    description: "View your Waybridge shipment and webhook activity.",
    indexable: false,
  },
  "/shipments": {
    title: "Shipments | Waybridge",
    description: "Review the shipments available to your Waybridge account.",
    indexable: false,
  },
  "/shipments/new": {
    title: "Create a Shipment | Waybridge",
    description: "Create a shipment and issue a tracking number.",
    indexable: false,
  },
  "/webhooks": {
    title: "Webhooks | Waybridge",
    description: "Manage webhook endpoints and shipment event subscriptions.",
    indexable: false,
  },
  "/events": {
    title: "Shipment Events | Waybridge",
    description: "Review shipment events and webhook delivery context.",
    indexable: false,
  },
  "/deliveries": {
    title: "Deliveries | Waybridge",
    description: "Review webhook delivery summaries and attempt history.",
    indexable: false,
  },
  "/settings": {
    title: "Settings | Waybridge",
    description: "Manage your Waybridge account, password, and appearance.",
    indexable: false,
  },
  "/settings/api-keys": {
    title: "API Key Management Unavailable | Waybridge",
    description: "API key management is not supported by the Waybridge API.",
    indexable: false,
  },
  "/tools/demo-receiver": {
    title: "Demo Receiver | Waybridge",
    description: "Inspect webhook requests and configure the Waybridge demo receiver.",
    indexable: false,
  },
};

function normalizePath(pathname) {
  const trimmedPath = pathname.replace(/\/+$/, "");
  return trimmedPath || "/";
}

export function normalizeSiteUrl(siteUrl) {
  const url = new URL(siteUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("VITE_SITE_URL must use HTTP or HTTPS.");
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("VITE_SITE_URL must be a site origin without a path.");
  }

  return url.origin;
}

function privatePage(title, description) {
  return { title, description, indexable: false };
}

function getRoutePage(pathname) {
  const path = normalizePath(pathname);
  const exactPage = staticPages[path];
  if (exactPage) return exactPage;

  if (/^\/track\/[^/]+$/.test(path) || /^\/tracking\/[^/]+$/.test(path)) {
    return privatePage(
      "Shipment Tracking | Waybridge",
      "View the current status and public timeline for a shipment.",
    );
  }
  if (/^\/shipments\/[^/]+$/.test(path)) {
    return privatePage("Shipment Details | Waybridge", "Review shipment status and history.");
  }
  if (/^\/webhooks\/[^/]+\/history$/.test(path)) {
    return privatePage("Webhook Delivery History | Waybridge", "Review delivery summaries for a webhook.");
  }
  if (/^\/webhooks\/[^/]+(?:\/edit)?$/.test(path) || /^\/settings\/webhooks(?:\/.*)?$/.test(path)) {
    return privatePage("Webhook Endpoint | Waybridge", "Manage a Waybridge webhook endpoint.");
  }
  if (/^\/events\/[^/]+$/.test(path)) {
    return privatePage("Event Details | Waybridge", "Review shipment event payload and deliveries.");
  }
  if (/^\/deliveries\/[^/]+$/.test(path)) {
    return privatePage("Delivery Details | Waybridge", "Review a delivery summary and attempt history.");
  }
  if (/^\/settings\/api-keys(?:\/.*)?$/.test(path)) {
    return staticPages["/settings/api-keys"];
  }

  return privatePage("Page Not Found | Waybridge", "The requested Waybridge page could not be found.");
}

function getStructuredData(path, canonicalUrl, page) {
  if (path === "/") {
    const origin = canonicalUrl ? new URL(canonicalUrl).origin : undefined;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": origin ? `${origin}/#organization` : undefined,
          name: "Waybridge",
          ...(origin ? { url: origin } : {}),
        },
        {
          "@type": "WebSite",
          "@id": origin ? `${origin}/#website` : undefined,
          name: "Waybridge",
          ...(origin ? { url: origin } : {}),
          publisher: origin ? { "@id": `${origin}/#organization` } : { "@type": "Organization", name: "Waybridge" },
        },
        {
          "@type": "SoftwareApplication",
          name: "Waybridge",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: homeDescription,
          ...(origin ? { url: origin } : {}),
          publisher: { "@type": "Organization", name: "Waybridge" },
        },
      ],
    };
  }

  if (path === "/about" || path === "/docs" || path === "/track") {
    return {
      "@context": "https://schema.org",
      "@type": path === "/about" ? "AboutPage" : path === "/docs" ? "TechArticle" : "WebPage",
      name: page.title,
      description: page.description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(canonicalUrl
        ? { isPartOf: { "@id": `${new URL(canonicalUrl).origin}/#website` } }
        : {}),
    };
  }

  return undefined;
}

export function getPageMetadata(pathname, siteUrl = DEFAULT_SITE_URL) {
  const path = normalizePath(pathname);
  const page = getRoutePage(path);
  const origin = siteUrl ? normalizeSiteUrl(siteUrl) : undefined;
  const canonicalUrl =
    page.indexable && origin ? new URL(path, origin).href : undefined;
  const socialImageUrl = origin ? new URL(SOCIAL_IMAGE_PATH, origin).href : undefined;

  return {
    ...page,
    canonicalUrl,
    socialImageUrl,
    robots: page.indexable ? "index, follow" : "noindex, nofollow",
    structuredData: getStructuredData(path, canonicalUrl, page),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderSeoHeadTags(metadata) {
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="${metadata.robots}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Waybridge" />',
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
  ];

  if (metadata.canonicalUrl) {
    const canonical = escapeHtml(metadata.canonicalUrl);
    tags.push(`<link rel="canonical" href="${canonical}" />`);
    tags.push(`<meta property="og:url" content="${canonical}" />`);
  }

  if (metadata.socialImageUrl) {
    const image = escapeHtml(metadata.socialImageUrl);
    tags.push(`<meta property="og:image" content="${image}" />`);
    tags.push(`<meta name="twitter:image" content="${image}" />`);
  }

  if (metadata.structuredData) {
    const jsonLd = JSON.stringify(metadata.structuredData).replace(
      /</g,
      "\\u003c",
    );
    tags.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }

  return tags.join("\n    ");
}
