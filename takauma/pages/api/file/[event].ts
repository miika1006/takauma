import { FromBase64ToEmailAndFolder } from "./../../../lib/event";
import {
	GetGoogleDriveFilesByFolderId,
	GetGoogleDriveFolderById,
	GetGoogleDriveFileDetails,
	UploadFileDataToDrive,
} from "../../../lib/googledrive";
import sanitize from "sanitize-filename";
import type { NextApiRequest, NextApiResponse } from "next";
import { dynamo } from "../../../lib/dynamo-db";

export const config = {
	api: {
		bodyParser: {
			sizeLimit: "6mb",
		},
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { event, fileId } = req.query;
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

	// ── GET /api/file/[event]?fileId=xxx ─────────────────────────────────────
	// Fetch metadata for a single file after the browser has uploaded it
	// directly to Drive via the resumable-upload URI.
	if (req.method === "GET" && fileId) {
		// Google Drive file IDs are base64url strings, 25–200 alphanumeric
		// characters (plus hyphens and underscores).  Reject anything that
		// doesn't match so a crafted fileId cannot influence the Drive API URL.
		const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,200}$/;
		if (!DRIVE_ID_RE.test(fileId as string)) {
			return res.status(400).send("Invalid fileId");
		}

		try {
			const file = await GetGoogleDriveFileDetails(
				user.accessToken,
				user.refreshToken,
				fileId as string
			);
			if (!file) return res.status(404).send("File not found");
			return res.status(200).json({
				id: file.id,
				name: file.name,
				webContentLink: file.webContentLink ?? null,
				thumbnailLink: file.thumbnailLink ?? null,
				imageMediaMetadata: {
					width: file.imageMediaMetadata?.width,
					height: file.imageMediaMetadata?.height,
					rotation: file.imageMediaMetadata?.rotation,
				},
			});
		} catch (error) {
			console.error("GET /api/file details error", error);
			return res.status(400).send("Bad request");
		}
	}

	// ── GET /api/file/[event] ────────────────────────────────────────────────
	// List all photos in the event folder.
	if (req.method === "GET") {
		try {
			const result = await GetGoogleDriveFilesByFolderId(
				user.accessToken,
				user.refreshToken,
				folderid as string
			);
			return res.status(200).json(
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
			console.error("GET /api/file list error", error);
			return res.status(400).send("Bad request");
		}
	}

	// ── POST /api/file/[event] ───────────────────────────────────────────────
	// Upload a photo.  The browser sends { fileName, mimeType, data } where
	// data is a base64-encoded JPEG.  The server uploads to Drive on the
	// owner's behalf and returns the file metadata.
	if (req.method === "POST") {
		try {
			const { fileName, mimeType, data } = req.body as {
				fileName?: string;
				mimeType?: string;
				data?: string;
			};

			const safeFileName = sanitize(fileName ?? "").trim() || "image.jpg";

			// Only accept JPEG (all images are resized to JPEG client-side).
			const safeMime = mimeType === "image/jpeg" ? "image/jpeg" : "image/jpeg";

			if (!data || typeof data !== "string")
				return res.status(400).send("data is required");

			const fileBuffer = Buffer.from(data, "base64");
			if (fileBuffer.length === 0)
				return res.status(400).send("data is empty");

			const uploaded = await UploadFileDataToDrive(
				user.accessToken,
				user.refreshToken,
				folderid as string,
				safeFileName,
				safeMime,
				fileBuffer
			);

			if (!uploaded?.id)
				return res.status(500).send("Upload failed");

			return res.status(200).json({
				id: uploaded.id,
				name: uploaded.name,
				webContentLink: uploaded.webContentLink ?? null,
				thumbnailLink: uploaded.thumbnailLink ?? null,
				imageMediaMetadata: {
					width: uploaded.imageMediaMetadata?.width,
					height: uploaded.imageMediaMetadata?.height,
					rotation: uploaded.imageMediaMetadata?.rotation,
				},
			});
		} catch (error) {
			console.error("POST /api/file upload error", error);
			return res.status(400).send("Bad request");
		}
	}

	return res.status(405).send("Method not allowed");
}
