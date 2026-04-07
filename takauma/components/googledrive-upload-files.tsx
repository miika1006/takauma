import { drive_v3 } from "googleapis";
import { TFunction } from "../common/types";
import { useCallback, useEffect, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import { FromEmailAndFolderTooBase64 } from "../lib/event";
import styles from "../styles/googledriveupload-files.module.css";
import Slider, { SliderItem } from "./slider";
import { showErrorToast } from "./toast";
import usePrevious from "../common/hooks/use-previous";

interface GoogleDriveUploadFilesProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	files: drive_v3.Schema$File[];
	refresh: (folders: drive_v3.Schema$File[]) => void;
	email: string;
	loading: boolean;
	/** Increment this value to force a re-fetch from the Drive API. */
	refreshTrigger?: number;
}

export default function GoogleDriveUploadFiles({
	t,
	folder,
	files,
	refresh,
	email,
	loading,
	refreshTrigger,
}: GoogleDriveUploadFilesProps) {
	const prevFolder = usePrevious<drive_v3.Schema$File>(folder);
	const [loadingFiles, setLoadingFiles] = useLoadingIndicator(true, 1);

	const getFiles = useCallback(async () => {
		try {
			if (!folder.id) return;
			setLoadingFiles(true);
			const event = FromEmailAndFolderTooBase64(email, folder.id as string);
			const response = await fetch(`/api/file/${event}`, {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "GET",
			});

			if (!response.ok) {
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("getFiles error", msg);
			} else {
				refresh(await response.json());
			}
		} catch (error) {
			console.error("getFiles error", error);
			showErrorToast(
				t,
				error instanceof Error ? error.message : "get files error"
			);
		} finally {
			setLoadingFiles(false);
		}
	}, [email, folder.id, refresh, setLoadingFiles, t]);

	// Fetch on initial load and when the folder changes.
	useEffect(() => {
		if (folder && folder.name && prevFolder?.name !== folder.name) {
			getFiles();
		}
	}, [folder, folder.name, getFiles, prevFolder?.name]);

	// Re-fetch when the parent signals that new uploads have completed so we
	// get the server-side thumbnailLinks that Drive generates after a delay.
	useEffect(() => {
		if (refreshTrigger && refreshTrigger > 0) {
			getFiles();
		}
	}, [refreshTrigger, getFiles]);

	return (
		<div className={styles.event}>
			<Slider
				loading={loadingFiles || loading}
				t={t}
				items={files.map((f) => {
					const item: SliderItem = {
						id: f.id,
						thumbnailLink: f.thumbnailLink,
						webContentLink: f.webContentLink,
						imageMediaMetadata: {
							width: f.imageMediaMetadata?.width || undefined,
							height: f.imageMediaMetadata?.height || undefined,
						},
					};
					return item;
				})}
			/>
		</div>
	);
}
