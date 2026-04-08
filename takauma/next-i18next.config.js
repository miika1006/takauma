const path = require("path");

module.exports = {
	i18n: {
		defaultLocale: "fi",
		locales: ["fi", "en"],
		localePath: path.resolve("./public/locales"),
	},
};
