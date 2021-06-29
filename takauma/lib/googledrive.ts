import path from "path";
import { drive_v3, google } from "googleapis";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

/**
 * Create new instance of google drive with auth tokens to authenticate it
 * @param accessToken
 * @param refreshToken
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
 * Stop sharing folder from service account
 * => This will not work if folder contains any file created by service account
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns
 */
export const UnShareGoogleDriveFolderFromServiceAccount = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;
		console.log(
			"UnShareGoogleDriveFolderFromServiceAccount removing share to service account"
		);

		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);

		console.log(
			"UnShareGoogleDriveFolderFromServiceAccount Getting folder by folderid"
		);

		const res = await drive.files.get({
			fileId: folderId,
			fields: "id,name,permissions,trashed",
			supportsAllDrives: true,
		});

		console.log(
			"UnShareGoogleDriveFolderFromServiceAccount Get folder Status:",
			res.status
		);

		if (res.status != 200 || res?.data === null) {
			console.log("Could not get folder", res);
			throw new Error("Could not get folder");
		}

		const folder = res.data;

		console.log(
			"UnShareGoogleDriveFolderFromServiceAccount found folder, now clearing permission"
		);

		const serviceAccountPermission = folder.permissions?.find(
			(s) => s.emailAddress === process.env.SERVICE_ACCOUNT
		);

		if (serviceAccountPermission) {
			console.log(
				"UnShareGoogleDriveFolderFromServiceAccount Deleting permission for serviceaccount"
			);

			const permissionres = await drive.permissions.delete({
				fileId: folderId,
				permissionId: serviceAccountPermission.id as string,
			});
			console.log(
				"UnShareGoogleDriveFolderFromServiceAccount Delete permission Status:",
				permissionres.status
			);
			folder.permissions = folder.permissions?.filter(
				(f) => f.emailAddress !== process.env.SERVICE_ACCOUNT
			);
		} else {
			console.log(
				"UnShareGoogleDriveFolderFromServiceAccount could not find existing permission for serviceaccount? ignoring."
			);
		}
		return {
			...folder,
			shared: folder.permissions?.some((s) => s.type === "anyone") ?? false,
		};
	} catch (error) {
		console.log("UnShareGoogleDriveFolderFromServiceAccount error", error);
		return null;
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
	folderId: string
) => {
	try {
		if (folderId == "") return null;
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);

		console.log("DeleteGoogleDriveFolder Deleting folder");
		let insufficient = false;
		try {
			const deleteResult = await drive.files.delete({
				fileId: folderId,
			});
			console.log(
				"DeleteGoogleDriveFolder Deleting folder Status",
				deleteResult.status
			);
		} catch (error) {
			console.log("DeleteGoogleDriveFolder Deleting folder error", error);
			insufficient = true;
		}

		if (insufficient) {
			console.log(
				"DeleteGoogleDriveFolder Insufficient permissions, now trying with service account"
			);
			//insufficient permissions, try with service account
			const saDrive = CreateGoogleDriveInstance("", "", true);

			const deleteSAResult = await saDrive.files.delete({
				fileId: folderId,
			});
			console.log(
				"DeleteGoogleDriveFolder Deleting folder with service account Status",
				deleteSAResult.status
			);
		}
	} catch (error) {
		console.log("DeleteGoogleDriveFolder error", error);
		return null;
	}
};
/**
 * Share folder to serviceaccount
 * making it possible to upload photos without login
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns
 */
export const ShareGoogleDriveFolderToServiceAccount = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;

		/*
		1. Get folder by id
		   throw error if not found
		2. Check folder current permissions
		   if already shared, then do nothing
		3. Update permissions to share folder to service account
		*/

		console.log(
			"ShareGoogleDriveFolderToServiceAccount Sharing folder to service account in Google Drive"
		);
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);

		const res = await drive.files.get({
			fileId: folderId,
			fields: "id,name,permissions,trashed",
			supportsAllDrives: true,
		});

		if (res.status != 200 || res?.data === null) {
			console.log("Could not find folder", res);
			throw new Error("Could not get folder");
		}

		const folder = res.data;

		console.log(
			"ShareGoogleDriveFolderToServiceAccount found folder:",
			folder.id,
			folder.name
		);

		if (folder.trashed) {
			console.log(
				"ShareGoogleDriveFolderToServiceAccount folder is trashed, ignore? (doing nothing)"
			);
		}

		const exitingServicePermission = folder.permissions?.find(
			(s) => s.emailAddress === process.env.SERVICE_ACCOUNT
		);

		if (!exitingServicePermission) {
			console.log(
				"ShareGoogleDriveFolderToServiceAccount creating share to service account"
			);

			const permissionres = await drive.permissions.create({
				fileId: folderId,
				fields: "id",
				requestBody: {
					type: "user",
					role: "writer", //Allow service account to write new photos in behalf of other users
					emailAddress: process.env.SERVICE_ACCOUNT,
				},
			});
			folder.permissions?.push(permissionres.data);
			console.log(
				"ShareGoogleDriveFolderToServiceAccount creating share to service account Status: ",
				permissionres.status
			);
		} else {
			//Check permission data
			if (
				exitingServicePermission.type != "user" &&
				exitingServicePermission.role != "writer"
			) {
				console.log(
					"ShareGoogleDriveFolderToServiceAccount permission found but is invalid, updating back to original"
				);
				const permissionres = await drive.permissions.update({
					fileId: folderId,
					permissionId: exitingServicePermission.id as string,
					fields: "id",
					requestBody: {
						type: "user",
						role: "writer", //Allow service account to write new photos in behalf of other users
						emailAddress: process.env.SERVICE_ACCOUNT,
					},
				});
				folder.permissions?.push(permissionres.data);
			} else {
				console.log(
					"ShareGoogleDriveFolderToServiceAccount permission exists, doing nothing"
				);
			}
		}

		return {
			...folder,
			shared: folder.permissions?.some((s) => s.type === "anyone") ?? false,
		};
	} catch (error) {
		console.log("ShareGoogleDriveFolderToServiceAccount error", error);
		return null;
	}
};
/**
 * Stop sharing folder from the world
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @returns
 */
export const UnShareGoogleDriveFolderFromAnyoneUsingServiceAccount = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;
		console.log(
			"UnShareGoogleDriveFolderFromAnyone removing share from anyone"
		);

		const drive = CreateGoogleDriveInstance(accessToken, refreshToken, true);

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
export const ShareGoogleDriveFolderToAnyoneUsingServiceAccount = async (
	accessToken: string,
	refreshToken: string,
	folderId: string
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;

		console.log(
			"ShareGoogleDriveFolderToAnyone Sharing folder to anyone in Google Drive"
		);
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken, true);

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
 * Get folder by id using service account
 * @param folderId
 * @returns list of files
 */
export const GetGoogleDriveFilesByFolderIdUsingServiceAccount = async (
	folderId: string
) => {
	try {
		console.log(
			"Getting files by folderId, using service account from Google Drive"
		);
		const drive = CreateGoogleDriveInstance("", "", true);
		const res = await drive.files.list({
			q:
				"mimeType!='application/vnd.google-apps.folder' and trashed=false" +
				` and '${folderId}' in parents`,
			fields: "nextPageToken, files(id, name,thumbnailLink,webContentLink)",
			orderBy: "createdTime",
			pageSize: 1000,
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
		});

		console.log(
			"GetGoogleDriveFilesByFolderIdUsingServiceAccount Status:",
			res.status
		);
		return res.data.files ?? [];
	} catch (error) {
		console.log(
			"GetGoogleDriveFilesByFolderIdUsingServiceAccount error",
			error
		);
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
	folder?: string
) => {
	try {
		console.log("Getting files from Google Drive");
		const drive = CreateGoogleDriveInstance(accessToken, refreshToken);
		const folderByName = await GetGoogleDriveFolderByName(
			accessToken,
			refreshToken,
			folder ?? ""
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
 * @param refreshToken
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
 * @param folderId
 * @returns folder (id,name) = File, null if error or not found
 */
export const GetGoogleDriveFolderByIdUsingServiceAccount = async (
	folderId: string
) => await GetGoogleDriveFolderById("", "", folderId, true);
/**
 * Get folder by id from Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folderId
 * @param useServiceAccount
 * @returns folder (id,name) = File, null if error or not found
 */
export const GetGoogleDriveFolderById = async (
	accessToken: string,
	refreshToken: string,
	folderId: string,
	useServiceAccount?: boolean
): Promise<drive_v3.Schema$File | null> => {
	try {
		if (folderId == "") return null;

		console.log(
			"GetGoogleDriveFolderById Getting folder by id from Google Drive"
		);
		const drive = CreateGoogleDriveInstance(
			accessToken,
			refreshToken,
			useServiceAccount
		);
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

		console.log(
			"GetGoogleDriveFolderById found folder",
			folder.id,
			folder.name
		);

		if (folder.trashed) {
			console.log(
				"GetGoogleDriveFolderById folder is trashed, ignore? (doing nothing)"
			);
		}

		return {
			...folder,
			shared: folder.permissions?.some((s) => s.type === "anyone") ?? false,
		};
	} catch (error) {
		console.log("GetGoogleDriveFolderById error", error);
		return null;
	}
};

/**
 * Create new folder to google drive, use existing if found with same name
 * @param accessToken
 * @param refreshToken
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
 * Upload a image (file) to folder by id
 * @param folderId
 * @param fromFile
 * @returns
 */
export const UploadGoogleDriveFileToFolderByIdUsingServiceAccount = async (
	folderId: string,
	fromFile: string
) => {
	try {
		const drive = CreateGoogleDriveInstance("", "", true);
		return await UploadFileToDrive(drive, folderId, fromFile, true);
	} catch (error) {
		console.log(
			"UploadGoogleDriveFileToFolderByIdUsingServiceAccount error",
			error
		);
		return null;
	}
};

/**
 * Upload file to a folder in Google Drive
 * @param accessToken
 * @param refreshToken
 * @param folder - folder name
 * @param fromFile - local filepath
 * @param useServiceAccount - Are we using service account or user session account
 * @returns file (id,name) of uploaded file, null if error
 */
export const UploadGoogleDriveFile = async (
	accessToken: string,
	refreshToken: string,
	folder: string,
	fromFile: string,
	useServiceAccount?: boolean
) => {
	try {
		const drive = CreateGoogleDriveInstance(
			accessToken,
			refreshToken,
			useServiceAccount
		);
		const folderResult = await GetOrCreateGoogleDriveFolderByFolderName(
			accessToken,
			refreshToken,
			folder
		);
		if (folderResult == null) throw Error("failed to get folder");

		return await UploadFileToDrive(
			drive,
			folderResult.id as string,
			fromFile,
			false
		);
	} catch (error) {
		console.log("UploadGoogleDriveFile error", error);
		return null;
	}
};

const UploadFileToDrive = async (
	drive: drive_v3.Drive,
	folderId: string,
	fromFile: string,
	serviceAccount: boolean
) => {
	const fileFolder = path.dirname(fromFile);
	const fileExtension = path.extname(fromFile);
	const fileName = uuidv4() + fileExtension;
	console.log("Uploading file " + fileName + " to Google drive folder");

	const fileSize = (await fs.promises.stat(fileFolder)).size;
	const res = await drive.files.create(
		{
			fields: "id,name", //+ (serviceAccount ? ",permissions" : ""),
			requestBody: {
				// a requestBody element is required if you want to use multipart
				parents: [folderId],
				name: fileName,
			},
			media: {
				body: fs.createReadStream(fileFolder),
			},
			supportsAllDrives: true,
		},
		{
			// Use the `onUploadProgress` event from Axios to track the
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
	console.log(
		"Upload file " + fileName + " Status",
		res.status,
		"Permissions",
		res.data.permissions
	);

	/** 
	 If using service account,
	 Changing ownership of file to shared drive owner
	 */

	/*
	 GOOGLE DOES NOT ALLOW TO CHANGE OWNERSHIP FROM SERVICE ACCOUNT TO SOME USER
	 
	*/
	if (serviceAccount && res.data?.permissions) {
		console.log(
			"Using serviceaccount, changing owner of the file to drive owner"
		);
		const userPermission = res.data.permissions.find(
			(p) => p.emailAddress && p.emailAddress !== process.env.SERVICE_ACCOUNT
		);
		const serviceAccountPermission = res.data.permissions.find(
			(p) => p.emailAddress === process.env.SERVICE_ACCOUNT
		);

		console.log("service account permissions", serviceAccountPermission);
		console.log("users permissions", userPermission);

		const permissionres = await drive.permissions.update({
			fileId: res.data.id!!,
			permissionId: userPermission?.id!!,
			transferOwnership: true,
			fields: "id",
			requestBody: {
				//type: "user",
				role: "owner",
				//emailAddress: userPermission!!.emailAddress,
			},
			supportsAllDrives: true,
		});
		//const permissionres = await drive.permissions.create({
		//	fileId: res.data.id!!,
		//	transferOwnership: true,
		//	fields: "id",
		//	requestBody: {
		//		type: "user",
		//		role: "owner",
		//		emailAddress: userPermission?.emailAddress,
		//	},
		//});

		console.log("Change permissions Status:", permissionres);
	}

	if (res.data?.id) {
		//GoogleApi Returns 500 status - Error if creating new file with thumbnaillink and webcontentlink fields
		//Extra request here to get those fields
		console.log("Getting file details by fileid ", res.data.id);

		const queryfiles = await drive.files.get({
			fileId: res.data.id,
			fields: "id,name,thumbnailLink,webContentLink",
			supportsAllDrives: true,
		});

		console.log("Getting file details by fileid status ", res.status);

		return queryfiles.data;
	}
	return res.data;
};
