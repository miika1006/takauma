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
	image: File;
	objectUrl: string;
}

// Max dimension for resized images sent to the server.
const MAX_DIMENSION = 2048;
// JPEG quality (0–100). 82 is a good balance between quality and file size.
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
	const [resizing, setResizing] = useState<boolean>(false);
	const [formOpened, setFormOpened] = useState<boolean>(defaultOpen);
	const [images, setImages] = useState<ImageSelect[] | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setFormOpened(defaultOpen);
	}, [defaultOpen]);

	const setToPagePreview = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!event.target.files || event.target.files.length === 0) return;

		const selectedFiles = Array.from(event.target.files);
		setResizing(true);
		const resized: ImageSelect[] = [];

		try {
			for (const file of selectedFiles) {
				const resizedFile = await resizeImage(file);
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

	const upload = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!images?.length || !folder?.id) return;

		setLoading(true);

		// Upload in batches of 4 to avoid overwhelming the server.
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
		// Signal parent to re-fetch from Drive so thumbnails generated server-side
		// are picked up (Drive takes a moment to generate them after upload).
		onUploadsComplete();
	};

	/**
	 * Resize an image before upload.
	 *
	 * - All formats are converted to JPEG (far smaller than PNG for photos).
	 * - Max dimension 2048 px, quality 82.
	 * - EXIF rotation is preserved (Resizer handles it via the rotation param).
	 */
	const resizeImage = (file: File): Promise<File> => {
		return new Promise((resolve, reject) => {
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
		});
	};

	const uploadImage = async (imageselect: ImageSelect) => {
		try {
			const event = FromEmailAndFolderTooBase64(email, folder.id as string);
			const body = new FormData();
			body.append("file", imageselect.image, imageselect.image.name);
			body.append("eventName", folder.name ?? "");

			const response = await fetch(`/api/file/${event}`, {
				method: "POST",
				body,
			});

			if (!response.ok) {
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("upload error", msg);
				return;
			}

			const newFile: drive_v3.Schema$File = await response.json();
			removeLoadedImage(imageselect.id);

			// Drive takes time to generate thumbnailLink after upload.
			// Use the local blob URL as a fallback so the image appears immediately.
			add({
				...newFile,
				thumbnailLink: newFile.thumbnailLink ?? imageselect.objectUrl,
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
