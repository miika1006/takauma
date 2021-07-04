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

	const startTimeoutLoader = (position: number) => {
		loadTimeoutID = setTimeout(() => {
			//Stop at 90%, because when endLoader is called, it sets final position to 100%
			setLoadposition(position > 90 ? 90 : position);
			startTimeoutLoader(position + 10);
		}, 100);
	};
	const showLoader = () => {
		setLoading(true);
		startTimeoutLoader(5);
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
