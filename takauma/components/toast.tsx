import { TFunction } from "next-i18next";
import { toast } from "react-toastify";
import styles from "../styles/toast.module.css";
interface ToastProps {
	t: TFunction;
	title?: string;
	message?: string;
	error?: string;
}

export const showWarningToast = (t: TFunction, msg: string, title?: string) => {
	toast(<Toast t={t} title={title} message={msg} />, {
		type: "warning",
	});
};

export const showErrorToast = (
	t: TFunction,
	error: string,
	msg?: string,
	title?: string
) => {
	toast(
		<Toast
			t={t}
			title={title}
			message={msg ? msg : t("somethingwentwrong")}
			error={error}
		/>,
		{
			type: "error",
		}
	);
};

export default function Toast({ t, title, message, error }: ToastProps) {
	return (
		<div className={styles.toast}>
			<h2>{title ?? t("woops")}</h2>
			{message && <p>{message}</p>}
			{error && (
				<details>
					<summary>{t("errordetails")}</summary>
					<p>{error}</p>
				</details>
			)}
		</div>
	);
}
