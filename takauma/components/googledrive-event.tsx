import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import Loading from "../components/loading";
import { showErrorToast, showWarningToast } from "../components/toast";

interface GoogleDriveEventProps {
	t: TFunction;
	folders: drive_v3.Schema$File[];
}

export default function GoogleDriveEvent({
	t,
	folders,
}: GoogleDriveEventProps) {
	const [loading, setLoading] = useLoadingIndicator(true);
	const [currentEvent, setCurrentEvent] = useState<drive_v3.Schema$File | null>(
		null
	);
	const [createEventName, setCreateEventName] = useState<string>("");
	const [shared, setShared] = useState<boolean>(false);
	const [driveFolders, setDriveFolders] =
		useState<drive_v3.Schema$File[]>(folders);
	const [shareUrl, setShareUrl] = useState<string>();
	const router = useRouter();

	useEffect(() => {
		if (currentEvent) {
			setShared(currentEvent.shared ?? false);
			setShareUrl(
				window?.location?.origin + router.pathname + "/" + currentEvent?.id
			);
		}
	}, [currentEvent, router.pathname]);

	useEffect(() => {
		/**
		 * Load list of folders from api
		 */
		const loadFolders = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/folder", {
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					method: "GET",
				});

				if (!response.ok) {
					const msg = response.statusText + " " + (await response.text());
					showErrorToast(t, msg);
					console.error("loadFolders error", msg);
				} else {
					const folders = (await response.json()) as drive_v3.Schema$File[];
					if (folders) setDriveFolders(folders);
					else console.error("loadFolders: Failed to cast response to files");
				}

				console.log("loadFolders: response", response);
			} catch (error) {
				console.error("loadFolders error", error);
				showErrorToast(t, error.message);
			} finally {
				setLoading(false);
			}
		};

		loadFolders();
	}, [setLoading, t]);

	/**
	 * Creating new event
	 * Create new event with given createEventName value
	 * 1. Call Api to create event
	 * 2. Server creates new folder to Google Drive and shares it to service account
	 * 3. Returns result
	 * @param event
	 * @returns
	 */
	const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			if (createEventName === "") return;

			setLoading(true);

			if (
				driveFolders.some(
					(f) =>
						f.name?.toLowerCase().trim() ===
						createEventName.toLowerCase().trim()
				)
			) {
				showWarningToast(t, t("eventexists"));
				return;
			}

			const response = await fetch("/api/folder", {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "POST",
				body: JSON.stringify({ name: createEventName }),
			});

			if (!response.ok) {
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("createEvent error", msg);
			} else {
				setCreateEventName("");
				const folder = await response.json();
				//Add to folder list if it does not exist with same id already
				const exists = driveFolders.find((f) => f.id === folder.id);
				if (exists) {
					console.log("event exists, ignoring");
				} else {
					setDriveFolders((current) => [...current, folder]);
				}
				setCurrentEvent(folder);
			}
			console.log("createEvent response", response);
		} catch (error) {
			console.error("createEvent error", error);
			showErrorToast(t, error.message);
		} finally {
			setLoading(false);
		}
	};

	/**
	 *  Sharing and what happens after that?
	 * 	1. Call api with folderId to share and true|false if sharing
	 *	2. On server side, share current folder by id to anyone
	 *	3. Create app sharelink that is accessable without authentication
	 *	   Link contains information: folderId that is shared and some salt?
	 *	4. A user opens the link, link contains parameter(s)
	 *	5. Server gets parameter(s), extracts folderId from it
	 *	6. Server loads folder and containing images to page using service account
	 *	7. A user now can view images without auth
	 *	8. A user now can upload new image without auth
	 *	   Image is received on serverside and uploaded to given folderId using service account with shared rights to folder
	 * @param event
	 */
	const onShare = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSharedState = !shared;
		setShared(newSharedState);
		try {
			if (currentEvent == null || currentEvent.id === "") return;

			setLoading(true);
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
			});

			if (!response.ok) {
				setShared(false);
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("onShare error", msg);
			}

			console.log("onShare response", response);
		} catch (error) {
			console.error("onShare error", error);
			showErrorToast(t, error.message);
			setShared(!newSharedState);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Deleting evnt
	 * 1. Call api with folderId to delete
	 * 2. Server deletes Google Drive folder
	 * 3. If folder contains some files uploaded with service account.
	 *    Delete will fail.
	 *    User should go to Google Drive and do cleanup there if needed.
	 * @param folder (id,name)
	 * @returns
	 */
	const deleteEvent = (folder: drive_v3.Schema$File) => async () => {
		try {
			setLoading(true);
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

			if (response.ok) {
				if (currentEvent?.id === folder.id) {
					setCurrentEvent(null);
				}
				setDriveFolders((currentFolders) =>
					currentFolders.filter((f) => f.id != folder.id)
				);
			} else {
				const errormsg =
					response.status +
					" " +
					response.statusText +
					" " +
					(await response.text());
				showErrorToast(t, errormsg, t("foldermaycontain"));
				console.error(
					"onDelete error",
					`${t("foldermaycontain")} [${errormsg}]`
				);
			}
			console.log("onDelete response", response);
		} catch (error) {
			console.error("onDelete error", error);
			showErrorToast(t, error.message);
		} finally {
			setLoading(false);
		}
	};
	/**
	 * Set a event as active and selected for editing/sharing
	 * @param folder
	 * @returns
	 */
	const selectEvent = (folder: drive_v3.Schema$File) => () => {
		setCurrentEvent(folder);
	};
	return (
		<>
			{loading && <Loading />}
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
			{shared && (
				<a href={shareUrl} target="_blank" rel="noopener noreferrer">
					{t("opensharelinkinfo")}
				</a>
			)}
		</>
	);
}
