import { drive_v3 } from "googleapis";
import { TFunction } from "../common/types";
import React, { useEffect, useRef, useState } from "react";
import { showErrorToast } from "../components/toast";
import styles from "../styles/googledriveupload-form.module.css";
import Loading from "./loading";
import { v4 as uuidv4 } from "uuid";
import { FromEmailAndFolderTooBase64 } from "../lib/event";
import Resizer from "react-image-file-resizer";

interface GoogleDriveUploadFormProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	email: string;
	add: (file: drive_v3.Schema$File) => void;
	onUploadsComplete: () => void;
	defaultOpen: boolean;
	loading: boolean;
	setLoading: (loading: boolean) => void;
}

interface ImageSelect {
	id: string;
	/** Resized JPEG File ready for upload. */
	image: File;
	/** Local blob URL for immediate gallery preview. */
	objectUrl: string;
}

// Max dimension (px) for the resized JPEG sent to Drive.
const MAX_DIMENSION = 2048;
// JPEG quality 0–100.  82 is visually identical to 95 but ~40 % smaller.
const JPEG_QUALITY = 82;

export default function GoogleDriveUploadForm({
	t,
	folder,
	email,
	add,
	onUploadsComplete,
	defaultOpen,
	loading,
	setLoading,
}: GoogleDriveUploadFormProps) {
	const [resizing, setResizing] = useState(false);
	const [formOpened, setFormOpened] = useState(defaultOpen);
	const [images, setImages] = useState<ImageSelect[] | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setFormOpened(defaultOpen);
	}, [defaultOpen]);

	const setToPagePreview = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!event.target.files?.length) return;
		const selectedFiles = Array.from(event.target.files);
		setResizing(true);
		const resized: ImageSelect[] = [];
		try {
			for (const file of selectedFiles) {
				const resizedFile = await resizeToJpeg(file);
				resized.push({
					id: uuidv4(),
					image: resizedFile,
					objectUrl: URL.createObjectURL(resizedFile),
				});
			}
			setImages(resized);
		} catch (error) {
			console.error("resize error", error);
			showErrorToast(t, t("image_resize_failed"));
		} finally {
			setResizing(false);
		}
	};

	const removeLoadedImage = (id: string) =>
		setImages((cur) => cur?.filter((i) => i.id !== id) ?? []);

	const upload = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!images?.length || !folder?.id) return;

		setLoading(true);

		// Upload at most 4 images concurrently.
		const batch: Promise<void>[] = [];
		for (const img of images) {
			batch.push(uploadImage(img));
			if (batch.length >= 4) {
				await Promise.all(batch);
				batch.splice(0, batch.length);
			}
		}
		if (batch.length > 0) await Promise.all(batch);

		if (fileInputRef.current) fileInputRef.current.value = "";
		setLoading(false);
		// Ask the gallery to re-fetch so it picks up server-generated thumbnailLinks
		// once Drive finishes processing the newly uploaded files.
		onUploadsComplete();
	};

	/**
	 * Resize any image to a JPEG before upload.
	 * Converting PNG / WEBP → JPEG dramatically reduces file size for photos.
	 * EXIF orientation is preserved via the rotation=0 (auto) parameter.
	 */
	const resizeToJpeg = (file: File): Promise<File> =>
		new Promise((resolve, reject) => {
			try {
				Resizer.imageFileResizer(
					file,
					MAX_DIMENSION,
					MAX_DIMENSION,
					"JPEG",
					JPEG_QUALITY,
					0, // auto-rotate from EXIF
					(resized) => resolve(resized as File),
					"file"
				);
			} catch (err) {
				reject(err);
			}
		});

	/**
	 * Upload a single image via three lightweight server round-trips:
	 *
	 * 1. POST /api/file/[event]          → server creates a Drive resumable-upload
	 *                                       session using the owner's OAuth tokens
	 *                                       and returns { uploadUri }.
	 *
	 * 2. PUT  {uploadUri}  (googleapis)  → browser streams bytes directly to
	 *                                       Google.  No bytes pass through Vercel.
	 *                                       Drive returns { id, name }.
	 *
	 * 3. GET  /api/file/[event]?fileId=  → server fetches thumbnailLink /
	 *                                       webContentLink from Drive and returns
	 *                                       the full file metadata.
	 */
	const uploadImage = async (imageselect: ImageSelect) => {
		const eventId = FromEmailAndFolderTooBase64(email, folder.id as string);

		try {
			// ── Step 1: Create resumable session ──────────────────────────────
			const sessionRes = await fetch(`/api/file/${eventId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fileName: imageselect.image.name || "image.jpg",
					mimeType: "image/jpeg",
				}),
			});

			if (!sessionRes.ok) {
				const msg = sessionRes.statusText + " " + (await sessionRes.text());
				showErrorToast(t, msg);
				console.error("session error", msg);
				return;
			}

			const { uploadUri } = (await sessionRes.json()) as { uploadUri: string };

			// ── Step 2: Upload directly to Drive ───────────────────────────────
			// Drive's resumable URI is pre-authenticated — no Authorization header
			// needed.  The browser streams bytes straight to Google's servers.
			const driveRes = await fetch(uploadUri, {
				method: "PUT",
				headers: { "Content-Type": "image/jpeg" },
				body: imageselect.image,
			});

			if (!driveRes.ok) {
				const msg = `Drive upload failed: ${driveRes.status}`;
				showErrorToast(t, msg);
				console.error(msg);
				return;
			}

			const { id: fileId } = (await driveRes.json()) as { id: string; name: string };

			// ── Step 3: Fetch file metadata (thumbnailLink etc.) ───────────────
			// thumbnailLink is usually not ready immediately — use the local blob
			// URL as an instant fallback and let the post-upload re-fetch update it.
			let fileDetails: drive_v3.Schema$File = { id: fileId };
			try {
				const detailsRes = await fetch(
					`/api/file/${eventId}?fileId=${encodeURIComponent(fileId)}`
				);
				if (detailsRes.ok) fileDetails = await detailsRes.json();
			} catch {
				// Non-fatal — gallery will refresh via onUploadsComplete()
			}

			removeLoadedImage(imageselect.id);
			add({
				...fileDetails,
				thumbnailLink: fileDetails.thumbnailLink ?? imageselect.objectUrl,
			});
		} catch (error) {
			console.error("upload error", error);
			showErrorToast(
				t,
				error instanceof Error ? error.message : "upload error"
			);
		}
	};

	return (
		<div className={styles.uploadcontainer}>
			{!formOpened && (
				<button
					className={styles.uploadopener}
					type="button"
					onClick={() => setFormOpened((c) => !c)}
				>
					{t("upload_photos")} {loading && <Loading />}
				</button>
			)}
			{formOpened && (
				<>
					<div className={styles.uploadqueue}>
						{images?.map((image, idx) => (
							<img
								key={`imageurl-${idx}`}
								className={styles.thumbnail}
								alt="preview"
								src={image.objectUrl}
							/>
						))}
						<br />
						{images?.length ?? 0}{" "}
						{loading ? t("sending") : t("ready_for_send")}{" "}
						{resizing && t("resizing")}
					</div>
					{loading || resizing ? (
						<div className={styles.uploadform}>
							<Loading />
						</div>
					) : (
						<form onSubmit={upload} className={styles.uploadform}>
							<label
								htmlFor="photo-upload-field"
								className={"button " + styles.fileuploadselect}
							>
								{t("select_photos_from_your_device")}
							</label>
							<input
								type="file"
								id="photo-upload-field"
								multiple
								accept="image/*"
								ref={fileInputRef}
								onChange={setToPagePreview}
							/>
							<button type="submit">{t("upload")}</button>

							<details className={styles.helpdetails}>
								<summary>{t("do_you_need_help")}</summary>
								<h4>{t("selectimages")}</h4>
								<p>
									<small>{t("selectimages_desc")}</small>
								</p>
							</details>
						</form>
					)}
				</>
			)}
		</div>
	);
}
