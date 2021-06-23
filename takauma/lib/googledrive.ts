import path from "path";
import { drive_v3, google } from "googleapis";
import fs from "fs";
import readline from "readline";
import { v4 as uuidv4 } from "uuid";

/**
 * Create new instance of google drive with auth tokens to authenticate it
 * @param accessToken
 * @param refreshToken
 * @returns new Drive object
 */
const CreateGoogleDriveInstance = (
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
/**
 * Query files in Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folder if set, then get only files inside this folder
 * @returns list of files (id,name), empty array if error
 */
export const GetGoogleDriveFiles = async (
	accessToken: string,
	refreshToken: string,
	folder?: string
) => {
	try {
		console.log("Getting files from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.list({
			q:
				"mimeType != 'application/vnd.google-apps.folder' and trashed=false" +
				(folder ? `'${folder}' in parents` : ""),
			fields: "nextPageToken, files(id, name)",
			orderBy: "createdTime",
		});
		/*({
			pageSize: 10,
			fields: "nextPageToken, files(id, name)",
		});*/
		console.log("Status:", res.status);
		return res.data.files ?? [];
	} catch (error) {
		console.log("GetGoogleDriveFiles error", error);
		return [];
	}
};
/**
 * Query folders from Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folder
 * @returns list of folders (id,name), empty array if none or error
 */
export const GetGoogleDriveFolders = async (
	accessToken: string,
	refreshToken: string,
	folder?: string
) => {
	try {
		console.log("Getting folders from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.list({
			q:
				"mimeType='application/vnd.google-apps.folder' and trashed=false" +
				(folder ? `'${folder}' in parents` : ""),
			fields: "nextPageToken, files(id, name)",
			orderBy: "createdTime",
		});
		/*({
			pageSize: 10,
			fields: "nextPageToken, files(id, name)",
		});*/
		console.log("Status:", res.status);
		return res.data.files ?? [];
	} catch (error) {
		console.log("GetGoogleDriveFolders error", error);
		return [];
	}
};
/**
 * Get folder by name from Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folder
 * @returns folder (id,name) = File, null if error or no files
 */
export const GetGoogleDriveFolderByName = async (
	accessToken: string,
	refreshToken: string,
	folder: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		console.log("Getting folder by foldername from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.list({
			q:
				"mimeType='application/vnd.google-apps.folder' and trashed=false and name='" +
				folder +
				"'",
			fields: "nextPageToken, files(id, name)",
		});

		console.log("Status:", res.status);
		const files = res.data.files;
		if (files && files.length > 0) {
			console.log("  files[0]:", files[0]);
			return files[0];
		}
		return null;
	} catch (error) {
		console.log("GetGoogleDriveFolderByName error", error);
		return null;
	}
};
/**
 * Create new folder to google drive, use existing if found with same name
 * @param accessToken
 * @param refreshToken
 * @param folder
 * @returns folder (id,name) = File, null if error
 */
export const CreateGoogleDriveFolder = async (
	accessToken: string,
	refreshToken: string,
	folder: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const existingFolder = await GetGoogleDriveFolderByName(
			accessToken,
			refreshToken,
			folder
		);

		if (existingFolder) {
			console.log("Folder '" + folder + "' exists in Google Drive, using it");
			return existingFolder;
		}

		console.log("Creating folder '" + folder + "' in Google Drive");
		const res = await drive.files.create({
			fields: "id",
			requestBody: {
				name: folder,
				mimeType: "application/vnd.google-apps.folder",
			},
		});
		console.log("Status: ", res.status);
		return res.data;
	} catch (error) {
		console.log("CreateGoogleDriveFolder error", error);
		return null;
	}
};
/**
 * Upload file to a folder in Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folder
 * @param fromFile
 * @returns file (id,name) of uploaded file, null if error
 */
export const UploadGoogleDriveFile = async (
	accessToken: string,
	refreshToken: string,
	folder: string,
	fromFile: string
) => {
	try {
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const folderResult = await CreateGoogleDriveFolder(
			accessToken,
			refreshToken,
			folder
		);
		if (folderResult == null) throw Error("failed to get folder");

		const fileFolder = path.dirname(fromFile);
		const fileExtension = path.extname(fromFile);
		const fileName = uuidv4() + fileExtension;
		console.log("Uploading file " + fileName + " to Google drive folder");

		const fileSize = (await fs.promises.stat(fileFolder)).size;
		const res = await drive.files.create(
			{
				requestBody: {
					// a requestBody element is required if you want to use multipart
					parents: [folderResult.id as string],
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
					process.stdout.write(`${Math.round(progress)}% complete`);
				},
			}
		);
		return res.data;
	} catch (error) {
		console.log("UploadGoogleDriveFile error", error);
		return null;
	}
};
