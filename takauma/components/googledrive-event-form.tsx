import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import { showErrorToast, showWarningToast } from "../components/toast";
import Loading from "../components/loading";
import styles from "../styles/googledrive-event-form.module.css";

interface GoogleDriveEventFormProps {
	t: TFunction;
	folders: drive_v3.Schema$File[];
	select: (folder: drive_v3.Schema$File | null) => void;
	add: (folder: drive_v3.Schema$File) => void;
}

export default function GoogleDriveEventForm({
	t,
	select,
	add,
	folders,
}: GoogleDriveEventFormProps) {
	const [loading, setLoading] = useLoadingIndicator(false, 1);
	const [createEventName, setCreateEventName] = useState<string>("");

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
				folders.some(
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
				const exists = folders.find((f) => f.id === folder.id);
				if (exists) {
					console.log("event exists, ignoring");
				} else {
					add(folder);
				}
				select(folder);
			}
			console.log("createEvent response", response);
		} catch (error) {
			console.error("createEvent error", error);
			showErrorToast(
				t,
				error instanceof Error ? error.message : "create event error"
			);
		} finally {
			setLoading(false);
		}
	};
	return loading ? (
		<div className={styles.eventform}>
			<Loading />
		</div>
	) : (
		<form onSubmit={createEvent} className={styles.eventform}>
			<h2>{t("createnewevent")}</h2>
			<input
				type="text"
				value={createEventName}
				className={styles.input}
				placeholder={t("inputnameofevent")}
				onChange={(e) => setCreateEventName(e.target.value)}
			/>
			<button type="submit">{t("save")}</button>
		</form>
	);
}
