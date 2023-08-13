import React, { useEffect, useRef, useState } from "react";
import { TFunction } from "next-i18next";
import "photoswipe/dist/photoswipe.css";
import styles from "../styles/slider.module.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import { isMobile } from "react-device-detect";
import usePrevious from "../common/hooks/use-previous";
import ReactDOMServer from "react-dom/server";

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
export interface ImageItemProps {
	item: SliderItem;
}

interface Colcade {
	new (element: string, options: any): Object;
	option: (options: any) => void;
	reload: () => void;
	append: (items: any[]) => void;
	prepend: (items: any[]) => void;
}
function htmlToElement(html: string) {
	var template = document.createElement("template");
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}
export default function Slider({ t, items }: SliderProps) {
	const [initialItems, setInitialItems] = useState<SliderItem[]>(items);
	const colcade = useRef<Colcade | null>(null);
	const timer = useRef<number | null>(null);
	const previousItems = usePrevious<SliderItem[]>(items);
	useEffect(() => {
		const loadColcade = async () => {
			const Colcade: any = await import("colcade").then(
				(module) => module.default
			);

			// selector string as first argument

			colcade.current = new Colcade(`.${styles.grid}`, {
				columns: `.${styles.gridcol}`,
				items: `.${styles.griditem}`,
			});
		};
		if (previousItems?.length === 0) setInitialItems(items);
		if (!isMobile && colcade.current === null && items.length > 0)
			loadColcade();
	}, [items, previousItems?.length]);

	useEffect(() => {
		if (isMobile) return;
		if (timer.current) window.clearTimeout(timer.current);

		timer.current = window.setTimeout(() => {
			if (colcade.current && items && items.length > 0) {
				const newItems = items
					.filter(
						(newItem) =>
							!(previousItems ?? []).some(
								(previousItem) =>
									previousItem.id === newItem.id &&
									previousItem.thumbnailLink === newItem.thumbnailLink
							)
					)
					.map((i) =>
						htmlToElement(
							ReactDOMServer.renderToStaticMarkup(
								<ImageItem key={`photo_${i.id}_${i.thumbnailLink}`} item={i} />
							)
						)
					);
				console.log("appending items to colcade", newItems);

				colcade.current.append(newItems);
			}
		}, 100);

		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [items, previousItems]);

	return isMobile ? (
		<ImageGallery t={t} items={items} />
	) : (
		<div className={styles.grid}>
			<div className={styles.gridcol + " " + styles.gridcolone}></div>
			<div className={styles.gridcol + " " + styles.gridcoltwo}></div>
			<div className={styles.gridcol + " " + styles.gridcolthree}></div>
			<div className={styles.gridcol + " " + styles.gridcolfour}></div>
			<ImageGallery t={t} items={initialItems} />
		</div>
	);
}
export function ImageItem({ item }: ImageItemProps) {
	return (
		<Item
			id={item.id ?? ""}
			original={item.webContentLink ?? ""}
			thumbnail={item.thumbnailLink ?? ""}
			width={item.imageMediaMetadata?.width}
			height={item.imageMediaMetadata?.height}
		>
			{({ ref, open }) => (
				<img
					className={styles.griditem}
					alt={`photo_${item.id}_${item.thumbnailLink}_thumb`}
					ref={ref as React.RefObject<HTMLImageElement>}
					onClick={open}
					src={item.thumbnailLink ?? ""}
				/>
			)}
		</Item>
	);
}

export function ImageGallery({ t, items }: SliderProps) {
	return (
		<Gallery
			id="photo-gallery"
			options={{
				closeTitle: t("close"),
				zoomTitle: t("zoom"),
				arrowNextTitle: t("next"),
				arrowPrevTitle: t("previous"),
			}}
			withDownloadButton={true}
		>
			{items.map((item) => (
				<ImageItem item={item} key={`photo_${item.id}_${item.thumbnailLink}`} />
			))}
		</Gallery>
	);
}
