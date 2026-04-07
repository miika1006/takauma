import { GetGoogleDriveFolders } from "./../../../lib/googledrive";
import {
	GetOrCreateGoogleDriveFolderByFolderName,
	DeleteGoogleDriveFolder,
} from "../../../lib/googledrive";
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import sanitize from "sanitize-filename";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,200}$/;
const MAX_FOLDER_NAME_LENGTH = 100;

type CreateData = {
	name: string;
};
type DeleteData = {
	folderId: string;
};
export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (session) {
		//Get list of folders
		if (req.method === "GET") {
			try {
				console.log("api loading folders");

				const result = await GetGoogleDriveFolders(
					session.accessToken,
					session.refreshToken
				);

				return res.status(200).send(
					result?.map((item) => {
						return {
							id: item.id,
							name: item.name,
							shared: item.shared,
						};
					}) ?? []
				);
			} catch (error) {
				console.error("folder GET error", error);
				return res.status(400).send("Bad request");
			}
		}
		//Create new folder
		else if (req.method === "POST") {
			try {
				const request = req.body as CreateData;

				const pathSafeEventName = sanitize(request.name ?? "")
					.trim()
					.slice(0, MAX_FOLDER_NAME_LENGTH);
				if (pathSafeEventName === "")
					return res.status(400).send("eventName is required");

				console.log("creating new folder '" + pathSafeEventName + "'");

				const result = await GetOrCreateGoogleDriveFolderByFolderName(
					session.accessToken,
					session.refreshToken,
					pathSafeEventName
				);

				return res.status(201).send({
					id: result?.id,
					name: result?.name,
					shared: result?.shared,
				});
			} catch (error) {
				console.error("folder POST error", error);
				return res.status(400).send("Bad request");
			}
		} else if (req.method === "DELETE") {
			try {
				const request = req.body as DeleteData;

				if (!request.folderId || !DRIVE_ID_RE.test(request.folderId))
					return res.status(400).send("Invalid folderId");

				console.log("deleting folder by folderid: '" + request.folderId + "'");

				const deleteResult = await DeleteGoogleDriveFolder(
					session.accessToken,
					session.refreshToken,
					request.folderId
				);

				return res.status(deleteResult === true ? 200 : 409).send("");
			} catch (error) {
				console.error("folder DELETE error", error);
				return res.status(400).send("Bad request");
			}
		} else return res.status(405).send("Method not allowed");
	}

	return res.status(403).send({ error: "You must sign in." });
}
