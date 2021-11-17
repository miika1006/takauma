import React, { useEffect, useRef, useState } from "react";
import { TFunction } from "next-i18next";
import "photoswipe/dist/photoswipe.css";
import "photoswipe/dist/default-skin/default-skin.css";
import styles from "../styles/slider.module.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import { isMobile } from "react-device-detect";

interface SliderProps {
	t: TFunction;
	items: SliderItem[];
}
export interface SliderItem {
	id?: string | null | undefined;
	thumbnailLink?: string | null | undefined;
	webContentLink?: string | null | undefined;
	imageMediaMetadata?: {
		width?: number;
		height?: number;
	};
}

interface Colcade {
	new (element: string, options: any): Object;
	option: (options: any) => void;
	reload: () => void;
}
export default function Slider({ t, items }: SliderProps) {
	const [colcade, setColcade] = useState<Colcade | null>(null);
	const timer = useRef<number | null>(null);
	useEffect(() => {
		const loadColcade = async () => {
			const Colcade: any = await import("colcade").then(
				(module) => module.default
			);

			// selector string as first argument
			setColcade(
				new Colcade(`.${styles.grid}`, {
					columns: `.${styles.gridcol}`,
					items: `.${styles.griditem}`,
				})
			);
		};
		if (colcade === null && items.length > 0) loadColcade();
	}, [items, colcade]);

	useEffect(() => {
		if (timer.current) window.clearTimeout(timer.current);

		timer.current = window.setTimeout(() => {
			if (colcade && items && items.length > 0) {
				console.log("reloading colcade");
				//colcade.reload();
			}
		}, 2000);

		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [colcade, items]);

	return items.length > 0 ? (
		<div className={styles.grid}>
			<div className={styles.gridcol + " " + styles.gridcolone}></div>
			<div className={styles.gridcol + " " + styles.gridcoltwo}></div>
			<div className={styles.gridcol + " " + styles.gridcolthree}></div>
			<div className={styles.gridcol + " " + styles.gridcolfour}></div>
			<Gallery
				id="photo-gallery"
				closeButtonCaption={t("close")}
				shareButtonCaption={t("share")}
				toggleFullscreenButtonCaption={t("fullscreen")}
				zoomButtonCaption={t("zoom")}
				prevButtonCaption={t("previous")}
				nextButtonCaption={t("next")}
				options={{
					shareButtons: [
						{
							id: "download",
							label: t("downloadoriginal"),
							url: "{{raw_image_url}}",
							download: true,
						},
					],
				}}
			>
				{items.map((item, idx) => (
					<Item
						id={item.id ?? ""}
						key={`photo_${item.id}`}
						original={item.webContentLink ?? ""}
						thumbnail={item.thumbnailLink ?? ""}
						width={item.imageMediaMetadata?.width}
						height={item.imageMediaMetadata?.height}
					>
						{({ ref, open }) => (
							<img
								className={styles.griditem}
								alt={`photo_${idx}_thumb`}
								ref={ref as React.RefObject<HTMLImageElement>}
								onClick={open}
								src={item.thumbnailLink ?? ""}
							/>
						)}
					</Item>
				))}
			</Gallery>
		</div>
	) : null;
}
