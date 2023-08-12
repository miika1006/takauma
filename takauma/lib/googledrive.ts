import path from "path";
import { drive_v3, google } from "googleapis";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import NodeCache from "node-cache";
const cache = new NodeCache();
/**
 * Create new instance of google drive with auth tokens to authenticate it
 * @param accessToken
 * @returns new Drive object
 */
const CreateGoogleDriveInstance = (
	accessToken: string,
	refreshToken: string,
	useServiceAccount?: boolean
) => {
	const clientId = process.env.GOOGLE_ID;
	const clientSecret = process.env.GOOGLE_SECRET;

	if (useServiceAccount === true) {
		//Authenticating using service account credentials
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: process.env.SERVICE_ACCOUNT,
				private_key: process.env.SERVICE_ACCOUNT_KEY,
			},
			//See, edit, create, and delete all of your Google Drive files
			//This is a service account, so naturally it can edit all of its files
			//Using this scope because app needs to load folders shared to this service account
			scopes: ["https://www.googleapis.com/auth/drive"],
		});

		return google.drive({ auth, version: "v3" });
	} else {
		//Authenticating by current user
		const auth = new google.auth.OAuth2({
			clientId,
			clientSecret,
		});
		auth.setCredentials({
			access_token: accessToken,
			refresh_token: refreshToken,
		});

		return google.drive({ auth, version: "v3" });
	}
};
/**
 * Delete folder in Google Drive
 * Only possible to folders created by this app
 * (scope : drive.file)
 * This will fail if folder contains any files owned by someone else other than current user
 */
export const DeleteGoogleDriveFolder = async (
	accessToken: string,
	refreshToken: string,
	folderId: string,
	useServiceAccount?: boolean
) => {
	try {
		if (folderId == "") return null;
		const drive = CreateGoogleDriveInstance(
			accessToken,
			refreshToken,
			useServiceAccount
		);

		console.log("DeleteGoogleDriveFolder Deleting folder");

		const deleteResult = await drive.files.delete({
			fileId: folderId,
		});
		console.log(
			"DeleteGoogleDriveFolder Deleting folder Status",
			deleteResult.status
		);
		return deleteResult.status >= 200 && deleteResult.status < 300;
	} catch (error) {
		console.log("DeleteGoogleDriveFolder error", error);
		return false;
	}
};

/**
 * Stop sharing folder from the world
 * @param accessToken
 * @param folderId
 * @returns
 */
export const UnShareGoogleDriveFolderFromAnyone = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;
		console.log(
			"UnShareGoogleDriveFolderFromAnyone removing share from anyone"
		);

		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);

		console.log(
			"UnShareGoogleDriveFolderFromAnyone Getting folder by folderid"
		);

		const res = await drive.files.get({
			fileId: folderId,
			fields: "id,name,permissions,trashed",
			supportsAllDrives: true,
		});

		console.log(
			"UnShareGoogleDriveFolderFromAnyone Get folder Status:",
			res.status
		);

		if (res.status != 200 || res?.data === null) {
			console.log("Could not get folder", res);
			throw new Error("Could not get folder");
		}

		const folder = res.data;

		console.log(
			"UnShareGoogleDriveFolderFromAnyone found folder, now clearing permission"
		);

		const anyonePermission = folder.permissions?.find(
			(s) => s.type === "anyone"
		);

		if (anyonePermission) {
			console.log(
				"UnShareGoogleDriveFolderFromAnyone Deleting permission for anyone"
			);

			const permissionres = await drive.permissions.delete({
				fileId: folderId,
				permissionId: anyonePermission.id as string,
			});
			console.log(
				"UnShareGoogleDriveFolderFromAnyone Delete permission Status:",
				permissionres.status
			);
			folder.permissions = folder.permissions?.filter(
				(f) => f.type !== "anyone"
			);
		} else {
			console.log(
				"UnShareGoogleDriveFolderFromAnyone could not find existing permission for anyone? ignoring."
			);
		}
		return { ...folder, shared: false };
	} catch (error) {
		console.log("UnShareGoogleDriveFolderFromAnyone error", error);
		return null;
	}
};
/**
 * Share folder to the world so anyone with a link can view
 * Photogallery starts working without login
 *
 * 1. Get folder by id
 *    throw error if not found => returns null
 * 2. Check folder current permissions
 *    if already shared, then do nothing
 * 3. Create permission to folder to anyone
 *
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns folder (file= id,name,shared) or null if some error
 */
export const ShareGoogleDriveFolderToAnyone = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;

		console.log(
			"ShareGoogleDriveFolderToAnyone Sharing folder to anyone in Google Drive"
		);
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);

		const res = await drive.files.get({
			fileId: folderId,
			fields: "id,name,permissions,trashed",
			supportsAllDrives: true,
		});

		console.log("ShareGoogleDriveFolderToAnyone Status:", res.status);

		if (res.status != 200 || res?.data === null) {
			console.log("Could not get folder", res);
			throw new Error("Could not get folder");
		}

		const folder = res.data;

		console.log(
			"ShareGoogleDriveFolderToAnyone found folder",
			folder.id,
			folder.name
		);

		if (folder.trashed) {
			console.log(
				"ShareGoogleDriveFolderToAnyone folder is trashed, ignore? (doing nothing)"
			);
		}

		const existingAnyonePermission = folder.permissions?.find(
			(s) => s.type === "anyone"
		);

		if (!existingAnyonePermission) {
			console.log("ShareGoogleDriveFolderToAnyone creating share to anyone");

			const permissionres = await drive.permissions.create({
				fileId: folderId,
				fields: "id",
				requestBody: {
					type: "anyone",
					role: "reader",
				},
			});
			folder.permissions?.push(permissionres.data);
			console.log(
				"ShareGoogleDriveFolderToAnyone creating share to anyone Status: ",
				permissionres.status
			);
		} else {
			console.log("ShareGoogleDriveFolderToAnyone already shared, ignoring");
		}

		return {
			...folder,
			shared: true,
		};
	} catch (error) {
		console.log("ShareGoogleDriveFolderToAnyone error", error);
		return null;
	}
};
/**
 * Get files in folder by folderid
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns list of files
 */
export const GetGoogleDriveFilesByFolderId = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
) => {
	try {
		console.log("Getting files by folderId from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.list({
			q:
				"mimeType!='application/vnd.google-apps.folder' and trashed=false" +
				` and '${folderId}' in parents`,
			fields:
				"nextPageToken, files(id, name,thumbnailLink,webContentLink,imageMediaMetadata)",
			orderBy: "createdTime",
			pageSize: 1000,
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
		});

		console.log("GetGoogleDriveFilesByFolderId Status:", res.status);
		return res.data.files ?? [];
	} catch (error) {
		console.log("GetGoogleDriveFilesByFolderId error", error);
		return [];
	}
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
	folderName?: string
) => {
	try {
		console.log("Getting files from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const folderByName = await GetGoogleDriveFolderByName(
			accessToken,
			refreshToken,
			folderName ?? ""
		);
		const res = await drive.files.list({
			q:
				"mimeType!='application/vnd.google-apps.folder' and trashed=false" +
				(folderByName ? ` and '${folderByName.id}' in parents` : ""),
			fields: "nextPageToken, files(id, name,thumbnailLink,webContentLink)",
			orderBy: "createdTime",
			pageSize: 1000,
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
		});
		/*({
			pageSize: 10,
			fields: "nextPageToken, files(id, name)",
		});*/
		console.log("GetGoogleDriveFiles Status:", res.status);
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
			fields: "nextPageToken, files(id, name, permissions)",
			orderBy: "createdTime",
			supportsAllDrives: true,
		});
		/*({
			pageSize: 10,
			fields: "nextPageToken, files(id, name)",
		});*/
		console.log("GetGoogleDriveFolders Status:", res.status);
		const files = res.data.files ?? [];
		return files.map((folder: drive_v3.Schema$File) => {
			return {
				...folder,
				shared: folder.permissions?.some((s) => s.type === "anyone") ?? false,
			};
		});
	} catch (error) {
		console.log("GetGoogleDriveFolders error", error);
		return [];
	}
};
/**
 * Get folder by name from Google Drive
 * @param accessToken
 * @param folder
 * @returns folder (id,name) = File, null if error or not found
 */
export const GetGoogleDriveFolderByName = async (
	accessToken: string,
	refreshToken: string,
	folder: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folder == "") return null;

		console.log("Getting folder by foldername from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.list({
			q:
				"mimeType='application/vnd.google-apps.folder' and trashed=false and name='" +
				folder +
				"'",
			fields: "nextPageToken, files(id, name, permissions)",
			supportsAllDrives: true,
		});

		console.log("GetGoogleDriveFolderByName Status:", res.status);
		const files = res.data.files;
		if (files && files.length > 0) {
			return {
				...files[0],
				shared: files[0].permissions?.some((s) => s.type === "anyone") ?? false,
			};
		}
		return null;
	} catch (error) {
		console.log("GetGoogleDriveFolderByName error", error);
		return null;
	}
};
/**
 * Get folder by id from Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns folder (id,name) = File, null if error or not found
 */
export const GetGoogleDriveFolderById = async (
	accessToken: string,
	refreshToken: string,
	folderId: string,
	useCache: boolean = false
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;
		if (useCache) {
			console.log(
				"GetGoogleDriveFolderById getting folder from cache if found"
			);
			const folderFromCache = cache.get<drive_v3.Schema$File>(
				`GetGoogleDriveFolderById(${folderId})`
			);
			if (folderFromCache) {
				console.log(
					"GetGoogleDriveFolderById Found folder from cache, returning it"
				);
				return folderFromCache;
			}
		}

		console.log(
			"GetGoogleDriveFolderById Getting folder by id from Google Drive"
		);
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const res = await drive.files.get({
			fileId: folderId,
			fields: "id,name,trashed,permissions",
			supportsAllDrives: true,
		});

		console.log("GetGoogleDriveFolderById Status:", res.status);

		if (res.status != 200 || res?.data === null) {
			console.log("Could not get folder", res);
			throw new Error("Could not get folder");
		}

		const folder = res.data;
		const isShared =
			folder.permissions?.some((s) => s.type === "anyone") ?? false;

		console.log(
			"GetGoogleDriveFolderById found folder",
			folder.id,
			folder.name,
			", is shared",
			isShared
		);

		if (folder.trashed) {
			console.log(
				"GetGoogleDriveFolderById folder is trashed, ignore? (doing nothing)"
			);
		}

		const result = {
			...folder,
			shared: isShared,
		};

		if (useCache) {
			console.log("GetGoogleDriveFolderById Saving folder to cache");
			cache.set(`GetGoogleDriveFolderById(${folderId})`, result, 90);
		}
		return result;
	} catch (error) {
		console.log("GetGoogleDriveFolderById error", error);
		return null;
	}
};

/**
 * Create new folder to google drive, use existing if found with same name
 * @param accessToken
 * @param folderName
 * @returns folder (id,name) = File, null if error
 */
export const GetOrCreateGoogleDriveFolderByFolderName = async (
	accessToken: string,
	refreshToken: string,
	folderName: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const existingFolder = await GetGoogleDriveFolderByName(
			accessToken,
			refreshToken,
			folderName
		);
		if (existingFolder) {
			console.log(
				"Folder '" + folderName + "' exists in Google Drive, using it"
			);

			return {
				...existingFolder,
				shared:
					existingFolder.permissions?.some((s) => s.type === "anyone") ?? false,
			};
		}

		console.log("Creating folder '" + folderName + "' in Google Drive");
		const res = await drive.files.create({
			fields: "id, name, permissions",
			requestBody: {
				name: folderName,
				mimeType: "application/vnd.google-apps.folder",
			},
			supportsAllDrives: true,
		});
		const data = res.data;
		console.log("CreateGoogleDriveFolder Status: ", res.status);

		return {
			...data,
			shared: data.permissions?.some((s) => s.type === "anyone") ?? false,
		};
	} catch (error) {
		console.log("CreateGoogleDriveFolder error", error);
		return null;
	}
};

/**
 * Upload file to a folder in Google Drive
 * @param accessToken
 * @param folder - folder name
 * @param fromFile - local filepath
 * @returns file (id,name) of uploaded file, null if error
 */
export const UploadGoogleDriveFile = async (
	accessToken: string,
	refreshToken: string,
	folderId: string,
	fromFile: string,
	fileName: string
) => {
	try {
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		return await UploadFileToDrive(drive, folderId, fromFile, fileName);
	} catch (error) {
		console.log("UploadGoogleDriveFile error", error);
		return null;
	}
};

/**
 * Upload a file to drive folder
 * @param drive
 * @param folderId
 * @param fromFile
 * @param fileName
 * @returns
 */
const UploadFileToDrive = async (
	drive: drive_v3.Drive,
	folderId: string,
	fromFile: string,
	fileName: string
) => {
	console.log("Uploading file " + fileName + " to Google drive folder");

	const fileSize = (await fs.promises.stat(fromFile)).size;
	const res = await drive.files.create(
		{
			fields: "id,name",
			requestBody: {
				// a requestBody element is required if you want to use multipart
				parents: [folderId],
				name: fileName,
			},
			media: {
				body: fs.createReadStream(fromFile),
			},
			supportsAllDrives: true,
		},
		{
			// Use the `onUploadProgress` event to track the
			// number of bytes uploaded to this point.
			onUploadProgress: (evt) => {
				const progress = (evt.bytesRead / fileSize) * 100;
				//readline.clearLine(process.stdout, 0);
				//readline.cursorTo(process.stdout, 0);
				//process.stdout.write(`${Math.round(progress)}% complete`);
				console.log(`${Math.round(progress)}% complete`);
			},
		}
	);
	console.log("Upload file " + fileName + " Status", res.status);

	if (res.data?.id) {
		//GoogleApi Returns 500 status - Error if creating new file with thumbnaillink and webcontentlink fields
		//Extra request here to get those fields
		console.log("Getting file details by fileid ", res.data.id);

		const queryfiles = await drive.files.get({
			fileId: res.data.id,
			fields: "id,name,thumbnailLink,webContentLink,imageMediaMetadata",
			supportsAllDrives: true,
		});

		console.log("Getting file details by fileid status ", res.status);

		return queryfiles.data;
	}
	return res.data;
};
