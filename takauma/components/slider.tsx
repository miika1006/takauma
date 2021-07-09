import React, { useEffect } from "react";
import { TFunction } from "next-i18next";
import "photoswipe/dist/photoswipe.css";
import "photoswipe/dist/default-skin/default-skin.css";
import styles from "../styles/slider.module.css";
import { Gallery, Item } from "react-photoswipe-gallery";

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
export default function Slider({ t, items }: SliderProps) {
	return items.length > 0 ? (
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
						<div className={styles.thumb}>
							<img
								alt={`photo_${idx}_thumb`}
								ref={ref as React.RefObject<HTMLImageElement>}
								onClick={open}
								src={item.thumbnailLink ?? ""}
							/>
						</div>
					)}
				</Item>
			))}
		</Gallery>
	) : null;
}
