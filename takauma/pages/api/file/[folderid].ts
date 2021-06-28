import {
	GetGoogleDriveFiles,
	GetGoogleDriveFilesByFolderIdUsingServiceAccount,
	UploadGoogleDriveFileToFolderByIdUsingServiceAccount,
	UploadGoogleDriveFile,
} from "../../../lib/googledrive";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { drive_v3 } from "googleapis";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { folderid } = req.query;

	if (folderid) {
		// Query files by eventname (=foldername) Google Drive
		if (req.method === "GET") {
			try {
				/*
                  Get files by folderId using service account
                */
				const result = await GetGoogleDriveFilesByFolderIdUsingServiceAccount(
					folderid as string
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
			// Upload new imagefile to event (=folder)
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

							/**
                              Upload file using service account to folder by id
                             */
							const result =
								await UploadGoogleDriveFileToFolderByIdUsingServiceAccount(
									folderid as string,
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
	} else return res.status(404).send("Invalid folderid");
}
