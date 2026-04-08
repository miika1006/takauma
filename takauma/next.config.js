/** @type {import('next').NextConfig} */
const nextConfig = {
	i18n: {
		defaultLocale: "fi",
		locales: ["fi", "en"],
	},
	reactStrictMode: true,
	eslint: {
		dirs: ["pages", "components", "lib", "common"],
	},
	serverExternalPackages: ["uuid"],
};

module.exports = nextConfig;
