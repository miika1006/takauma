export const FromEmailAndFolderTooBase64 = (
	email: string,
	folderid: string
): string => {
	return Buffer.from(email + "/" + folderid).toString("base64");
};
export const FromBase64ToEmailAndFolder = (
	eventbase64: string
): { email: string; folderid: string } => {
	const eventData = Buffer.from(eventbase64, "base64").toString("utf8");
	const [email, folderid] = eventData.split("/");
	return { email, folderid };
};
