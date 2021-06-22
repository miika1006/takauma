import { UploadGoogleDriveFile } from "./../../lib/googledrive";
// This is an example of to protect an API route

import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
	api: {
		bodyParser: false,
	},
};

import { getSession } from "next-auth/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { drive_v3 } from "googleapis";

export default async function protectedHandler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getSession({ req });

	if (session) {
		if (req.method === "POST") {
			const form = new formidable.IncomingForm();
			const result = await new Promise<drive_v3.Schema$File | null>(
				(resolve, reject) => {
					form.parse(req, async function (err, fields, files) {
						const file = files.file as formidable.File;
						//
						/*	const data = fs.readFileSync(file.path);
                const newPath = `./public/upload/${file.name}`;
                fs.writeFileSync(newPath, data);
                await fs.unlinkSync(file.path);*/

						const filePath = path.join(file.path, file.name ?? "");
						console.log(
							"Uploaded a file, now uploading it to google drive",
							filePath
						);
						const result = await UploadGoogleDriveFile(
							session.accessToken as string,
							session.refreshToken as string,
							"testi", //TODO:
							filePath
						);
						fs.unlinkSync(file.path);
						resolve(result);
						/**/
						//return res.status(201).send(result);
					});
				}
			);
			return res.status(201).send(result);
		} else return res.status(201).send("");
	}

	res.status(403).send({
		error: "You must sign in.",
	});
}
