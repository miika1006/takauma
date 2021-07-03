import {
	GetOrCreateGoogleDriveFolderByFolderName,
	ShareGoogleDriveFolderToServiceAccount,
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
		//Create new folder
		if (req.method === "POST") {
			try {
				const request = req.body as CreateData;
				console.log("creating new folder '" + request.name + "'");

				const pathSafeEventName = sanitize(request.name);
				if (pathSafeEventName == "") throw new Error("eventName is required");

				const result = await GetOrCreateGoogleDriveFolderByFolderName(
					session.accessToken,
					pathSafeEventName
				);
				//Immediatelly share folder to service account
				//so that uploading photos later is possible without login
				await ShareGoogleDriveFolderToServiceAccount(
					session.accessToken,
					result?.id ?? ""
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
					request.folderId
				);

				return res.status(deleteResult ? 200 : 409).send("");
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(403).send("Invalid method");
	}

	res.status(403).send({
		error: "You must sign in.",
	});
}
