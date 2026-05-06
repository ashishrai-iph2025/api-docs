import { Mail } from 'lucide-react';
import type { ContentData } from '@/lib/content-store';

interface Props {
  data?: ContentData['support'];
}

const DEFAULTS = {
  description: 'For any technical assistance or issues with the API Monitoring Platform, please reach out to the contacts below.',
  contacts: [
    { name: 'Ashish Kumar Rai', email: 'ashish.rai@ip-house.com' },
    { name: 'IT Support', email: 'itsupport@ip-house.com' },
  ],
  footerNote: 'Alternatively, you may reach out to your designated Project Manager.',
};

export function SupportContent({ data }: Props) {
  const description = data?.description ?? DEFAULTS.description;
  const contacts = data?.contacts ?? DEFAULTS.contacts;
  const footerNote = data?.footerNote ?? DEFAULTS.footerNote;

  return (
    <>
      <p className="mb-4">{description}</p>

      <div className="my-6 grid gap-3">
        {contacts.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <Mail className="h-5 w-5 text-[var(--color-brand)]" />
            <div>
              <div className="font-semibold text-[15px]">{c.name}</div>
              <a
                href={`mailto:${c.email}`}
                className="text-[14px] text-[var(--color-brand)] hover:underline"
              >
                {c.email}
              </a>
            </div>
          </div>
        ))}
      </div>

      {footerNote && (
        <p className="mb-4 text-[14px] text-[var(--color-fg-muted)]">{footerNote}</p>
      )}
    </>
  );
}
