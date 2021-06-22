import { TFunction } from "next-i18next";
import { useState } from "react";
import styles from "../styles/googledriveupload.module.css";
interface GoogleDriveUploadProps {
	t: TFunction;
}

export default function GoogleDriveUpload({ t }: GoogleDriveUploadProps) {
	const [image, setImage] = useState<File | null>(null);
	const [createObjectURL, setCreateObjectURL] = useState<string>("");

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
			const body = new FormData();
			body.append("file", image);
			const response = await fetch("/api/file", {
				method: "POST",
				body,
			});
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
				<h4>{t("selectimage")}</h4>
				<input type="file" onChange={uploadToClient} />
				<button type="submit">{t("upload")}</button>
			</form>
		</div>
	);
}
