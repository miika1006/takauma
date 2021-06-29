import {
	ShareGoogleDriveFolderToAnyoneUsingServiceAccount,
	UnShareGoogleDriveFolderFromAnyoneUsingServiceAccount,
} from "./../../../lib/googledrive";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";

type ShareData = {
	folderId: string;
	share: boolean;
};
export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getSession({ req });

	if (session) {
		//Update share state for serviceaccount on a folder
		if (req.method === "PUT") {
			try {
				//share
				const request = req.body as ShareData;

				if (request.share) {
					//Share folder to the world so photos will be available without login
					console.log("sharing folder '" + request.folderId + "'");
					const result =
						await ShareGoogleDriveFolderToAnyoneUsingServiceAccount(
							session.accessToken as string,
							session.refreshToken as string,
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
					const result =
						await UnShareGoogleDriveFolderFromAnyoneUsingServiceAccount(
							session.accessToken as string,
							session.refreshToken as string,
							request.folderId
						);
					return res.status(200).send({
						id: result?.id,
						name: result?.name,
						shared: result?.shared,
					});
				}
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(403).send("Invalid method");
	}
	res.status(403).send({
		error: "You must sign in.",
	});
}
