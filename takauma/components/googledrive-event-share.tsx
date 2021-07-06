import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import { showErrorToast } from "../components/toast";
import Loading from "../components/loading";
import { useRouter } from "next/router";

interface GoogleDriveEventShareProps {
	t: TFunction;
	current: drive_v3.Schema$File | null;
	update: (folder: drive_v3.Schema$File) => void;
}

export default function GoogleDriveEventShare({
	t,
	current,
	update,
}: GoogleDriveEventShareProps) {
	const [loading, setLoading] = useLoadingIndicator(false, 1);
	const [shareUrl, setShareUrl] = useState<string>("");
	const [pending, setPending] = useState<boolean>(false);
	const [shared, setShared] = useState<boolean>(current?.shared ?? false);
	const router = useRouter();

	useEffect(() => {
		if (current) {
			setShared(current.shared ?? false);
			setShareUrl(
				window?.location?.origin + router.pathname + "/" + current?.id
			);
		} else {
			setShared(false);
			setShareUrl("");
		}
	}, [current, router.pathname]);

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
		setPending(true);
		try {
			if (current == null || current.id === "") return;

			setLoading(true);
			const response = await fetch("/api/folder/share", {
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				method: "PUT",
				body: JSON.stringify({
					folderId: current.id,
					share: newSharedState,
				}),
			});

			if (!response.ok) {
				setShared(false);
				const msg = response.statusText + " " + (await response.text());
				showErrorToast(t, msg);
				console.error("onShare error", msg);
			} else {
				update({ ...current, shared: newSharedState });
			}

			console.log("onShare response", response);
		} catch (error) {
			console.error("onShare error", error);
			showErrorToast(t, error.message);
			setShared(!newSharedState);
		} finally {
			setLoading(false);
			setPending(false);
		}
	};
	return current ? (
		<>
			<label>
				<input type="checkbox" checked={shared} onChange={onShare} />
				{loading ? <Loading /> : t("sharealink")}
			</label>

			{!pending && shared && (
				<>
					<br />
					<input type="text" style={{ width: "100%" }} value={shareUrl} />
					<a href={shareUrl} target="_blank" rel="noopener noreferrer">
						{t("opensharelinkinfo")}
					</a>
				</>
			)}
		</>
	) : null;
}
