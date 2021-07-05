import styles from "../styles/loading.module.css";
export default function Loading() {
	return (
		<div className={styles.container}>
			<div className={styles.ball1}></div>
			<div className={styles.ball2}></div>
			<div className={styles.ball3}></div>
			<div className={styles.ball4}></div>
			<div className={styles.ball5}></div>
			<div className={styles.ball6}></div>
			<div className={styles.ball7}></div>
			<div className={styles.ball8}></div>
		</div>
	);
}
