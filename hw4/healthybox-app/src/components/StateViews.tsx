interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function LoadingView() {
  return (
    <div className="state" role="status" aria-live="polite">
      Загрузка…
    </div>
  );
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}

export function EmptyView({ text }: { text: string }) {
  return <div className="state">{text}</div>;
}
