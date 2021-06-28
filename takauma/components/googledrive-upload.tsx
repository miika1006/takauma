import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/googledriveupload.module.css";
interface GoogleDriveUploadProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
}

export default function GoogleDriveUpload({
	t,
	folder,
}: GoogleDriveUploadProps) {
	const [image, setImage] = useState<File | null>(null);
	const currentEvent = folder;
	const [createObjectURL, setCreateObjectURL] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [driveFiles, setDriveFiles] = useState<drive_v3.Schema$File[]>([]);

	useEffect(() => {
		getFiles(currentEvent?.name ?? "");
	}, [currentEvent]);

	const getFiles = async (eventName: string) => {
		try {
			if (eventName === "") return;
			const response = await fetch(`/api/file/${folder.id}`, {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "GET",
			}).then((r) => r.json());
			console.log("getFiles response", response);
			setDriveFiles(response);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
		}
	};

	const setToPagePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const imagefile = event.target.files[0];
			setImage(imagefile);
			setCreateObjectURL(URL.createObjectURL(imagefile));
		}
	};

	const upload = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			if (image == null) return;
			if (currentEvent === null || currentEvent.name === "") return;
			const body = new FormData();
			body.append("file", image);
			body.append("eventName", currentEvent.name ?? "");
			const response = await fetch(`/api/file/${folder.id}`, {
				method: "POST",
				body,
			}).then((r) => r.json());
			setImage(null);
			console.log("upload response", response);
			setDriveFiles((current) => [...current, response]);
			setCreateObjectURL("");
			if (fileInputRef?.current) fileInputRef.current.value = "";
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
		}
	};

	return (
		<>
			{driveFiles.map((file) => (
				<img
					key={`thumb-${file.id}`}
					className={styles.thumbnail}
					alt={`image ${file.id ?? ""}`}
					/*src={`https://www.googleapis.com/drive/v3/files/${
							file.id ?? ""
						}/export?mimeType=${file.mimeType}`}*/
					//src={file.webContentLink ?? ""}
					src={file.thumbnailLink ?? ""}
				/>
			))}

			{currentEvent && (
				<form onSubmit={upload}>
					<h4>{t("selectimage")}</h4>
					{createObjectURL != "" && (
						<img
							className={styles.thumbnail}
							alt="image"
							src={createObjectURL}
						/>
					)}
					<input type="file" ref={fileInputRef} onChange={setToPagePreview} />
					<button type="submit">{t("upload")}</button>
				</form>
			)}
		</>
	);
}