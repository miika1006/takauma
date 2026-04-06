import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { appWithTranslation, SSRConfig } from "next-i18next";
import type { AppProps } from "next/app";
import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import PageLoadBar from "../components/page-loadbar";
import { Analytics } from "@vercel/analytics/react";

import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

// next-i18next has a custom type for app props that is not exported
declare type i18nextAppProps = AppProps & {
	pageProps: SSRConfig;
};

const App = (props: AppProps) => (
	<SessionProvider session={props.pageProps.session} refetchInterval={0}>
		{appWithTranslation(Comp)(props as i18nextAppProps)}
	</SessionProvider>
);

const Comp = ({ Component, pageProps }: AppProps) => {
	const { data: session } = useSession();
	useEffect(() => {
		if (session?.error === "RefreshAccessTokenError") {
			signIn("google", {
				callbackUrl: process.env.NEXTAUTH_URL,
			});
		} else if (session?.error === "Expired") {
			signOut();
		}
	}, [session]);
	return (
		<>
			<PageLoadBar />
			<ToastContainer closeOnClick={false} />
			<Component {...pageProps} />
			<Analytics />
		</>
	);
};

export default App;
