interface DonationWidgetProps {
  url: string;
  label: string;
}

export default function DonationWidget({ url, label }: DonationWidgetProps) {
  if (!url) return null;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-lg bg-(--color-accent)/10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-(--color-accent)">
          <path d="M12 21.593c-.525-.438-10.56-8.7-10.56-13.093a6.56 6.56 0 0112.56-2.563 6.56 6.56 0 0112.56 2.563c0 4.393-10.035 12.655-10.56 13.093z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-(--color-text-muted) mb-0.5">Support this server</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-(--color-accent) hover:underline truncate block"
        >
          {label || 'Donate'}
        </a>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-lg bg-(--color-button) text-(--color-button-text) text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        Support
      </a>
    </div>
  );
}
