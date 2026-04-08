import { GetServerSideProps } from "next";

const BASE_URL = "https://takauma.vercel.app";

// Public pages with their priorities and change frequencies
const pages = [
	{ path: "/", priority: "1.0", changefreq: "weekly" },
	{ path: "/privacy", priority: "0.3", changefreq: "monthly" },
	{ path: "/terms", priority: "0.3", changefreq: "monthly" },
];

const locales = ["fi", "en"]; // fi is default (no prefix), en has /en prefix

function buildUrl(path: string, locale: string): string {
	if (locale === "fi") return `${BASE_URL}${path}`;
	return `${BASE_URL}/${locale}${path}`;
}

function generateSitemap(): string {
	const urls = pages.flatMap(({ path, priority, changefreq }) =>
		locales.map((locale) => {
			const loc = buildUrl(path, locale);
			const fiAlternate = buildUrl(path, "fi");
			const enAlternate = buildUrl(path, "en");
			return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="fi" href="${fiAlternate}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enAlternate}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${fiAlternate}"/>
  </url>`;
		})
	);

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urls.join("\n")}
</urlset>`;
}

// This page has no component — it only returns XML
export default function Sitemap() {
	return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
	res.setHeader("Content-Type", "application/xml");
	res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
	res.write(generateSitemap());
	res.end();
	return { props: {} };
};
