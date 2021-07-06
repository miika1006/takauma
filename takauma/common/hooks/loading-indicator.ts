import { Dispatch, SetStateAction, useEffect, useState } from "react";

/**
 * Custom hook to use delayed loading indicator
 * Trying not to flash loader on every request if requests are fast
 * @param isInitiallyLoading true|false
 * @returns [loading, setLoading]
 */
const useLoadingIndicator = (
	isInitiallyLoading: boolean = false,
	timeout: number = 400
): [loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>] => {
	const [loading, setLoading] = useState<boolean>(isInitiallyLoading);
	const [loadingIndicator, setLoadingIndicator] =
		useState<boolean>(isInitiallyLoading);
	let loadingTimeoutId: NodeJS.Timeout | null = null;

	const clearCurrentLoadingTimeout = () => {
		if (loadingTimeoutId) {
			clearTimeout(loadingTimeoutId);
			loadingTimeoutId = null;
		}
	};
	const showLoadingAfterATimeout = () => {
		loadingTimeoutId = setTimeout(() => {
			setLoadingIndicator(true);
		}, timeout);
	};
	useEffect(() => {
		clearCurrentLoadingTimeout();

		if (loading) showLoadingAfterATimeout();
		else setLoadingIndicator(false);

		return () => {
			clearCurrentLoadingTimeout();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading]);

	return [loadingIndicator, setLoading];
};

export default useLoadingIndicator;
