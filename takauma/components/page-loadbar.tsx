import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../styles/pageloadbar.module.css";

enum routerEvents {
	Start = "routeChangeStart",
	Complete = "routeChangeComplete",
	Error = "routeChangeError",
}
export default function PageLoadBar() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [loadposition, setLoadposition] = useState<number>(0);
	let loadTimeoutID: NodeJS.Timeout | null = null;
	const loaderProgress = 5;
	const stopTowaitForEndAt = 90;
	const startTimeoutLoader = (position: number) => {
		//Stop to wait for 100%
		if (position > stopTowaitForEndAt) return;

		loadTimeoutID = setTimeout(() => {
			setLoadposition(position);
			startTimeoutLoader(position + loaderProgress);
		}, 100);
	};
	const showLoader = () => {
		setLoading(true);
		startTimeoutLoader(loaderProgress);
	};
	const endLoader = () => {
		if (loadTimeoutID) clearTimeout(loadTimeoutID);

		setLoadposition(100);

		setTimeout(() => {
			setLoading(false);
			setLoadposition(0);
		}, 500);
	};

	useEffect(() => {
		router.events.on(routerEvents.Start, showLoader);
		router.events.on(routerEvents.Complete, endLoader);
		router.events.on(routerEvents.Error, endLoader);
		return () => {
			router.events.off(routerEvents.Start, showLoader);
			router.events.off(routerEvents.Complete, endLoader);
			router.events.off(routerEvents.Error, endLoader);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			{loading && (
				<div
					className={styles.loadposition}
					style={{ width: loadposition + "%" }}
				></div>
			)}
		</>
	);
}
