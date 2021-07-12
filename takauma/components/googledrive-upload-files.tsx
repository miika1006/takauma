import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import Loading from "../components/loading";

import styles from "../styles/googledriveupload-files.module.css";
import Slider, { SliderItem } from "./slider";
import { showErrorToast } from "./toast";

interface GoogleDriveUploadFilesProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	files: drive_v3.Schema$File[];
	refresh: (folders: drive_v3.Schema$File[]) => void;
}

export default function GoogleDriveUploadFiles({
	t,
	folder,
	files,
	refresh,
}: GoogleDriveUploadFilesProps) {
	const [loading, setLoading] = useLoadingIndicator(true, 1);

	useEffect(() => {
		const getFiles = async (eventName: string) => {
			try {
				if (eventName === "") return;
				setLoading(true);
				const response = await fetch(`/api/file/${folder.id}`, {
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
				showErrorToast(t, error.message);
			} finally {
				setLoading(false);
			}
		};

		if (folder && folder.name) getFiles(folder.name);
	}, [folder, folder.name, refresh, setLoading, t]);

	return (
		<>
			{files.length === 0 ? null : (
				<Slider
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
			)}
			{loading && (
				<div className={styles.event}>
					<Loading />
				</div>
			)}
		</>
	);
}
