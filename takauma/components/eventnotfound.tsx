import { TFunction } from "../common/types";
interface EventNotFoundProps {
	t: TFunction;
}
export default function EventNotFound({ t }: EventNotFoundProps) {
	return (
		<>
			<h1>{t("eventnotfound")}</h1>
			<p>{t("eventnotfoundinfo")}</p>
		</>
	);
}
