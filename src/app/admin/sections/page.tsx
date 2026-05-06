import { getContentData } from '@/lib/content-store';
import { SectionsEditor } from './SectionsEditor';

export const dynamic = 'force-dynamic';

export default function AdminSectionsPage() {
  const contentData = getContentData();
  return (
    <div className="p-8">
      <SectionsEditor initialData={contentData} />
    </div>
  );
}
