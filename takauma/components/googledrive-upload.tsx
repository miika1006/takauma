import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import styles from "../styles/googledriveupload.module.css";
import Slider, { SliderItem } from "./slider";
import Loading from "../components/loading";
import GoogleDriveUploadForm from "./googledrive-upload-form";
import GoogleDriveUploadFiles from "./googledrive-upload-files";

interface GoogleDriveUploadProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
}

export default function GoogleDriveUpload({
	t,
	folder,
}: GoogleDriveUploadProps) {
	const [driveFiles, setDriveFiles] = useState<drive_v3.Schema$File[]>([]);

	return (
		<>
			<GoogleDriveUploadFiles
				t={t}
				folder={folder}
				files={driveFiles}
				refresh={setDriveFiles}
			/>
			<GoogleDriveUploadForm
				t={t}
				folder={folder}
				add={(file) => setDriveFiles((currentFiles) => [...currentFiles, file])}
			/>
		</>
	);
}
