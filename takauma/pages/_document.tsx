import DefaultDocument, {
	Html,
	Head,
	Main,
	NextScript,
	type DocumentContext,
	type DocumentInitialProps,
} from "next/document";

type Props = DocumentInitialProps & { locale: string };

export default function Document({ locale }: Props) {
	return (
		<Html lang={locale ?? "fi"}>
			<Head>
				<meta charSet="utf-8" />
				<link rel="preconnect" href="https://fonts.gstatic.com" />
				<link
					href="https://fonts.googleapis.com/css2?family=Saira+Condensed&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

Document.getInitialProps = async (ctx: DocumentContext): Promise<Props> => {
	const initialProps = await DefaultDocument.getInitialProps(ctx);
	return { ...initialProps, locale: ctx.locale ?? "fi" };
};
