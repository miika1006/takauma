import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useState } from "react";
import useLoadingIndicator from "../common/hooks/loading-indicator";
import GoogleDriveUploadForm from "./googledrive-upload-form";
import GoogleDriveUploadFiles from "./googledrive-upload-files";

interface GoogleDriveUploadProps {
	t: TFunction;
	folder: drive_v3.Schema$File;
	email: string;
}

export default function GoogleDriveUpload({
	t,
	folder,
	email,
}: GoogleDriveUploadProps) {
	const [driveFiles, setDriveFiles] = useState<drive_v3.Schema$File[]>([]);
	const [loading, setLoading] = useLoadingIndicator(false, 1);
	return (
		<>
			<GoogleDriveUploadFiles
				t={t}
				folder={folder}
				email={email}
				files={driveFiles}
				refresh={setDriveFiles}
				loading={loading}
			/>
			<GoogleDriveUploadForm
				t={t}
				defaultOpen={driveFiles.length === 0}
				folder={folder}
				email={email}
				loading={loading}
				setLoading={setLoading}
				add={(file) => setDriveFiles((currentFiles) => [...currentFiles, file])}
			/>
		</>
	);
}
