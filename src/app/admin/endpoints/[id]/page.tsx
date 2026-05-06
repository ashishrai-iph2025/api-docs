import { notFound } from 'next/navigation';
import { getEndpoints, getContentData } from '@/lib/content-store';
import { EndpointEditor } from './EndpointEditor';

export const dynamic = 'force-dynamic';

export default function EditEndpointPage({ params }: { params: { id: string } }) {
  const endpoints = getEndpoints();
  const endpoint = endpoints.find((e) => e.id === params.id);
  if (!endpoint) notFound();

  const contentData = getContentData();

  return (
    <div className="py-6">
      <EndpointEditor endpoint={endpoint} allContent={contentData} />
    </div>
  );
}
