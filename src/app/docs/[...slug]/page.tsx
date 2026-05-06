export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getActiveEndpoints as getEndpoints, getSections, getContentData } from '@/lib/content-store';
import { tocForCustomContent, tocForEndpoint } from '@/lib/toc';
import { DocPage } from '@/components/DocPage';
import { EndpointCard } from '@/components/EndpointCard';
import { IntroductionContent } from '@/components/sections/IntroductionContent';
import { LoginContent } from '@/components/sections/LoginContent';
import { AuthorizationContent } from '@/components/sections/AuthorizationContent';
import { PlatformOverviewContent } from '@/components/sections/PlatformOverviewContent';
import { JsonDatasetContent } from '@/components/sections/JsonDatasetContent';
import { SummaryContent } from '@/components/sections/SummaryContent';
import { SupportContent } from '@/components/sections/SupportContent';

interface PageProps {
  params: { slug?: string[] };
}

export default function DocPageRoute({ params }: PageProps) {
  const slug = params.slug ?? [];
  const endpoints = getEndpoints();
  const sections = getSections();
  const content = getContentData();

  function findSection(id: string) {
    return sections.find((s) => s.id === id);
  }

  function findEndpoint(id: string) {
    return endpoints.find((e) => e.id === id);
  }

  function renderCustomContent(type: string | undefined) {
    switch (type) {
      case 'introduction':
        return <IntroductionContent data={content.introduction} />;
      case 'login':
        return <LoginContent data={content.login} />;
      case 'authorization':
        return <AuthorizationContent data={content.authorization} />;
      case 'platform-overview':
        return <PlatformOverviewContent endpoints={endpoints} />;
      case 'json-dataset':
        return <JsonDatasetContent />;
      case 'summary':
        return <SummaryContent endpoints={endpoints} />;
      case 'support':
        return <SupportContent data={content.support} />;
      default:
        return null;
    }
  }

  // Endpoint detail route: /docs/endpoints/<id>
  if (slug.length === 2 && slug[0] === 'endpoints') {
    const endpoint = findEndpoint(slug[1]);
    if (!endpoint) notFound();

    return (
      <DocPage
        breadcrumbs={[
          { label: 'Docs', href: '/docs/introduction' },
          { label: 'Endpoints', href: '/docs/endpoints' },
          { label: endpoint.title },
        ]}
        title={endpoint.title}
        toc={tocForEndpoint(endpoint)}
      >
        <p id="description" className="anchor-target mb-4 text-[16px] text-[var(--color-fg)]">
          {endpoint.description}
        </p>

        <div id="headers" className="anchor-target" />
        <div id="request-body" className="anchor-target" />
        <div id="parameters" className="anchor-target" />
        <div id="responses" className="anchor-target" />

        <EndpointCard endpoint={endpoint} />
      </DocPage>
    );
  }

  // Section route: /docs/<section-id>
  if (slug.length === 1) {
    const section = findSection(slug[0]);
    if (!section) notFound();

    return (
      <DocPage
        breadcrumbs={[{ label: 'Docs', href: '/docs/introduction' }, { label: section.title }]}
        title={section.title}
        toc={tocForCustomContent(section.customContent, section.title)}
      >
        {renderCustomContent(section.customContent)}
      </DocPage>
    );
  }

  notFound();
}
