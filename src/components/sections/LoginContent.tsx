import { CodeBlock } from '@/components/CodeBlock';
import { MethodBadge } from '@/components/MethodBadge';
import { ParamsTable } from '@/components/ParamsTable';
import type { ContentData } from '@/lib/content-store';

interface Props {
  data?: ContentData['login'];
}

const DEFAULTS = {
  description: 'Use your shared credentials to generate a JWT token. This token must then be used to authorize every subsequent API call.',
  baseUrl: 'https://api.markscan.co.in',
  loginPath: '/Login',
  tokenExample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8y...',
  errorWrongUsername: 'Invalid user credentials!',
  errorWrongPassword: 'Invalid password! Please retry with correct credentials.',
};

export function LoginContent({ data }: Props) {
  const d = { ...DEFAULTS, ...data };

  return (
    <>
      <p className="mb-4">{d.description}</p>

      <h2 id="base-url" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Base URL
      </h2>
      <CodeBlock code={d.baseUrl} language="plain" />

      <h2 id="login-request" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Login Request
      </h2>
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <MethodBadge method="POST" />
        <code className="font-mono text-[13.5px] font-semibold">{`{{base_url}}${d.loginPath}`}</code>
      </div>

      <h3 id="login-headers" className="anchor-target mt-5 mb-1 text-[14px] font-semibold">
        Headers
      </h3>
      <CodeBlock code="Content-Type: application/json" language="http" />

      <h3 id="login-body" className="anchor-target mt-5 mb-1 text-[14px] font-semibold">
        Request Body
      </h3>
      <CodeBlock
        code={`{\n  "username": "string",\n  "password": "string"\n}`}
        language="json"
      />

      <h3 id="login-params" className="anchor-target mt-5 mb-1 text-[14px] font-semibold">
        Parameters
      </h3>
      <ParamsTable
        parameters={[
          { name: 'username', type: 'string', required: true, description: 'Your API username.' },
          { name: 'password', type: 'string', required: true, description: 'Your API password.' },
        ]}
      />

      <h2 id="login-responses" className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight">
        Responses
      </h2>

      <h3 className="mt-4 mb-1 text-[14px] font-semibold">Success (200) — JWT Token</h3>
      <CodeBlock code={`"${d.tokenExample}"`} language="json" />

      <h3 className="mt-4 mb-1 text-[14px] font-semibold">Error (400) — Wrong Username</h3>
      <CodeBlock code={`"${d.errorWrongUsername}"`} language="json" />

      <h3 className="mt-4 mb-1 text-[14px] font-semibold">Error (400) — Wrong Password</h3>
      <CodeBlock code={`"${d.errorWrongPassword}"`} language="json" />
    </>
  );
}
