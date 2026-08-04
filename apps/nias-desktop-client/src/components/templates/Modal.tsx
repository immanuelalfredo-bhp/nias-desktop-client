import { useEffect, type ReactNode } from 'react';

interface ModalTemplateProps {
  title: string;
  children: ReactNode;
  className?: string;
  handleClose: () => void;
}

export default function ModalTemplate({ title, children, className, handleClose }: ModalTemplateProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleClose}
      style={{ zIndex: 1000 }} // Ensures the modal is in front of the side panel and toggle button
    >
      <section
        className={`modal-card ${className || ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modalTitle">{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}