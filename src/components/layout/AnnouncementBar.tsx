interface AnnouncementBarProps {
  messages?: string[];
}

export function AnnouncementBar({
  messages = ["Frete grátis acima de R$ 399", "Até 12x sem juros", "Troca gratuita em até 30 dias"],
}: AnnouncementBarProps) {
  return (
    <div className="border-b border-border bg-accent text-accent-foreground">
      <div className="container-nero flex h-9 items-center justify-center gap-8 overflow-hidden">
        {messages.map((message, index) => (
          <p
            key={message}
            className={`label-caps whitespace-nowrap ${index > 0 ? "hidden sm:block" : ""}`}
          >
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}
