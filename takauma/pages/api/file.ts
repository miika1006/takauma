import {
	GetGoogleDriveFiles,
	UploadGoogleDriveFile,
} from "./../../lib/googledrive";

import formidable from "formidable";
import fs from "fs";
import path from "path";
import sanitize from "sanitize-filename";
import { getSession } from "next-auth/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { drive_v3 } from "googleapis";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getSession({ req });

	if (session) {
		// Query files by eventname (=foldername) Google Drive
		if (req.method === "GET") {
			try {
				const eventName = req.query.eventname as string;
				console.log("Getting files for event '" + eventName + "'");
				const pathSafeEventName = sanitize(eventName);
				if (pathSafeEventName == "") throw new Error("eventName is required");
				const result = await GetGoogleDriveFiles(
					session.accessToken as string,
					session.refreshToken as string,
					pathSafeEventName
				);
				return res.status(200).send(
					result?.map((item) => {
						return {
							id: item?.id,
							name: item?.name,
							webContentLink: item?.webContentLink,
							thumbnailLink: item?.thumbnailLink,
						};
					}) ?? []
				);
			} catch (error) {
				res.status(400).send(error);
			}
			// Upload new imagefile to event (=foldername)
		} else if (req.method === "POST") {
			const form = new formidable.IncomingForm();
			try {
				const result = await new Promise<drive_v3.Schema$File | null>(
					(resolve, reject) => {
						form.parse(req, async function (err, fields, files) {
							const file = files.file as formidable.File;

							if (!file) reject("file is required");

							const filePath = path.join(file.path, file.name ?? "");
							console.log(
								"Uploaded a file '" +
									file.name +
									"', now uploading it to google drive"
							);
							const pathSafeEventName = sanitize(fields.eventName as string);
							if (pathSafeEventName === "") reject("eventName is required");

							const result = await UploadGoogleDriveFile(
								session.accessToken as string,
								session.refreshToken as string,
								pathSafeEventName,
								filePath
							);
							fs.unlinkSync(file.path);
							resolve({
								id: result?.id,
								name: result?.name,
								webContentLink: result?.webContentLink,
								thumbnailLink: result?.thumbnailLink,
							});
						});
					}
				);
				return res.status(201).send(result);
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(400).send("Invalid method");
	}

	res.status(403).send({
		error: "You must sign in.",
	});
}
