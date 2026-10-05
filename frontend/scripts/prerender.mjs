import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadEnv } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const env = loadEnv("production", root, "VITE_");
const configuredSiteUrl = process.env.VITE_SITE_URL || env.VITE_SITE_URL;
const publicRoutes = ["/", "/about", "/docs", "/track"];
const vite = await createServer({
  root,
  configFile: resolve(root, "vite.config.js"),
  mode: "production",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const [{ render }, metadataModule] = await Promise.all([
    vite.ssrLoadModule("/src/entry-server.jsx"),
    vite.ssrLoadModule("/src/seo/metadata.js"),
  ]);
  const siteUrl = metadataModule.normalizeSiteUrl(
    configuredSiteUrl || metadataModule.DEFAULT_SITE_URL,
  );
  const template = await readFile(resolve(dist, "index.html"), "utf8");
  const seoSlotPattern = /<meta name="waybridge-seo-slot"\s*\/?>/;
  const robotsPattern = /<meta name="robots" content="[^"]*"\s*\/?>/;
  const rootPattern = /<div id="root"><\/div>/;

  if (!/<title>[\s\S]*?<\/title>/.test(template)) {
    throw new Error("The built HTML is missing its title element.");
  }
  if (!seoSlotPattern.test(template)) {
    throw new Error("The built HTML is missing its SEO metadata slot.");
  }
  if (!robotsPattern.test(template)) {
    throw new Error("The built HTML is missing its default robots directive.");
  }
  if (!rootPattern.test(template)) {
    throw new Error("The built HTML is missing its empty application root.");
  }

  for (const route of publicRoutes) {
    const metadata = metadataModule.getPageMetadata(route, siteUrl);
    const tags = metadataModule.renderSeoHeadTags(metadata);
    const titleTag = tags.match(/<title>[\s\S]*?<\/title>/)?.[0];
    const robotsTag = tags.match(robotsPattern)?.[0];
    if (!titleTag) throw new Error(`No title metadata was generated for ${route}.`);
    if (!robotsTag) throw new Error(`No robots metadata was generated for ${route}.`);
    const remainingTags = tags.replace(titleTag, "").replace(robotsTag, "").trim();
    const prerenderedHtml = template
      .replace(/<title>[\s\S]*?<\/title>/, titleTag)
      .replace(robotsPattern, robotsTag)
      .replace(seoSlotPattern, remainingTags)
      .replace(
        rootPattern,
        `<div id="root" data-prerendered-path="${route}">${render(route)}</div>`,
      );
    const outputPath =
      route === "/"
        ? resolve(dist, "index.html")
        : resolve(dist, route.slice(1), "index.html");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, prerenderedHtml);
  }

  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /login",
    "Disallow: /signup",
    "Disallow: /forgot-password",
    "Disallow: /dashboard",
    "Disallow: /shipments",
    "Disallow: /webhooks",
    "Disallow: /events",
    "Disallow: /deliveries",
    "Disallow: /settings",
    "Disallow: /tools",
    "Disallow: /track/",
    "Disallow: /tracking",
    `Sitemap: ${new URL("/sitemap.xml", siteUrl).href}`,
    "",
  ].join("\n");
  await writeFile(resolve(dist, "robots.txt"), robots);

  const sitemapEntries = publicRoutes.map((route) => {
    const metadata = metadataModule.getPageMetadata(route, siteUrl);
    return `  <url><loc>${metadata.canonicalUrl}</loc></url>`;
  });
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries,
    "</urlset>",
    "",
  ].join("\n");
  await writeFile(resolve(dist, "sitemap.xml"), sitemap);
} finally {
  await vite.close();
}
