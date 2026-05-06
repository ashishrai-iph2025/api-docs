import { CodeBlock } from '@/components/CodeBlock';
import type { Endpoint } from '@/data/types';

interface Props {
  endpoints: Endpoint[];
}

export function SummaryContent({ endpoints }: Props) {
  const endpointPaths = endpoints.map((e) => `${e.method} ${e.path}`).join('\n');

  return (
    <>
      <p className="mb-4">A high-level checklist for integrating with the API end-to-end.</p>

      <h2 id="step-1" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Step 1 — Authentication
      </h2>
      <p className="mb-3">Obtain valid credentials and request a token.</p>
      <CodeBlock code="POST /Login" language="http" />
      <p className="mb-3">
        This returns an authentication token to be used in all subsequent requests.
      </p>

      <h2 id="step-2" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Step 2 — Authorization
      </h2>
      <p className="mb-3">
        Include the token from Step 1 in the request headers of every infringement call.
      </p>
      <CodeBlock code="Authorization: Bearer <your_token>" language="http" />

      <h2 id="step-3" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Step 3 — Fetch Infringement Data
      </h2>
      <p className="mb-3">Send a POST request to one of the available endpoints:</p>
      <CodeBlock code={endpointPaths} language="http" />

      <h2 id="step-4" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Step 4 — Required Request Parameters
      </h2>
      <p className="mb-3">All requests must include the following JSON parameters:</p>
      <CodeBlock
        code={`{\n  "startdate": "2025-04-24T19:53:32.616Z",  // Required\n  "enddate":   "2025-04-24T19:53:32.616Z",  // Optional\n  "assetname": "string"                      // Optional\n}`}
        language="json"
      />

      <h2 id="step-5" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Step 5 — API Response
      </h2>
      <p className="mb-3">
        The infringement details are returned in JSON format. See the{' '}
        <a href="/docs/json-dataset" className="text-[var(--color-brand)] hover:underline">
          JSON Response Dataset
        </a>{' '}
        for a description of every field.
      </p>
    </>
  );
}
