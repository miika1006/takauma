import { GetOrCreateGoogleDriveFolder } from "./../../lib/googledrive";
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import sanitize from "sanitize-filename";
import { getSession } from "next-auth/client";

type Data = {
	name: string;
};

export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getSession({ req });

	if (session) {
		if (req.method === "POST") {
			try {
				const request = req.body as Data;
				console.log("creating new folder '" + request.name + "'");

				const pathSafeEventName = sanitize(request.name);
				if (pathSafeEventName == "") throw new Error("eventName is required");

				const result = await GetOrCreateGoogleDriveFolder(
					session.accessToken as string,
					session.refreshToken as string,
					pathSafeEventName
				);
				return res.status(201).send({
					id: result?.id,
					name: result?.name,
				});
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(403).send("Invalid method");
	}
	res.status(403).send({
		error: "You must sign in.",
	});
}
