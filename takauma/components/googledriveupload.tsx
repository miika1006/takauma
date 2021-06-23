import { TFunction } from "next-i18next";
import { useRef, useState } from "react";
import styles from "../styles/googledriveupload.module.css";
interface GoogleDriveUploadProps {
	t: TFunction;
}

export default function GoogleDriveUpload({ t }: GoogleDriveUploadProps) {
	const [image, setImage] = useState<File | null>(null);
	const [eventName, setEventName] = useState<string>("");
	const [createObjectURL, setCreateObjectURL] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const uploadToClient = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const imagefile = event.target.files[0];
			setImage(imagefile);
			setCreateObjectURL(URL.createObjectURL(imagefile));
		}
	};

	const uploadToServer = async (event: React.FormEvent<HTMLFormElement>) => {
		try {
			event.preventDefault();
			if (image == null) return;
			if (eventName === "") return;
			const body = new FormData();
			body.append("file", image);
			body.append("eventName", eventName);
			const response = await fetch("/api/file", {
				method: "POST",
				body,
			});
			setImage(null);
			if (fileInputRef?.current) fileInputRef.current.value = "";
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div>
			<form onSubmit={uploadToServer}>
				{createObjectURL != "" && (
					<img className={styles.thumbnail} alt="image" src={createObjectURL} />
				)}
				<h4>{t("event")}</h4>
				<input
					type="text"
					value={eventName}
					onChange={(e) => setEventName(e.target.value)}
				/>
				<h4>{t("selectimage")}</h4>
				<input type="file" ref={fileInputRef} onChange={uploadToClient} />
				<button type="submit">{t("upload")}</button>
			</form>
		</div>
	);
}
