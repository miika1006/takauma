import { FromBase64ToEmailAndFolder } from "./../../../lib/event";
import {
	GetGoogleDriveFilesByFolderId,
	GetGoogleDriveFolderById,
	UploadGoogleDriveFile,
} from "../../../lib/googledrive";
import formidable from "formidable";
import fs from "fs";
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

	if (!folderid) return res.status(404).send("Invalid folderid");

	const user = await dynamo.getUser(email as string);
	if (user === null || user.IsBanned === true)
		return res.status(403).send("Forbidden");

	const folder = await GetGoogleDriveFolderById(
		user.accessToken,
		user.refreshToken,
		folderid as string,
		true
	);
	if (folder === null || folder.shared === false)
		return res.status(403).send("Forbidden");

	if (req.method === "GET") {
		try {
			const result = await GetGoogleDriveFilesByFolderId(
				user.accessToken,
				user.refreshToken,
				folderid as string
			);
			return res.status(200).send(
				result?.map((item) => ({
					id: item?.id,
					name: item?.name,
					webContentLink: item?.webContentLink,
					thumbnailLink: item?.thumbnailLink,
					imageMediaMetadata: {
						width: item?.imageMediaMetadata?.width,
						height: item?.imageMediaMetadata?.height,
						rotation: item?.imageMediaMetadata?.rotation,
					},
				})) ?? []
			);
		} catch (error) {
			return res.status(400).send(error);
		}
	} else if (req.method === "POST") {
		const form = formidable({});
		try {
			const result = await new Promise<drive_v3.Schema$File | null>(
				(resolve, reject) => {
					form.parse(req, async (err, _fields, files) => {
						if (err) return reject(err);

						const fileArray = files.file;
						const file = Array.isArray(fileArray)
							? fileArray[0]
							: fileArray;

						if (!file) return reject(new Error("file is required"));

						const uploaded = await UploadGoogleDriveFile(
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
							id: uploaded?.id,
							name: uploaded?.name,
							webContentLink: uploaded?.webContentLink,
							thumbnailLink: uploaded?.thumbnailLink,
							imageMediaMetadata: {
								width: uploaded?.imageMediaMetadata?.width,
								height: uploaded?.imageMediaMetadata?.height,
								rotation: uploaded?.imageMediaMetadata?.rotation,
							},
						});
					});
				}
			);
			return res.status(201).send(result);
		} catch (error) {
			return res.status(400).send(error);
		}
	} else {
		return res.status(400).send("Invalid method");
	}
}
