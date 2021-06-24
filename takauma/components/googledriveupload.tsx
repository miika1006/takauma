import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/googledriveupload.module.css";
interface GoogleDriveUploadProps {
	t: TFunction;
	folders: drive_v3.Schema$File[];
}

export default function GoogleDriveUpload({
	t,
	folders,
}: GoogleDriveUploadProps) {
	const [image, setImage] = useState<File | null>(null);
	const [currentEventName, setCurrentEventName] = useState<string>("");
	const [createEventName, setCreateEventName] = useState<string>("");
	const [createObjectURL, setCreateObjectURL] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [driveFiles, setDriveFiles] = useState<drive_v3.Schema$File[]>([]);
	const [driveFolders, setDriveFolder] =
		useState<drive_v3.Schema$File[]>(folders);

	useEffect(() => {
		getFiles(currentEventName);
	}, [currentEventName]);

	const getFiles = async (eventName: string) => {
		try {
			if (eventName === "") return;
			const response = await fetch(
				`/api/file?eventname=${encodeURIComponent(eventName)}`,
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					method: "GET",
				}
			).then((r) => r.json());
			console.log("getFiles response", response);
			setDriveFiles(response);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
		}
	};

	const uploadToClient = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const imagefile = event.target.files[0];
			setImage(imagefile);
			setCreateObjectURL(URL.createObjectURL(imagefile));
		}
	};
	const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			if (createEventName === "") return;
			const response = await fetch("/api/folder", {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "POST",
				body: JSON.stringify({ name: createEventName }),
			}).then((r) => r.json());
			console.log("createEvent response", response);
			setCreateEventName("");
			setDriveFolder((current) => [...current, response]);
			setCurrentEventName(response.name);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
		}
	};
	const upload = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			if (image == null) return;
			if (currentEventName === "") return;
			const body = new FormData();
			body.append("file", image);
			body.append("eventName", currentEventName);
			const response = await fetch("/api/file", {
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
	const selectEvent = (foldername: string) => () => {
		setCurrentEventName(foldername);
	};
	return (
		<>
			{driveFolders.map((folder, index) => (
				<div key={folder.id}>
					{folder.name}
					{folder.name !== currentEventName && (
						<button onClick={selectEvent(folder.name ?? "")}>
							{t("select")}
						</button>
					)}
				</div>
			))}
			<form onSubmit={createEvent}>
				<h4>{t("createnewevent")}</h4>
				<input
					type="text"
					value={createEventName}
					onChange={(e) => setCreateEventName(e.target.value)}
				/>
				<button type="submit">{t("save")}</button>
			</form>
			<hr />
			{driveFiles.map((file, index) => (
				<img
					key={`thumb-${file.id}`}
					className={styles.thumbnail}
					alt={`image ${file.id ?? ""}`}
					/*src={`https://www.googleapis.com/drive/v3/files/${
							file.id ?? ""
						}/export?mimeType=${file.mimeType}`}*/
					//src={file.webContentLink ?? ""}
					src={file.thumbnailLink ?? ""}

					//TODO: Google cannot keep up, and crashes
				/>
			))}

			{currentEventName != "" && (
				<form onSubmit={upload}>
					<input type="hidden" value={currentEventName} />
					<h4>{t("selectimage")}</h4>
					{createObjectURL != "" && (
						<img
							className={styles.thumbnail}
							alt="image"
							src={createObjectURL}
						/>
					)}
					<input type="file" ref={fileInputRef} onChange={uploadToClient} />
					<button type="submit">{t("upload")}</button>
				</form>
			)}
		</>
	);
}
