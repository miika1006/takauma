const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,200}$/;
// Minimal email sanity check — just requires a single "@" with content on both sides.
const EMAIL_RE = /^[^@\s]+@[^@\s]+$/;

export const FromEmailAndFolderTooBase64 = (
	email: string,
	folderid: string
): string => {
	return Buffer.from(email + "/" + folderid).toString("base64");
};

export const FromBase64ToEmailAndFolder = (
	eventbase64: string
): { email: string; folderid: string } => {
	try {
		if (!eventbase64 || typeof eventbase64 !== "string") {
			return { email: "", folderid: "" };
		}
		const eventData = Buffer.from(eventbase64, "base64").toString("utf8");
		// Split only on the first "/" so folder IDs that somehow contain one are
		// not silently truncated.
		const slashIdx = eventData.indexOf("/");
		if (slashIdx < 1) return { email: "", folderid: "" };

		const email = eventData.slice(0, slashIdx);
		const folderid = eventData.slice(slashIdx + 1);

		if (!EMAIL_RE.test(email) || !DRIVE_ID_RE.test(folderid)) {
			return { email: "", folderid: "" };
		}

		return { email, folderid };
	} catch {
		return { email: "", folderid: "" };
	}
};
