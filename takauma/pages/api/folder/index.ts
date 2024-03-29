import { GetGoogleDriveFolders } from "./../../../lib/googledrive";
import {
	GetOrCreateGoogleDriveFolderByFolderName,
	DeleteGoogleDriveFolder,
} from "../../../lib/googledrive";
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import sanitize from "sanitize-filename";
import { getSession } from "next-auth/client";

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
	const session = await getSession({ req });

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
				res.status(400).send(error);
			}
		}
		//Create new folder
		else if (req.method === "POST") {
			try {
				const request = req.body as CreateData;
				console.log("creating new folder '" + request.name + "'");

				const pathSafeEventName = sanitize(request.name);
				if (pathSafeEventName == "") throw new Error("eventName is required");

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
				res.status(400).send(error);
			}
		} else if (req.method === "DELETE") {
			try {
				const request = req.body as DeleteData;
				console.log("deleting folder by folderid: '" + request.folderId + "'");

				const deleteResult = await DeleteGoogleDriveFolder(
					session.accessToken,
					session.refreshToken,
					request.folderId
				);

				return res.status(deleteResult === true ? 200 : 409).send("");
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(403).send("Invalid method");
	}

	res.status(403).send({
		error: "You must sign in.",
	});
}
