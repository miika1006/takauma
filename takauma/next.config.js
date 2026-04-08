/** @type {import('next').NextConfig} */
const nextConfig = {
	i18n: {
		defaultLocale: "fi",
		locales: ["fi", "en"],
	},
	reactStrictMode: true,
	serverExternalPackages: ["uuid"],
	turbopack: {
		root: __dirname,
	},
};

module.exports = nextConfig;
