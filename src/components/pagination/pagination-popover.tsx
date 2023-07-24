import { useRef, useState } from "preact/hooks";
import { Fragment, RefObject } from "preact";
import { createPortal } from "preact/compat";
import mainStyles from "./pagination.module.scss";
import more from "src/icons/more_horiz.svg?raw";
import { PaginationProps } from "components/pagination/types";
import style from "./pagination-popover.module.scss";
import { Button, IconOnlyButton } from "components/button/button";
import subtract from "../../icons/subtract.svg?raw";
import add from "../../icons/add.svg?raw";
import { Input } from "components/input/input";
import {
	useDialog,
	useOverlayTrigger,
	usePopover,
	Overlay,
	DismissButton,
} from "react-aria";
import { OverlayTriggerState, useOverlayTriggerState } from "react-stately";
import { DOMProps } from "@react-types/shared";

function PopupContents(
	props: Pick<PaginationProps, "page" | "getPageHref" | "softNavigate"> & {
		close: () => void;
	}
) {
	const [count, setCount] = useState(props.page.currentPage);
	return (
		<form
			data-testid="pagination-popup"
			class={style.popupInner}
			onSubmit={(e) => {
				e.preventDefault();
				if (props.softNavigate) {
					props.softNavigate(props.getPageHref(count));
					props.close();
					return;
				}
				location.href = props.getPageHref(count);
			}}
		>
			<div class={style.popupTopArea}>
				<IconOnlyButton
					data-testid="pagination-popup-decrement"
					type="button"
					tag="button"
					onClick={() => setCount((v) => v - 1)}
					disabled={count <= 1}
					class={style.iconButton}
				>
					<div
						class={style.buttonContainer}
						dangerouslySetInnerHTML={{ __html: subtract }}
					/>
				</IconOnlyButton>
				<Input
					data-testid="pagination-popup-input"
					class={style.popupInput}
					value={count}
					onInput={(e) => {
						const newVal = (e.target as HTMLInputElement).valueAsNumber;
						if (newVal > props.page.lastPage) {
							setCount(props.page.lastPage);
						} else if (newVal < 1) {
							setCount(1);
						} else if (newVal) {
							setCount(newVal);
						}
					}}
					type="number"
				/>
				<IconOnlyButton
					data-testid="pagination-popup-increment"
					type="button"
					tag="button"
					onClick={() => setCount((v) => v + 1)}
					disabled={count >= props.page.lastPage}
					class={style.iconButton}
				>
					<div
						class={style.buttonContainer}
						dangerouslySetInnerHTML={{ __html: add }}
					/>
				</IconOnlyButton>
			</div>
			<Button
				data-testid="pagination-popup-submit"
				tag="button"
				type="submit"
				variant="primary"
			>
				Go to page
			</Button>
		</form>
	);
}

interface PaginationPopoverProps
	extends Pick<PaginationProps, "page" | "getPageHref" | "softNavigate"> {
	triggerRef: RefObject<Element>;
	state: OverlayTriggerState;
	overlayProps: DOMProps;
}

function PaginationPopover({
	triggerRef,
	state,
	overlayProps,
	...props
}: PaginationPopoverProps) {
	/* Setup popover */
	const popoverRef = useRef(null);
	const { popoverProps, underlayProps, arrowProps, placement } = usePopover(
		{
			shouldFlip: true,
			offset: 32 - 14 / 2,
			popoverRef,
			triggerRef,
		},
		state
	);

	/* Setup dialog */
	const dialogRef = useRef(null);
	const { dialogProps, titleProps } = useDialog(overlayProps, dialogRef);

	return (
		<Overlay>
			<div {...underlayProps} className={style.underlay} />

			<div {...popoverProps} ref={popoverRef} className={style.popup}>
				<svg
					width="24"
					height="14"
					viewBox="0 0 24 14"
					fill="none"
					{...arrowProps}
					className={style.arrow}
					data-placement={placement}
				>
					<path
						d="M9.6 12.8L0 0H24L14.4 12.8C13.2 14.4 10.8 14.4 9.6 12.8Z"
						fill="var(--page-popup_background-color)"
					/>
					<path
						d="M2.5 2.08616e-06L11.2 11.6C11.6 12.1333 12.4 12.1333 12.8 11.6L21.5 2.08616e-06L24 0L14.4 12.8C13.2 14.4 10.8 14.4 9.6 12.8L0 2.08616e-06H2.5Z"
						fill="var(--page-popup_border-color)"
					/>
				</svg>
				<DismissButton onDismiss={state.close} />
				<div {...dialogProps} ref={dialogRef}>
					<h1 {...titleProps} className="visually-hidden">
						Go to page
					</h1>
					<PopupContents {...props} close={state.close} />
				</div>
				<DismissButton onDismiss={state.close} />
			</div>
		</Overlay>
	);
}

export function PaginationMenuAndPopover(
	props: Pick<PaginationProps, "page" | "getPageHref" | "softNavigate">
) {
	/* Setup trigger */
	const triggerRef = useRef(null);
	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger(
		{ type: "dialog" },
		state,
		triggerRef
	);

	return (
		<Fragment>
			<li className={`${mainStyles.paginationItem}`}>
				{/* Add onClick since onPress doesn't work with Preact well */}
				<button
					ref={triggerRef}
					onClick={triggerProps.onPress as never}
					{...triggerProps}
					data-testid="pagination-menu"
					className={`text-style-body-medium-bold ${mainStyles.extendPageButton} ${mainStyles.paginationButton} ${mainStyles.paginationIconButton}`}
					dangerouslySetInnerHTML={{ __html: more }}
				/>
			</li>
			{state.isOpen && (
				<PaginationPopover
					{...props}
					triggerRef={triggerRef}
					state={state}
					overlayProps={overlayProps}
				/>
			)}
		</Fragment>
	);
}
