import { Breadcrumb } from '@/components/Breadcrumb';
import { OnThisPage, type TocItem } from '@/components/OnThisPage';

interface DocPageProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export function DocPage({ breadcrumbs, title, toc, children }: DocPageProps) {
  return (
    <>
      <main className="min-w-0 flex-1 py-8">
        <article className="max-w-3xl">
          <Breadcrumb items={breadcrumbs} />
          <h1 id="top" className="anchor-target mb-6 text-[32px] font-bold tracking-tight">
            {title}
          </h1>
          {children}
        </article>
      </main>
      <OnThisPage items={toc} />
    </>
  );
}
