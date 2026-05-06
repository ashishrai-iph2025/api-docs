import { CodeBlock } from '@/components/CodeBlock';
import type { ContentData } from '@/lib/content-store';

interface Props {
  data?: ContentData['authorization'];
}

const DEFAULTS = {
  description: 'Insert the successfully-generated token to access the API. Use Bearer authentication for all subsequent API calls.',
  headerNote: 'In Postman, select Bearer Token in the Authorization tab. Or add the header manually:',
  tokenExample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export function AuthorizationContent({ data }: Props) {
  const d = { ...DEFAULTS, ...data };

  return (
    <>
      <p className="mb-4">{d.description}</p>

      <h2 id="auth-overview" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Authorization Overview
      </h2>
      <div className="my-4 overflow-hidden rounded-md border border-[var(--color-border)]">
        <table className="w-full text-[14px]">
          <tbody>
            <tr className="border-b border-[var(--color-border)]">
              <td className="bg-[var(--color-surface)] px-4 py-2.5 font-semibold w-44">Type</td>
              <td className="px-4 py-2.5">Bearer (HTTP)</td>
            </tr>
            <tr>
              <td className="bg-[var(--color-surface)] px-4 py-2.5 font-semibold">Description</td>
              <td className="px-4 py-2.5">{d.description}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="auth-header" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Authorization Header
      </h2>
      <p className="mb-3">{d.headerNote}</p>
      <CodeBlock code="Authorization: Bearer {{access_token}}" language="http" />

      <h3 className="mt-5 mb-1 text-[14px] font-semibold">Example</h3>
      <CodeBlock
        code={`Authorization: Bearer ${d.tokenExample}`}
        language="http"
      />
    </>
  );
}
