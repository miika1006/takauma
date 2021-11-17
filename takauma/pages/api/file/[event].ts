import { FromBase64ToEmailAndFolder } from "./../../../lib/event";
import {
	GetGoogleDriveFilesByFolderId,
	UploadGoogleDriveFile,
} from "../../../lib/googledrive";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { drive_v3 } from "googleapis";
import { dynamo } from "../../../lib/dynamo-db";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { event } = req.query;
	const { email, folderid } = FromBase64ToEmailAndFolder(event as string);

	if (folderid) {
		const user = await dynamo.getUser(email as string);
		if (user === null || user.IsBanned === true)
			return res.status(403).send("Forbidden");

		// Query files by eventname (=foldername) Google Drive
		if (req.method === "GET") {
			try {
				/*
                  Get files by folderId
                */
				const result = await GetGoogleDriveFilesByFolderId(
					user.accessToken,
					user.refreshToken,
					folderid as string
				);
				return res.status(200).send(
					result?.map((item) => {
						return {
							id: item?.id,
							name: item?.name,
							webContentLink: item?.webContentLink,
							thumbnailLink: item?.thumbnailLink,
							imageMediaMetadata: {
								width: item?.imageMediaMetadata?.width,
								height: item?.imageMediaMetadata?.height,
								rotation: item?.imageMediaMetadata?.rotation,
							},
						};
					}) ?? []
				);
			} catch (error) {
				res.status(400).send(error);
			}
			// Upload new imagefile to event (=folder)
		} else if (req.method === "POST") {
			const form = new formidable.IncomingForm();
			try {
				const result = await new Promise<drive_v3.Schema$File | null>(
					(resolve, reject) => {
						form.parse(req, async function (err, fields, files) {
							const file = files.file as formidable.File;

							if (!file) reject("file is required");

							const result = await UploadGoogleDriveFile(
								user.accessToken,
								user.refreshToken,
								folderid as string,
								file.filepath,
								file.originalFilename ?? file.newFilename ?? ""
							);
							fs.unlink(file.filepath, () => {
								console.log(`fs.unlink callback ok on file '${file.filepath}'`);
							});
							resolve({
								id: result?.id,
								name: result?.name,
								webContentLink: result?.webContentLink,
								thumbnailLink: result?.thumbnailLink,
								imageMediaMetadata: {
									width: result?.imageMediaMetadata?.width,
									height: result?.imageMediaMetadata?.height,
									rotation: result?.imageMediaMetadata?.rotation,
								},
							});
						});
					}
				);
				return res.status(201).send(result);
			} catch (error) {
				res.status(400).send(error);
			}
		} else return res.status(400).send("Invalid method");
	} else return res.status(404).send("Invalid folderid");
}
