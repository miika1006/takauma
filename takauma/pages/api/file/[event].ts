import { FromBase64ToEmailAndFolder } from "./../../../lib/event";
import {
	GetGoogleDriveFilesByFolderId,
	GetGoogleDriveFolderById,
	CreateResumableUploadSession,
	GetGoogleDriveFileDetails,
} from "../../../lib/googledrive";
import sanitize from "sanitize-filename";
import type { NextApiRequest, NextApiResponse } from "next";
import { dynamo } from "../../../lib/dynamo-db";

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
	// Create a Drive resumable-upload session.  Returns { uploadUri } — a
	// pre-authenticated, file-specific URL the browser uses to PUT the image
	// bytes directly to Google's servers.  No file bytes pass through this
	// function, so Vercel's timeout and body-size limits are not a concern.
	if (req.method === "POST") {
		try {
			const { fileName, mimeType } = req.body as {
				fileName?: string;
				mimeType?: string;
			};

			const safeFileName = sanitize(fileName ?? "").trim();
			if (!safeFileName) return res.status(400).send("fileName is required");

			const safeMime =
				["image/jpeg", "image/png", "image/webp"].includes(mimeType ?? "")
					? (mimeType as string)
					: "image/jpeg";

			const uploadUri = await CreateResumableUploadSession(
				user.accessToken,
				user.refreshToken,
				folderid as string,
				safeFileName,
				safeMime
			);

			if (!uploadUri)
				return res.status(500).send("Failed to create upload session");

			return res.status(200).json({ uploadUri });
		} catch (error) {
			console.error("POST /api/file session error", error);
			return res.status(400).send("Bad request");
		}
	}

	return res.status(405).send("Method not allowed");
}
