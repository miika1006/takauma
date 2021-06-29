export const IsUserBanned = (email: string | null | undefined) => {
	if (email) {
		//if (email === "miikameht@gmail.com") return true;
		//TODO: check ban list??
		return false;
	}
	return true;
};
