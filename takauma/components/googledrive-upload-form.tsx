import { NullableBoolean } from "aws-sdk/clients/xray";
import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import React, { useEffect, useRef, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import { showErrorToast } from "../components/toast";
import styles from "../styles/googledriveupload-form.module.css";
import Loading from "./loading";
import { v4 as uuidv4 } from "uuid";

interface GoogleDriveUploadFormProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	add: (file: drive_v3.Schema$File) => void;
}

interface ImageSelect {
	id: string;
	image: File;
	objectUrl: string;
}

export default function GoogleDriveUploadForm({
	t,
	folder,
	add,
}: GoogleDriveUploadFormProps) {
	const [loading, setLoading] = useLoadingIndicator(false, 1);
	const [images, setImages] = useState<ImageSelect[] | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const setToPagePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			setImages(
				Array.from(event.target.files ?? []).map((i) => {
					return {
						id: uuidv4(),
						image: i,
						objectUrl: URL.createObjectURL(i),
					};
				})
			);
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
	const uploadImage = async (imageselect: ImageSelect) => {
		try {
			const body = new FormData();
			body.append("file", imageselect.image);
			body.append("eventName", folder.name ?? "");
			const response = await fetch(`/api/file/${folder.id}`, {
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
		<>
			<div>
				{images?.map((image, idx) => (
					<img
						key={`imageurl-${idx}`}
						className={styles.thumbnail}
						alt="image"
						src={image.objectUrl}
					/>
				))}
			</div>
			{loading ? (
				<div className={styles.uploadform}>
					<Loading />
				</div>
			) : (
				<form onSubmit={upload} className={styles.uploadform}>
					<h4>{t("selectimages")}</h4>

					<input
						type="file"
						multiple
						ref={fileInputRef}
						onChange={setToPagePreview}
					/>
					<button type="submit">{t("upload")}</button>
				</form>
			)}
		</>
	);
}
