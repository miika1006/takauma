import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useRouter } from "next/router";
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
	const [currentEvent, setCurrentEvent] =
		useState<drive_v3.Schema$File | null>(null);
	const [createEventName, setCreateEventName] = useState<string>("");
	const [createObjectURL, setCreateObjectURL] = useState<string>("");
	const [shared, setShared] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [driveFiles, setDriveFiles] = useState<drive_v3.Schema$File[]>([]);
	const [driveFolders, setDriveFolders] =
		useState<drive_v3.Schema$File[]>(folders);
	const [shareUrl, setShareUrl] = useState<string>();
	const router = useRouter();

	useEffect(() => {
		if (currentEvent) {
			getFiles(currentEvent?.name ?? "");
			setShared(currentEvent.shared ?? false);
			setShareUrl(
				window?.location?.origin + router.pathname + "/" + currentEvent?.id
			);
		}
	}, [currentEvent]);

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

	const setToPagePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
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
			//Try not to create multiple events with same name
			//TODO: Notify user
			if (driveFolders.some((f) => f.name === createEventName)) return;

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

			//Add to folder list if it does not exist with same id already
			if (driveFolders.some((f) => f.id !== response.id)) {
				setDriveFolders((current) => [...current, response]);
			}
			setCurrentEvent(response);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
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
	/**
	  TODO:
			1. Call api with folderId to share
			2. On server side, share current folder by id to service account 
			3. Create app sharelink that is accessable without authentication
			   Link contains information: folderId that is shared and some salt?
			4. A user opens the link, link contains parameter
			5. Server gets parameter, extracts folderId from it
			6. Server loads folder and containing images to page using service account with shared rights
			7. A user now can view images without auth
			8. A user now can upload new image without auth
			   Image is received on serverside and uploaded to given folderId using service account with shared rights to folder
			
			TODO: Handle exceptions
			- Folder is not found by folderid, show error/info on sharelink
			- Folder is unshared
			  Remove share from service account?
	 * @param event 
	 */
	const onShare = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSharedState = !shared;
		setShared(newSharedState);
		try {
			if (currentEvent == null || currentEvent.id === "") return;
			const response = await fetch("/api/folder/share", {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "PUT",
				body: JSON.stringify({
					folderId: currentEvent.id,
					share: newSharedState,
				}),
			}).then((r) => r.json());

			console.log("onShare response", response);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
			setShared(!newSharedState);
		}
	};
	const deleteEvent = (folder: drive_v3.Schema$File) => async () => {
		try {
			const response = await fetch("/api/folder", {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "DELETE",
				body: JSON.stringify({
					folderId: folder.id,
				}),
			});
			setDriveFolders((currentFolders) =>
				currentFolders.filter((f) => f.id != folder.id)
			);
			console.log("onDelete response", response);
		} catch (error) {
			//TODO: Throw toast
			console.error(error);
		}
	};
	const selectEvent = (folder: drive_v3.Schema$File) => () => {
		setCurrentEvent(folder);
	};
	return (
		<>
			{driveFolders.map((folder) => (
				<div key={folder.id}>
					{folder.name}
					{folder.name !== currentEvent?.name && (
						<button onClick={selectEvent(folder)}>{t("select")}</button>
					)}

					<button onClick={deleteEvent(folder)}>{t("delete")}</button>
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

			{currentEvent && <hr />}
			{currentEvent && (
				<label>
					<input type="checkbox" checked={shared} onChange={onShare} />
					{t("sharealink")}
				</label>
			)}
			<br />
			<br />
			{shared && (
				<input type="text" style={{ width: "100%" }} value={shareUrl} />
			)}

			<br />
			<br />
			<a href={shareUrl} target="_blank" rel="noopener noreferrer">
				Avaa linkki ja aloita lataamaan kuvia
			</a>

			<br />
			<br />
			{driveFiles.map((file) => (
				<img
					key={`thumb-${file.id}`}
					className={styles.thumbnail}
					alt={`image ${file.id ?? ""}`}
					//src={`https://www.googleapis.com/drive/v3/files/${
					//		file.id ?? ""
					//	}/export?mimeType=${file.mimeType}`}
					//src={file.webContentLink ?? ""}
					src={file.thumbnailLink ?? ""}

					//TODO: Google cannot keep up, and crashes
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
