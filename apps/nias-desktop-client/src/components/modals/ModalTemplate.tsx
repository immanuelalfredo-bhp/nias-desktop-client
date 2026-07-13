import type { ReactNode } from 'react';

interface ModalTemplateProps {
  title: string;
  children: ReactNode;
  handleClose: () => void;
}

export default function ModalTemplate({ title, children, handleClose }: ModalTemplateProps) {
  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <section
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="modalTitle">{title}</h2>
        </header>

        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}