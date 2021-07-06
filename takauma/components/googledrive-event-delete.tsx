import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import Loading from "../components/loading";
import { showErrorToast } from "../components/toast";
interface GoogleDriveEventDeleteProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	current: drive_v3.Schema$File | null;
	remove: (id: string | null | undefined) => void;
	select: (folder: drive_v3.Schema$File | null) => void;
}

export default function GoogleDriveEventDelete({
	t,
	folder,
	current,
	remove,
	select,
}: GoogleDriveEventDeleteProps) {
	const [loading, setLoading] = useLoadingIndicator(false, 1000);

	/**
	 * Deleting event
	 * 1. Call api with folderId to delete
	 * 2. Server deletes Google Drive folder
	 * 3. If folder contains some files uploaded with service account.
	 *    Delete will fail.
	 *    User should go to Google Drive and do cleanup there if needed.
	 * @returns
	 */
	const deleteEvent = async (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		try {
			e.preventDefault();
			console.log("deleting folder", folder);
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
				if (current?.id === folder.id) {
					select(null);
				}

				remove(folder.id);
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
	return loading ? (
		<Loading />
	) : (
		<button onClick={deleteEvent}>{t("delete")}</button>
	);
}
