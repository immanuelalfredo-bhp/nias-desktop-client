import type { StatusState } from '../../types';

interface StatusFooterProps {
  status: StatusState;
}

export default function StatusFooter({ status }: StatusFooterProps) {
  const text = status.text.trim() ? status.text : 'Ready';

  return (
    <div className={status.isError ? 'status-footer error' : 'status-footer'} role="status">
      {text}
    </div>
  );
}
