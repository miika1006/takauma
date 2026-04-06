import { signIn } from "next-auth/react";
import { TFunction } from "../common/types";
interface AccessDeniedProps {
	t: TFunction;
}
export default function AccessDenied({ t }: AccessDeniedProps) {
	return (
		<>
			<h1>{t("accessdenied")}</h1>
			<p>
				<a
					href={`/api/auth/signin`}
					onClick={(e) => {
						e.preventDefault();
						signIn("google"); //Google, because it is only provider
					}}
				>
					{t("googlesignin")}
				</a>
			</p>
		</>
	);
}
