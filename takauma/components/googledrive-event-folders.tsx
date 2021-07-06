import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import Loading from "../components/loading";
import { showErrorToast } from "../components/toast";
import GoogleDriveEventShare from "./googledrive-event-share";
import GoogleDriveEventDelete from "./googledrive-event-delete";
import styles from "../styles/googledrive-event-folders.module.css";
interface GoogleDriveEventFoldersProps {
	t: TFunction;
	current: drive_v3.Schema$File | null;
	folders: drive_v3.Schema$File[];
	select: (folder: drive_v3.Schema$File | null) => void;
	refresh: (folders: drive_v3.Schema$File[]) => void;
	remove: (id: string | null | undefined) => void;
	update: (folder: drive_v3.Schema$File) => void;
}

export default function GoogleDriveEventFolders({
	t,
	select,
	refresh,
	remove,
	update,
	current,
	folders,
}: GoogleDriveEventFoldersProps) {
	const [loading, setLoading] = useLoadingIndicator(true);

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
					if (folders) refresh(folders);
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
	}, [refresh, setLoading, t]);

	return (
		<div className={styles.events}>
			{folders.map((folder) => (
				<div
					key={folder.id}
					className={
						styles.event +
						(folder.id === current?.id ? ` ${styles.active}` : "")
					}
					onClick={
						folder.name !== current?.name ? () => select(folder) : undefined
					}
				>
					<div className={styles.eventhead}>
						<h2>{folder.name}</h2>

						<div className={styles.controls}>
							{folder.name !== current?.name && (
								<button onClick={() => select(folder)}>{t("select")}</button>
							)}
							<GoogleDriveEventDelete
								t={t}
								folder={folder}
								current={current}
								remove={remove}
								select={select}
							/>
						</div>
					</div>

					{current?.id === folder.id && (
						<GoogleDriveEventShare t={t} current={current} update={update} />
					)}
				</div>
			))}
			{loading && (
				<div className={styles.event}>
					<Loading />
				</div>
			)}
		</div>
	);
}
