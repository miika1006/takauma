import { signIn } from "next-auth/client";
import { TFunction } from "next-i18next";
interface AccessDeniedProps {
	t: TFunction;
}
export default function AccessDenied({ t }: AccessDeniedProps) {
	return (
		<>
			<h1>{t<string>("accessdenied")}</h1>
			<p>
				<a
					href={`/api/auth/signin`}
					onClick={(e) => {
						e.preventDefault();
						signIn("google"); //Google, because it is only provider
					}}
				>
					{t<string>("googlesignin")}
				</a>
			</p>
		</>
	);
}
