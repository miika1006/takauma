import path from "path";
import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import { v4 as uuidv4 } from "uuid";

export const CreateGoogleDrive = async (
	accessToken: string,
	refreshToken: string
) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const auth = new google.auth.OAuth2({
		clientId,
		clientSecret,
	});
	auth.setCredentials({
		access_token: accessToken,
		refresh_token: refreshToken,
	});
	return google.drive({ auth, version: "v3" });
};

export const GetGoogleDriveFiles = async (
	accessToken: string,
	refreshToken: string
) => {
	try {
		console.log("Getting files from Google Drive");
		const drive = await CreateGoogleDrive(accessToken, refreshToken);
		const res = await drive.files.list();
		/*({
			pageSize: 10,
			fields: "nextPageToken, files(id, name)",
		});*/
		console.log("Status:", res.status);
		const files = res.data.files;
		return files ?? [];
	} catch (error) {
		console.log("GetGoogleDriveFiles error", error);
		return [];
	}
};

export const CreateGoogleDriveFolder = async (
	accessToken: string,
	refreshToken: string,
	folder: string
) => {
	const drive = await CreateGoogleDrive(accessToken, refreshToken);

	//TODO: Try to find if folder exists first, return it if found
	console.log("Creating folder '" + folder + "' in Google Drive");
	const res = await drive.files.create(
		{
			fields: "id",
			requestBody: {
				name: folder,
				mimeType: "application/vnd.google-apps.folder",
			},
		}
		/*function (err, file) {
			if (err) {
				// Handle error
				console.error(err);
			} else {
				console.log("Folder Id: ", file?.id);
			}
		}*/
	);
	console.log("Status: ", res.status);
	return res;
};

export const UploadGoogleDriveFile = async (
	accessToken: string,
	refreshToken: string,
	folder: string,
	fromFile: string
) => {
	try {
		const drive = await CreateGoogleDrive(accessToken, refreshToken);
		const folderResult = await CreateGoogleDriveFolder(
			accessToken,
			refreshToken,
			folder
		);
		const fileFolder = path.dirname(fromFile);
		const fileExtension = path.extname(fromFile);
		const fileName = uuidv4() + fileExtension;
		console.log("Uploading file " + fileName + " to Google drive folder");
		const fileSize = (await fs.promises.stat(fileFolder)).size;
		const res = await drive.files.create(
			{
				requestBody: {
					// a requestBody element is required if you want to use multipart
					parents: [folderResult.data.id as string],
					name: fileName,
				},
				media: {
					body: fs.createReadStream(fileFolder),
				},
			},
			{
				// Use the `onUploadProgress` event from Axios to track the
				// number of bytes uploaded to this point.
				onUploadProgress: (evt) => {
					const progress = (evt.bytesRead / fileSize) * 100;
					readline.clearLine(process.stdout, 0);
					readline.cursorTo(process.stdout, 0);
					//process.stdout.write(`${Math.round(progress)}% complete`);
					console.log(`${Math.round(progress)}% complete`);
				},
			}
		);
		const result = await res.data;
		return result;
	} catch (error) {
		console.log("UploadGoogleDriveFile error", error);
		return null;
	}
};
