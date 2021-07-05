import { Provider } from "next-auth/client";
import { appWithTranslation, SSRConfig } from "next-i18next";
import type { AppProps } from "next/app";
import React from "react";
import { ToastContainer } from "react-toastify";
import PageLoadBar from "../components/page-loadbar";

import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
//This is because i18next has custom type for app props that is not exported
//This is taken from next-i18next code by copy & paste
//We need this because we need to use appWithTranslation inside <Provider> for sessions
//If using other way around, appWithTranslation as root, it will not work as espected
declare type i18nextAppProps = AppProps & {
	pageProps: SSRConfig;
};
// Use the <Provider> to improve performance and allow components that call
// `useSession()` anywhere in your application to access the `session` object.
function App(props: AppProps) {
	return (
		<Provider
			// Provider options are not required but can be useful in situations where
			// you have a short session maxAge time. Shown here with default values.
			options={{
				// Client Max Age controls how often the useSession in the client should
				// contact the server to sync the session state. Value in seconds.
				// e.g.
				// * 0  - Disabled (always use cache value)
				// * 60 - Sync session state with server if it's older than 60 seconds
				clientMaxAge: 0,
				// Keep Alive tells windows / tabs that are signed in to keep sending
				// a keep alive request (which extends the current session expiry) to
				// prevent sessions in open windows from expiring. Value in seconds.
				//
				// Note: If a session has expired when keep alive is triggered, all open
				// windows / tabs will be updated to reflect the user is signed out.
				keepAlive: 0,
			}}
			session={props.pageProps.session}
		>
			{/* Using appWithTranslation here because of i18next provider, if not, the session provider above will not work as espected */}
			{appWithTranslation(Comp)(props as i18nextAppProps)}
		</Provider>
	);
}
function Comp({ Component, pageProps }: AppProps) {
	return (
		<>
			<PageLoadBar />
			<ToastContainer closeOnClick={false} />
			<Component {...pageProps} />
		</>
	);
}

export default App;
