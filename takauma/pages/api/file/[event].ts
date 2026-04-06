import { FromBase64ToEmailAndFolder } from "./../../../lib/event";
import {
	GetGoogleDriveFilesByFolderId,
	GetGoogleDriveFolderById,
	UploadGoogleDriveFile,
} from "../../../lib/googledrive";
import formidable from "formidable";
import fs from "fs";
import os from "os";
import path from "path";
import sanitize from "sanitize-filename";
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
			console.error("GET /api/file error", error);
			return res.status(400).send("Bad request");
		}
	} else if (req.method === "POST") {
		const form = formidable({ uploadDir: os.tmpdir(), keepExtensions: true });
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

						// Validate that the temp file path is inside the OS temp directory
						// to prevent path traversal attacks.
						const resolvedPath = path.resolve(file.filepath);
						const resolvedTmp = path.resolve(os.tmpdir());
						if (!resolvedPath.startsWith(resolvedTmp + path.sep)) {
							return reject(new Error("Invalid file path"));
						}

						// Sanitize the user-supplied filename before passing it to Drive.
						const safeFileName = sanitize(
							file.originalFilename ?? file.newFilename ?? ""
						);

						const uploaded = await UploadGoogleDriveFile(
							user.accessToken,
							user.refreshToken,
							folderid as string,
							resolvedPath,
							safeFileName
						);
						fs.unlink(resolvedPath, () => {
							console.log(`fs.unlink ok on temp file`);
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
			console.error("POST /api/file error", error);
			return res.status(400).send("Bad request");
		}
	} else {
		return res.status(400).send("Invalid method");
	}
}
