import { InfoBanner } from '@/components/InfoBanner';
import type { ContentData } from '@/lib/content-store';

interface Props {
  data?: ContentData['introduction'];
}

const DEFAULTS = {
  bannerText:
    'Welcome to the API Monitoring Platform documentation. This portal is organized like a reference guide — pick a topic from the sidebar or use the search bar above.',
  purpose: [
    'This document outlines the primary objective of granting external users access to the APIs provided by the API Monitoring Platform. The purpose is to empower authorized external entities — such as monitoring companies, content owners, and rights holders — with the ability to programmatically retrieve comprehensive data related to intellectual-property infringements.',
    'Through these APIs, external users can efficiently access detailed reports on various types of infringement, including but not limited to piracy-related videos, posts, or content that has been identified and captured across a range of digital platforms. This access facilitates timely monitoring, investigation, and management of infringement cases, allowing users to take further action such as implementing anti-piracy measures or initiating legal proceedings.',
  ],
  overview: [
    'External users — such as monitoring companies or rights holders — can use the API to access identified pirate videos and posts captured by our platform.',
    'This API provides a comprehensive view of infringement data, enabling companies and rights holders to retrieve detailed reports across a wide spectrum of online sources including social-media platforms, messaging applications such as Telegram, and User-Generated Content (UGC) platforms.',
    'Through this API, companies and rights holders can manage and analyze piracy incidents end-to-end.',
  ],
};

export function IntroductionContent({ data }: Props) {
  const bannerText = data?.bannerText ?? DEFAULTS.bannerText;
  const purpose = data?.purpose ?? DEFAULTS.purpose;
  const overview = data?.overview ?? DEFAULTS.overview;

  return (
    <>
      <InfoBanner>
        <span dangerouslySetInnerHTML={{ __html: bannerText }} />
      </InfoBanner>

      <h2 id="purpose" className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight">
        Purpose
      </h2>
      {purpose.map((para, i) => (
        <p key={i} className="mb-4">{para}</p>
      ))}

      <h2 id="overview" className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight">
        Platform Overview
      </h2>
      {overview.map((para, i) => (
        <p key={i} className="mb-4">{para}</p>
      ))}

      <h2 id="where-to-start" className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight">
        Where to Start
      </h2>
      <p className="mb-4">
        We recommend starting with these documents to get familiar with the API:
      </p>
      <ol className="list-decimal pl-6 space-y-1.5 text-[15px]">
        <li>
          <a href="/docs/login" className="text-[var(--color-brand)] hover:underline">Login</a> —
          Generate the JWT token used to authorize subsequent calls.
        </li>
        <li>
          <a href="/docs/authorization" className="text-[var(--color-brand)] hover:underline">Authorization</a> —
          Use the bearer token in the request header.
        </li>
        <li>
          <a href="/docs/endpoints" className="text-[var(--color-brand)] hover:underline">API Endpoints</a> —
          Browse all infringement-retrieval endpoints, including a single endpoint for all
          platforms and platform-specific endpoints.
        </li>
        <li>
          <a href="/docs/json-dataset" className="text-[var(--color-brand)] hover:underline">JSON Response Dataset</a> —
          Reference for every field returned in the response.
        </li>
      </ol>
    </>
  );
}
