import { Dispatch, SetStateAction, useEffect, useState } from "react";

/**
 * Custom hook to use delayed loading indicator
 * Trying not to flash loader on every request if requests are fast
 * @param isInitiallyLoading true|false
 * @returns [loading, setLoading]
 */
const useLoadingIndicator = (
	isInitiallyLoading: boolean = false
): [loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>] => {
	let loadingTimeoutId: NodeJS.Timeout | null = null;
	const [loading, setLoading] = useState<boolean>(isInitiallyLoading);
	const [loadingIndicator, setLoadingIndicator] =
		useState<boolean>(isInitiallyLoading);

	const clearCurrentLoadingTimeout = () => {
		if (loadingTimeoutId) {
			clearTimeout(loadingTimeoutId);
			loadingTimeoutId = null;
		}
	};
	const showLoadingAfterATimeout = () => {
		loadingTimeoutId = setTimeout(() => {
			setLoadingIndicator(true);
		}, 200);
	};

	useEffect(() => {
		clearCurrentLoadingTimeout();

		if (loading) showLoadingAfterATimeout();
		else setLoadingIndicator(false);

		return () => {
			clearCurrentLoadingTimeout();
		};
	}, [loading]);

	return [loadingIndicator, setLoading];
};

export default useLoadingIndicator;
