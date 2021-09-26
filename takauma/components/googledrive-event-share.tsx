import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import { showErrorToast, showWarningToast } from "../components/toast";
import Loading from "../components/loading";
import { useRouter } from "next/router";
import styles from "../styles/googledrive-event-share.module.css";

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
	const [copysuccess, setCopySuccess] = useState<boolean>(false);
	const [shareUrl, setShareUrl] = useState<string>("");
	const [pending, setPending] = useState<boolean>(false);
	const [shared, setShared] = useState<boolean>(current?.shared ?? false);
	const router = useRouter();
	const shareLinkInputRef = useRef<HTMLInputElement>(null);
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
			showErrorToast(t, error instanceof Error ? error.message : "share error");
			setShared(!newSharedState);
		} finally {
			setLoading(false);
			setPending(false);
		}
	};

	/**
	 * Share with mobile
	 * @param event
	 */
	const shareToMobile = async (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		event.preventDefault();
		event.stopPropagation();

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Takauma",
					text: current?.name ?? "",
					url: shareUrl,
				});
			} catch (error) {
				console.warn("Share to mobile", error);
				//showWarningToast(t, t("sharefailed"));
			}
		}
	};
	/**
	 * Copy sharelink to clipboard
	 * @param event
	 */
	const copySharelinkToClipboard = (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		event.preventDefault();
		event.stopPropagation();
		setCopySuccess(false);

		/* Select the text field */
		shareLinkInputRef.current?.select();
		shareLinkInputRef.current?.setSelectionRange(
			0,
			99999
		); /* For mobile devices */

		try {
			/* Copy the text inside the text field */
			document.execCommand("copy");
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 1500);
		} catch (err) {
			console.warn("Copy to clipboard error", err);
			showWarningToast(t, t("couldntcopytoclipboard"));
		}
	};
	return current ? (
		<div className={styles.share}>
			<label>
				<input type="checkbox" checked={shared} onChange={onShare} />
				{loading ? <Loading /> : t("sharealink")}
			</label>

			{!pending && shared && (
				<>
					<input
						type="text"
						ref={shareLinkInputRef}
						className={styles.input}
						value={shareUrl}
						readOnly
					/>

					<div className={styles.shareoptionsmobile}>
						<button onClick={shareToMobile}>{t("sharelink")}</button>
						<a
							href={shareUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="button"
						>
							{t("opensharelinkinfo")}
						</a>
					</div>
					<div className={styles.shareoptionsdesktop}>
						<button onClick={copySharelinkToClipboard}>
							{copysuccess ? t("copysuccesss") : t("copytoclipboard")}
						</button>
						<a
							href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
								current?.name ?? ""
							)}%20${shareUrl}`}
							className="button"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("sharetowhatsapp")}
						</a>
						<a
							href={`mailto:?subject=Takauma ${current?.name ?? ""}&body=${t(
								"opensharelinkinfo"
							)} ${shareUrl}.`}
							className="button"
						>
							{t("sharebyemail")}
						</a>
						<a
							href={shareUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="button"
						>
							{t("opensharelinkinfo")}
						</a>
					</div>
				</>
			)}
		</div>
	) : null;
}
