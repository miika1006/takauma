import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
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
	defaultOpen: boolean;
	loading: boolean;
	setLoading: (loading: boolean) => void;
}

interface ImageSelect {
	id: string;
	image: File;
	objectUrl: string;
}

export default function GoogleDriveUploadForm({
	t,
	folder,
	email,
	add,
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
		if (event.target.files && event.target.files.length > 0) {
			//First resize images
			const selectedImageFiles = Array.from(event.target.files ?? []);
			const resizedImages = [];
			if (selectedImageFiles.length > 0) {
				setResizing(true);
			}

			try {
				for (let x = 0; x < selectedImageFiles.length; x++) {
					//Resize one image at a time, just to make sure nothing crashes :)
					resizedImages.push(await resizeImage(selectedImageFiles[x]));
				}

				setImages(
					resizedImages.map((i) => {
						return {
							id: uuidv4(),
							image: i,
							objectUrl: URL.createObjectURL(i),
						};
					})
				);

				setResizing(false);
			} catch (error) {
				console.error("resize error", error);
				showErrorToast(t, t("image_resize_failed"));
				setResizing(false);
			}
		}
	};

	const removeLoadedImage = (id: string) =>
		setImages(
			(currentImages) => currentImages?.filter((i) => i.id !== id) ?? []
		);
	const upload = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (
			images === null ||
			images.length === 0 ||
			folder === null ||
			folder.name === ""
		)
			return;

		setLoading(true);

		const uploadPromises = [];
		for (let x = 0; x < images.length; x++) {
			uploadPromises.push(uploadImage(images[x]));
			if (uploadPromises.length > 4) {
				console.log("5 promises, waiting ");
				await Promise.all(uploadPromises);
				console.log("cleared wait promises ");
				uploadPromises.splice(0, uploadPromises.length);
			}
		}
		if (uploadPromises.length > 0) await Promise.all(uploadPromises);

		if (fileInputRef?.current) fileInputRef.current.value = "";
		setLoading(false);
	};

	const resizeImage = async (file: File): Promise<File> => {
		const imageFormat =
			file.type.toLowerCase() === "image/jpeg"
				? "JPEG"
				: file.type.toLowerCase() === "image/png"
				? "PNG"
				: file.type.toLowerCase() === "image/webp"
				? "WEBP"
				: ""; //If empty, then image cannot be resized, then dont.

		return imageFormat === ""
			? Promise.resolve(file)
			: resize(file, imageFormat);
	};
	const resize = (
		file: File,
		format: "JPEG" | "PNG" | "WEBP"
	): Promise<File> => {
		return new Promise((resolve) => {
			Resizer.imageFileResizer(
				file,
				1920,
				1920,
				format,
				95,
				0,
				(resizedImage) => {
					console.log("Resized", resizedImage);
					resolve(resizedImage as File);
				},
				"file"
			);
		});
	};
	const uploadImage = async (imageselect: ImageSelect) => {
		try {
			const event = FromEmailAndFolderTooBase64(email, folder.id as string);
			const body = new FormData();
			body.append("file", imageselect.image);
			body.append("eventName", folder.name ?? "");
			const response = await fetch(`/api/file/${event}`, {
				method: "POST",
				body,
			});
			if (!response.ok) {
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("upload error", msg);
			} else {
				const newFile = await response.json();
				removeLoadedImage(imageselect.id);
				add(newFile);
			}
			console.log("upload response", response);
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
					{t<string>("upload_photos")}
				</button>
			)}
			{formOpened && (
				<>
					<div className={styles.uploadqueue}>
						{images?.map((image, idx) => (
							<img
								key={`imageurl-${idx}`}
								className={styles.thumbnail}
								alt="image"
								src={image.objectUrl}
							/>
						))}
						<br />
						{images?.length ?? 0}{" "}
						{loading ? t<string>("sending") : t<string>("ready_for_send")}{" "}
						{resizing && t<string>("resizing")}
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
								{t<string>("select_photos_from_your_device")}
							</label>
							<input
								type="file"
								id="photo-upload-field"
								multiple
								accept="image/*"
								ref={fileInputRef}
								onChange={setToPagePreview}
							/>
							<button type="submit">{t<string>("upload")}</button>

							<details className={styles.helpdetails}>
								<summary>{t<string>("do_you_need_help")}</summary>
								<h4>{t<string>("selectimages")}</h4>
								<p>
									<small>{t<string>("selectimages_desc")}</small>
								</p>
							</details>
						</form>
					)}
				</>
			)}
		</div>
	);
}
