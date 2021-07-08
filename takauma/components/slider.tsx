import React, { useEffect } from "react";
import ImageGallery from "react-image-gallery";
import { TFunction } from "next-i18next";
import "react-image-gallery/styles/css/image-gallery.css";
import styles from "../styles/slider.module.css";
interface SliderProps {
	t: TFunction;
	items: SliderItem[];
}
interface SliderItem {
	id?: string | null | undefined;
	thumbnailLink?: string | null | undefined;
	webContentLink?: string | null | undefined;
}
export default function Slider({ t, items }: SliderProps) {
	return items.length > 0 ? (
		<ImageGallery
			additionalClass={styles.slider}
			lazyLoad={true}
			// renderLeftNav={(onclick, disabled) => {
			// 	return (
			// 		<button
			// 			className="image-gallery-custom-left-nav"
			// 			disabled={disabled}
			// 			onClick={onclick}
			// 		/>
			// 	);
			// }}
			//renderRightNav={(onclick, disabled) => {
			// 	return (
			// 		<button
			// 			className="image-gallery-custom-left-nav"
			// 			disabled={disabled}
			// 			onClick={onclick}
			// 		/>
			// 	);
			// }}
			items={items.map((item) => {
				return {
					thumbnail: item.thumbnailLink ?? "",
					original: item.webContentLink ?? "",
				};
			})}
		/>
	) : null;
}
