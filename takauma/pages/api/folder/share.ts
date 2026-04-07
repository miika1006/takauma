import {
	ShareGoogleDriveFolderToAnyone,
	UnShareGoogleDriveFolderFromAnyone,
} from "./../../../lib/googledrive";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,200}$/;

type ShareData = {
	folderId: string;
	share: boolean;
};
export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (session) {
		//Update share state for a folder
		if (req.method === "PUT") {
			try {
				const request = req.body as ShareData;

				if (!request.folderId || !DRIVE_ID_RE.test(request.folderId))
					return res.status(400).send("Invalid folderId");

				if (request.share) {
					//Share folder to the world so photos will be available without login
					console.log("sharing folder '" + request.folderId + "'");
					const result = await ShareGoogleDriveFolderToAnyone(
						session.accessToken,
						session.refreshToken,
						request.folderId
					);
					return res.status(200).send({
						id: result?.id,
						name: result?.name,
						shared: result?.shared,
					});
				} else {
					//Stop sharing folder from anyone
					console.log("removing share from folder '" + request.folderId + "'");
					const result = await UnShareGoogleDriveFolderFromAnyone(
						session.accessToken,
						session.refreshToken,
						request.folderId
					);
					return res.status(200).send({
						id: result?.id,
						name: result?.name,
						shared: result?.shared,
					});
				}
			} catch (error) {
				console.error("folder share PUT error", error);
				return res.status(400).send("Bad request");
			}
		} else return res.status(405).send("Method not allowed");
	}
	return res.status(403).send({ error: "You must sign in." });
}
