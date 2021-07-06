import { drive_v3 } from "googleapis";
import { TFunction } from "next-i18next";
import { useState } from "react";
import GoogleDriveEventFolders from "./googledrive-event-folders";
import GoogleDriveEventForm from "./googledrive-event-form";
interface GoogleDriveEventProps {
	t: TFunction;
}

export default function GoogleDriveEvent({ t }: GoogleDriveEventProps) {
	const [current, setCurrent] = useState<drive_v3.Schema$File | null>(null);
	const [driveFolders, setDriveFolders] = useState<drive_v3.Schema$File[]>([]);

	const removeFolder = (id: string | null | undefined) =>
		setDriveFolders((currentFolders) =>
			currentFolders.filter((f) => f.id != id)
		);
	const addFolder = (folder: drive_v3.Schema$File) =>
		setDriveFolders((current) => [...current, folder]);
	const update = (folder: drive_v3.Schema$File) => {
		setDriveFolders((current) =>
			current.map((c) => (c.id === folder.id ? folder : c))
		);
		if (folder.id === current?.id) setCurrent(folder);
	};
	return (
		<>
			<GoogleDriveEventFolders
				t={t}
				folders={driveFolders}
				current={current}
				select={setCurrent}
				refresh={setDriveFolders}
				remove={removeFolder}
				update={update}
			/>
			<GoogleDriveEventForm
				t={t}
				folders={driveFolders}
				select={setCurrent}
				add={addFolder}
			/>
		</>
	);
}
