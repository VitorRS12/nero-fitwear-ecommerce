import type { ReactNode } from "react";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

export function LegalDocument({ updatedAt, sections }: { updatedAt: string; sections: LegalSection[] }) {
  return (
    <div className="max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
      <p className="label-caps">Última atualização: {updatedAt}</p>
      {sections.map((section, index) => (
        <section key={section.title} className="space-y-3 border-t border-border pt-6">
          <h2 className="text-xl text-foreground sm:text-2xl">
            {index + 1}. {section.title}
          </h2>
          <div className="space-y-3 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-2">{section.body}</div>
        </section>
      ))}
    </div>
  );
}
