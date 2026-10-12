import { useEffect, useRef } from "react";
import { IconClose } from "./Icons";

export default function Modal({ open, title, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog.
    panelRef.current?.querySelector("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="rounded-lg p-1.5 text-ink-500 hover:bg-mist" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
