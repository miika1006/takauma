import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useState } from "react";
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
}

export default function GoogleDriveUploadFiles({
	t,
	folder,
	files,
	refresh,
	email,
	loading,
}: GoogleDriveUploadFilesProps) {
	const prevFolder = usePrevious<drive_v3.Schema$File>(folder);
	const [loadingFiles, setLoadingFiles] = useLoadingIndicator(true, 1);

	useEffect(() => {
		const getFiles = async (eventName: string) => {
			try {
				if (eventName === "") return;
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
					const files = await response.json();
					refresh(files);
				}

				console.log("getFiles response", response);
			} catch (error) {
				console.error("getFiles error", error);
				showErrorToast(
					t,
					error instanceof Error ? error.message : "get files error"
				);
			} finally {
				setLoadingFiles(false);
			}
		};

		if (folder && folder.name && prevFolder?.name !== folder.name)
			getFiles(folder.name);
	}, [
		email,
		folder,
		folder.name,
		prevFolder?.name,
		refresh,
		setLoadingFiles,
		t,
	]);

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
							width: f.imageMediaMetadata?.width ?? 0,
							height: f.imageMediaMetadata?.height ?? 0,
						},
					};
					return item;
				})}
			/>
		</div>
	);
}
