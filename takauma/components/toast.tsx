import { TFunction } from "next-i18next";
import { toast } from "react-toastify";
import styles from "../styles/toast.module.css";
interface ToastProps {
	t: TFunction;
	message?: string;
	error?: string;
}

export const showWarningToast = (t: TFunction, msg: string) => {
	toast(<Toast t={t} message={msg} />, {
		type: "warning",
	});
};

export const showErrorToast = (t: TFunction, error: string, msg?: string) => {
	toast(
		<Toast t={t} message={msg ? msg : t("somethingwentwrong")} error={error} />,
		{
			type: "error",
		}
	);
};

export default function Toast({ t, message, error }: ToastProps) {
	return (
		<div className={styles.toast}>
			<h2>{t("woops")}</h2>
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
