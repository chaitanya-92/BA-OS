"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  footer?: ReactNode;
};

const widths = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby="mba-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal-box relative max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-0 shadow-2xl ${widths[size]}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-[var(--line)] bg-[#fbfaf7]/95 px-6 py-5 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <h2 id="mba-modal-title" className="font-display text-xl font-semibold tracking-tight text-[#242321]">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-[#817b72]">{description}</p>}
          </div>
          {showCloseButton && (
            <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-sm shrink-0" aria-label="Close dialog">
              <XMarkIcon className="size-5"/>
            </button>
          )}
        </div>
        <div className="px-6 py-6 sm:px-8">{children}</div>
        {footer && <div className="border-t border-[var(--line)] bg-[#f4f2ec] px-6 py-4 sm:px-8">{footer}</div>}
      </div>
    </dialog>
  );
}
