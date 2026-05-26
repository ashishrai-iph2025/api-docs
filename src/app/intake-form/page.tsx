'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';

type Identifier = {
  type: string;
  value: string;
  customLabel: string;
  notes: string;
};

const DRAFT_KEY = 'osint_intake_draft_v7';

const idConfig: Record<
  string,
  { group: string; label: string; inputType: string; valueLabel: string; placeholder: string; hint?: string; validate?: string }
> = {
  legal_name: { group: 'Names & aliases', label: 'Legal / Registered name', inputType: 'text', valueLabel: 'Name', placeholder: 'e.g. Acme Trading Ltd' },
  trading_name: { group: 'Names & aliases', label: 'Trading / Brand name', inputType: 'text', valueLabel: 'Name', placeholder: 'e.g. Acme' },
  username: { group: 'Names & aliases', label: 'Username / Handle', inputType: 'text', valueLabel: 'Username', placeholder: 'e.g. @suspectuser' },
  alias: { group: 'Names & aliases', label: 'Alias / Nickname', inputType: 'text', valueLabel: 'Alias', placeholder: 'e.g. "The Boss"' },
  domain: { group: 'Offline locations', label: 'Domain / Website URL', inputType: 'url', valueLabel: 'URL / Domain', placeholder: 'e.g. https://example.com or example.com', hint: 'Enter a full URL or bare domain', validate: 'url' },
  ip: { group: 'Offline locations', label: 'IP address', inputType: 'text', valueLabel: 'IP address', placeholder: 'e.g. 192.168.1.1 or 2001:db8::1', hint: 'IPv4 or IPv6 address' },
  social: { group: 'Offline locations', label: 'Social media profile', inputType: 'url', valueLabel: 'Profile URL', placeholder: 'e.g. https://instagram.com/username', hint: 'Enter the full profile URL', validate: 'url' },
  marketplace: { group: 'Offline locations', label: 'Marketplace listing / Store', inputType: 'url', valueLabel: 'Listing / Store URL', placeholder: 'e.g. https://amazon.com/stores/seller', hint: 'Enter the full listing or store URL', validate: 'url' },
  app: { group: 'Offline locations', label: 'App (iOS / Android)', inputType: 'text', valueLabel: 'App name / Bundle ID / Link', placeholder: 'e.g. com.example.app or App Store link' },
  onion: { group: 'Offline locations', label: 'Dark web URL / .onion', inputType: 'text', valueLabel: '.onion address', placeholder: 'e.g. abc123.onion', hint: '.onion address or dark web identifier' },
  email: { group: 'Communications', label: 'Email address', inputType: 'email', valueLabel: 'Email', placeholder: 'e.g. suspect@example.com', hint: 'Enter a valid email address', validate: 'email' },
  phone: { group: 'Communications', label: 'Phone number', inputType: 'tel', valueLabel: 'Phone', placeholder: 'e.g. +1 555 000 0000', hint: 'Include country code where possible', validate: 'phone' },
  whatsapp: { group: 'Communications', label: 'WhatsApp', inputType: 'tel', valueLabel: 'WhatsApp number', placeholder: 'e.g. +44 7700 000 000', hint: 'Include country code', validate: 'phone' },
  telegram: { group: 'Communications', label: 'Telegram', inputType: 'text', valueLabel: 'Telegram handle / number', placeholder: 'e.g. @username or +44 7700 000', hint: 'Username or phone number linked to the account' },
  signal: { group: 'Communications', label: 'Signal', inputType: 'tel', valueLabel: 'Signal number', placeholder: 'e.g. +44 7700 000 000', hint: 'Phone number linked to the Signal account', validate: 'phone' },
  msg_other: { group: 'Communications', label: 'Other messaging platform', inputType: 'text', valueLabel: 'Contact detail', placeholder: 'Enter handle, number, or ID' },
  analytics_id: { group: 'Digital identifiers', label: 'Analytics / Tracking ID', inputType: 'text', valueLabel: 'ID', placeholder: 'e.g. UA-12345678-1 or G-XXXXXXXX' },
  ad_code: { group: 'Digital identifiers', label: 'Advertising code', inputType: 'text', valueLabel: 'Code', placeholder: 'e.g. AdSense pub-1234567890123456' },
  app_store_id: { group: 'Digital identifiers', label: 'App store ID', inputType: 'text', valueLabel: 'App store ID', placeholder: 'e.g. id123456789 or com.example.app' },
  file_hash: { group: 'Digital identifiers', label: 'File hash', inputType: 'text', valueLabel: 'Hash', placeholder: 'e.g. SHA-256 hash' },
  crypto_wallet: { group: 'Digital identifiers', label: 'Cryptocurrency wallet', inputType: 'text', valueLabel: 'Wallet address', placeholder: 'e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  payment_handle: { group: 'Digital identifiers', label: 'Payment handle', inputType: 'text', valueLabel: 'Handle', placeholder: 'e.g. PayPal / Venmo / Cash App ID' },
  custom: { group: 'Other', label: 'Custom - specify type...', inputType: 'text', valueLabel: 'Identifier', placeholder: 'Enter the identifier' },
};

const sections = [
  ['sec-1', 'Request', true],
  ['sec-2', 'Overview', true],
  ['sec-3', 'Identifiers', false],
  ['sec-4', 'Prior history', false],
  ['sec-5', 'Attachments', false],
  ['sec-6', 'Notes', false],
] as const;

const initialForm = {
  req_name: '',
  req_department: '',
  client_name: '',
  client_status: '',
  rates_fixed: 'No',
  rate_type: '',
  rate_currency: 'USD',
  rate_amount: '',
  rate_notes: '',
  response_type: 'Estimate via email',
  proposal_input_details: '',
  obj: '',
  deliverables: '',
  intended_use: [] as string[],
  threat_type: [] as string[],
  target_type: [] as string[],
  threat_other_text: '',
  target_other_text: '',
  scale: '',
  status_updates: 'None - final report only',
  meetings_calls: 'None',
  engagement_notes: '',
  deadline_proposal: '',
  deadline_investigation: '',
  prior_inv: 'No',
  prior_details: '',
  geo_info: '',
  additional_ids: '',
  attachments_desc: '',
  additional_info: '',
};

export default function IntakeFormPage() {
  const [form, setForm] = useState(initialForm);
  const [identifiers, setIdentifiers] = useState<Identifier[]>([{ type: 'legal_name', value: '', customLabel: '', notes: '' }]);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [invalid, setInvalid] = useState<string[]>([]);
  const [jspdfReady, setJspdfReady] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const ratesVisible = form.rates_fixed === 'Yes';
  const proposalVisible = form.response_type === 'Proposal input';
  const engagementVisible = !form.status_updates.startsWith('None') || !form.meetings_calls.startsWith('None');
  const deadlineWarn = !!form.deadline_proposal && !!form.deadline_investigation && form.deadline_investigation < form.deadline_proposal;

  const progress = [
    !!form.req_name.trim() && !!form.req_department.trim() && !!form.client_name.trim() && !!form.client_status && !!form.rates_fixed && !!form.response_type && (!proposalVisible || !!form.proposal_input_details.trim()),
    !!form.obj.trim() && form.threat_type.length > 0 && form.target_type.length > 0,
    identifiers.some((i) => i.value.trim()) || !!form.geo_info.trim() || !!form.additional_ids.trim(),
    form.prior_inv !== 'No',
    !!form.attachments_desc.trim(),
    !!form.additional_info.trim(),
  ];

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      setForm({ ...initialForm, ...state.form });
      setIdentifiers(Array.isArray(state.identifiers) && state.identifiers.length ? state.identifiers : [{ type: 'legal_name', value: '', customLabel: '', notes: '' }]);
      setSavedAt(state.savedAt || '');
      setRestored(true);
    } catch {
      /* ignore malformed drafts */
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSavedAt = new Date().toISOString();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, identifiers, savedAt: nextSavedAt }));
      setSavedAt(nextSavedAt);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [form, identifiers]);

  function setField(name: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleArray(name: 'intended_use' | 'threat_type' | 'target_type', value: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter((item) => item !== value),
    }));
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setRestored(false);
    setSavedAt('');
  }

  function validateForm() {
    const issues: string[] = [];
    ['req_name', 'req_department', 'client_name', 'obj'].forEach((id) => {
      if (!String(form[id as keyof typeof initialForm]).trim()) issues.push(id);
    });
    if (!form.client_status) issues.push('clientStatusGroup');
    if (!form.response_type) issues.push('responseTypeGroup');
    if (proposalVisible && !form.proposal_input_details.trim()) issues.push('proposal_input_details');
    if (ratesVisible) {
      if (!form.rate_type) issues.push('rate_type');
      if (!form.rate_currency) issues.push('rate_currency');
      if (!form.rate_amount) issues.push('rate_amount');
    }
    if (!form.threat_type.length) issues.push('threatTypeGroup');
    if (!form.target_type.length) issues.push('targetTypeGroup');
    if (form.threat_type.includes('Other') && !form.threat_other_text.trim()) issues.push('threat_other_text');
    if (form.target_type.includes('Other') && !form.target_other_text.trim()) issues.push('target_other_text');
    identifiers.forEach((item, index) => {
      const cfg = idConfig[item.type] || idConfig.custom;
      if (!item.value.trim()) return;
      if (cfg.validate === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value)) issues.push(`id-${index}`);
      if (cfg.validate === 'phone' && (item.value.replace(/\D/g, '').length < 7 || !/^[\d\s+\-().]+$/.test(item.value))) issues.push(`id-${index}`);
      if (cfg.validate === 'url') {
        try {
          const url = new URL(item.value.includes('://') ? item.value : `https://${item.value}`);
          if (!url.hostname.includes('.')) issues.push(`id-${index}`);
        } catch {
          issues.push(`id-${index}`);
        }
      }
      if (item.type === 'custom' && !item.customLabel.trim()) issues.push(`custom-${index}`);
    });
    setInvalid(issues);
    if (issues.length) document.getElementById(issues[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !issues.length;
  }

  function formatLongDate(value: string) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.valueOf())) return '';
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function generatePDF() {
    if (!validateForm()) return;
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 18;
    const field = (label: string, value?: string) => {
      const val = value?.trim() || '-';
      const lines = doc.splitTextToSize(val, contentW);
      if (y + 10 + lines.length * 5 > pageH - 18) {
        doc.addPage();
        y = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(13, 36, 75);
      doc.text(label.toUpperCase(), margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(58, 58, 58);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    };
    const header = (num: string, title: string) => {
      if (y > pageH - 35) {
        doc.addPage();
        y = 18;
      }
      doc.setFillColor(13, 36, 75);
      doc.rect(margin, y, contentW, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`SECTION ${num}  ${title}`, margin + 4, y + 6);
      y += 15;
    };

    doc.setFillColor(13, 36, 75);
    doc.rect(0, 0, pageW, 46, 'F');
    doc.setTextColor(252, 147, 76);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INTAKE  >  SCOPING  >  ESTIMATE  >  KICKOFF', margin, 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Offline Investigation Intake', margin, 27);
    doc.setFontSize(8.5);
    doc.text('Special Investigations Unit  -  Offline Investigations Team', margin, 35);
    doc.setTextColor(255, 255, 255);
    doc.text('IP HOUSE', pageW - margin, 14, { align: 'right' });
    y = 58;
    field('Submit to', 'osint@ip-house.com');

    header('01', 'Request Details');
    field('Full Name', form.req_name);
    field('Department / Team', form.req_department);
    field('Client', form.client_name);
    field('Client Status', form.client_status);
    field('Response Requested', form.response_type);
    if (proposalVisible) field('Proposal Input Needed', form.proposal_input_details);
    field('Agreed Rates to Respect in Quote?', form.rates_fixed);
    if (ratesVisible) {
      field('Rate Type', form.rate_type);
      field('Agreed Amount', `${form.rate_currency} ${form.rate_amount}`);
      field('Rate Notes', form.rate_notes);
    }

    header('02', 'Investigation Overview');
    field('Objectives', form.obj);
    field('Expected Deliverables', form.deliverables);
    field('Intended Use of Findings', form.intended_use.join(', '));
    field('Threat Type(s)', `${form.threat_type.join(', ')}${form.threat_type.includes('Other') ? ` - Other: ${form.threat_other_text}` : ''}`);
    field('Target Type(s)', `${form.target_type.join(', ')}${form.target_type.includes('Other') ? ` - Other: ${form.target_other_text}` : ''}`);
    field('Suspected Scale', form.scale);
    field('Written Status Updates', form.status_updates);
    field('Meetings or Calls With Client', form.meetings_calls);
    field('Engagement Notes', form.engagement_notes);
    field('Proposal / Estimate Required By', formatLongDate(form.deadline_proposal) || 'Not specified');
    field('Investigation Deadline', formatLongDate(form.deadline_investigation) || 'Not specified');

    header('03', 'Target Identifiers');
    const ids = identifiers
      .filter((item) => item.value.trim())
      .map((item) => `${item.type === 'custom' ? item.customLabel || 'Custom identifier' : idConfig[item.type].label}: ${item.value}${item.notes ? ` - ${item.notes}` : ''}`);
    field('Identifiers', ids.join('\n'));
    field('Geographic Information', form.geo_info);
    field('Additional Target Information', form.additional_ids);

    header('04', 'Prior Investigation History');
    field('Prior Investigation Attempted?', form.prior_inv);
    if (form.prior_inv === 'Yes') field('Prior Investigation Details', form.prior_details);

    if (form.attachments_desc) {
      header('05', 'Source Materials & Attachments');
      field('Description of Attached Materials', form.attachments_desc);
    }
    if (form.additional_info) {
      header('06', 'Additional Information');
      field('Anything Else We Should Know?', form.additional_info);
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const client = form.client_name.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
    const requester = form.req_name.replace(/[^a-zA-Z0-9]/g, '_') || 'Requester';
    doc.save(`${stamp}_OSINT_Intake_${client}_${requester}.pdf`);
    clearDraft();
  }

  function fieldInvalid(id: string) {
    return invalid.includes(id) ? ' invalid' : '';
  }

  function groupInvalid(id: string) {
    return invalid.includes(id) ? ' invalid-group' : '';
  }

  function checkbox(name: 'intended_use' | 'threat_type' | 'target_type', value: string, label = value) {
    return (
      <label>
        <input type="checkbox" name={name} value={value} checked={form[name].includes(value)} onChange={(event) => toggleArray(name, value, event.target.checked)} /> {label}
      </label>
    );
  }

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" onLoad={() => setJspdfReady(true)} />
      <div className="intake-page">
        <header className="app-bar">
          <div className="lockup">
            <img src="/logo-white.png" alt="IP House" className="app-logo" />
            <div className="pipe" />
            <div className="teams">
              <span>Special Investigations Unit</span>
              <span className="dot" aria-hidden="true" />
              <span>Offline Investigations</span>
            </div>
          </div>
          <div className="meta">INTAKE FORM</div>
        </header>

        <main className="page">
          <div className="form-head">
            <div className="eyebrow">INTAKE &gt; SCOPING &gt; ESTIMATE &gt; KICKOFF</div>
            <h1>Offline Investigation Intake</h1>
            <div className="sub">
              Complete all required fields (marked <span className="required-inline">*</span>) and as many optional fields as you can - a thorough submission helps us scope accurately and reduces back-and-forth. When finished, generate the PDF and email it, with any supporting materials, to <a href="mailto:osint@ip-house.com">osint@ip-house.com</a>.
            </div>
            <nav className="progress" aria-label="Form sections">
              {sections.map(([href, label, required], index) => (
                <a key={href} className={`chip ${progress[index] ? 'is-complete' : required ? 'is-required' : 'is-optional'}`} data-required={required} href={`#${href}`}>
                  <span className="head"><span className="marker" />{String(index + 1).padStart(2, '0')}</span>
                  <span className="lbl">{label}</span>
                  <span className="status">{progress[index] ? (required ? 'Complete' : 'Added') : required ? 'Required' : 'Optional'}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className={`draft-banner${restored ? ' visible' : ''}`} id="draftBanner">
            <span>Draft restored from your last session.</span>
            <button type="button" onClick={clearDraft}>Clear draft</button>
            <span className="save-time">{savedAt ? `Last saved ${new Date(savedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span>
          </div>

          <div className={`validation-msg${invalid.length ? ' visible' : ''}`}>Please complete all required fields before generating the PDF.</div>

          <form id="intakeForm" noValidate>
            <section className="section" id="sec-1">
              <SectionHead num="01" title="Request Details" helper="Who is asking, who it's for, and what kind of response you need." />
              <div className="field-grid">
                <TextField id="req_name" label="Full Name" required value={form.req_name} onChange={(v) => setField('req_name', v)} placeholder="Jane Smith" invalid={fieldInvalid('req_name')} />
                <TextField id="req_department" label="Department / Team" required value={form.req_department} onChange={(v) => setField('req_department', v)} placeholder="e.g. Client Success, Legal, Brand Protection" invalid={fieldInvalid('req_department')} />
                <TextField id="client_name" label="Client" required span value={form.client_name} onChange={(v) => setField('client_name', v)} placeholder="Client or company name" invalid={fieldInvalid('client_name')} />

                <div className="field span-2">
                  <label>Existing or new client? <span className="req">*</span></label>
                  <div className={`chip-group radio-pair${groupInvalid('clientStatusGroup')}`} id="clientStatusGroup">
                    {['Existing client', 'New client'].map((value) => <label key={value}><input type="radio" name="client_status" value={value} checked={form.client_status === value} onChange={() => setField('client_status', value)} /> {value}</label>)}
                  </div>
                </div>

                <div className="field span-2">
                  <label>Are there agreed rates we must respect in our quote? <span className="req">*</span></label>
                  <div className="label-hint">Only answer <strong>Yes</strong> if an active agreement specifies rates that we need to apply when pricing this work. If no such constraint exists, select <strong>No</strong>.</div>
                  <div className={`chip-group radio-pair${groupInvalid('ratesFixedGroup')}`} id="ratesFixedGroup">
                    <label><input type="radio" name="rates_fixed" value="Yes" checked={form.rates_fixed === 'Yes'} onChange={() => setField('rates_fixed', 'Yes')} /> Yes - there are agreed rates we must apply</label>
                    <label><input type="radio" name="rates_fixed" value="No" checked={form.rates_fixed === 'No'} onChange={() => setForm((p) => ({ ...p, rates_fixed: 'No', rate_type: '', rate_amount: '', rate_notes: '', rate_currency: 'USD' }))} /> No - quote at standard rates</label>
                  </div>
                  <div className={`conditional-block${ratesVisible ? ' visible' : ''}`} id="ratesDetails">
                    <div className="field-grid">
                      <SelectField id="rate_type" label="Rate type" required value={form.rate_type} onChange={(v) => setField('rate_type', v)} invalid={fieldInvalid('rate_type')} options={['Hourly', 'Daily', 'Monthly (retainer)', 'Flat fee per project', 'Flat fee per deliverable', 'Other']} />
                      <div className="field">
                        <label htmlFor="rate_amount">Agreed amount</label>
                        <div className="ccy-amount">
                          <select id="rate_currency" value={form.rate_currency} onChange={(e) => setField('rate_currency', e.target.value)}><option>USD</option><option>GBP</option><option>EUR</option><option>Other</option></select>
                          <input className={fieldInvalid('rate_amount')} type="number" id="rate_amount" min="0" step="0.01" value={form.rate_amount} onChange={(e) => setField('rate_amount', e.target.value)} placeholder="e.g. 150" />
                        </div>
                      </div>
                      <TextField id="rate_notes" label="Rate notes" optional span value={form.rate_notes} onChange={(v) => setField('rate_notes', v)} placeholder="e.g. senior analyst $200/hr, junior $120/hr - add any tiered or role-specific detail here" />
                    </div>
                  </div>
                </div>

                <div className="field span-2">
                  <label>What kind of response do you need from us? <span className="req">*</span></label>
                  <div className="label-hint">An <strong>estimate</strong> is a short reply by email. <strong>Proposal input</strong> is our written input for a full proposal document you are working on.</div>
                  <div className={`chip-group radio-pair${groupInvalid('responseTypeGroup')}`} id="responseTypeGroup">
                    <label><input type="radio" name="response_type" value="Estimate via email" checked={form.response_type === 'Estimate via email'} onChange={() => setForm((p) => ({ ...p, response_type: 'Estimate via email', proposal_input_details: '' }))} /> Estimate via email</label>
                    <label><input type="radio" name="response_type" value="Proposal input" checked={form.response_type === 'Proposal input'} onChange={() => setField('response_type', 'Proposal input')} /> Proposal input</label>
                  </div>
                  <div className={`conditional-block${proposalVisible ? ' visible' : ''}`}>
                    <TextareaField id="proposal_input_details" label="Which input do you need from us?" required value={form.proposal_input_details} onChange={(v) => setField('proposal_input_details', v)} placeholder="e.g. methodology section for Offline investigations, estimated effort + team composition..." invalid={fieldInvalid('proposal_input_details')} />
                  </div>
                </div>
              </div>
            </section>

            <section className="section" id="sec-2">
              <SectionHead num="02" title="Investigation Overview" helper="Scope, deliverables, threat and target type - the more specific, the tighter the estimate." />
              <div className="field-grid">
                <Subgroup>Scope</Subgroup>
                <TextareaField id="obj" label="Objectives" required span rows={4} value={form.obj} onChange={(v) => setField('obj', v)} placeholder="What are we trying to prove, identify, or achieve? Who or what is being investigated? What does a successful outcome look like?" invalid={fieldInvalid('obj')} />
                <TextareaField id="deliverables" label="Expected deliverables" optionalText="optional - leave blank if standard reporting applies" span rows={2} value={form.deliverables} onChange={(v) => setField('deliverables', v)} placeholder="e.g. executive summary only, include evidence pack for litigation" />
                <div className="field span-2">
                  <label>Intended use of findings <span className="opt">- optional</span></label>
                  <div className="chip-group">{['Internal decisioning', 'Enforcement action', 'Litigation support', 'Law enforcement referral', 'Takedown / Disruption', 'Due diligence', 'Unknown'].map((v) => checkbox('intended_use', v))}</div>
                </div>
                <Subgroup>Subject</Subgroup>
                <div className="field span-2">
                  <label>Threat type <span className="req">*</span></label>
                  <div className={`chip-group${groupInvalid('threatTypeGroup')}`} id="threatTypeGroup">
                    {['Counterfeiting', 'Piracy', 'Fraud / Phishing / Impersonation', 'Data Breach / Leak', 'Background Check'].map((v) => checkbox('threat_type', v))}
                    {checkbox('threat_type', 'Other')}
                  </div>
                  <OtherField visible={form.threat_type.includes('Other')} id="threat_other_text" value={form.threat_other_text} onChange={(v) => setField('threat_other_text', v)} invalid={fieldInvalid('threat_other_text')} placeholder="Describe the threat type" />
                </div>
                <div className="field span-2">
                  <label>Target type <span className="req">*</span></label>
                  <div className={`chip-group${groupInvalid('targetTypeGroup')}`} id="targetTypeGroup">
                    {['Individual / Person', 'Company / Organization', 'Group / Network', 'Digital Service (e.g. app, website)', 'Physical Location / Address'].map((v) => checkbox('target_type', v))}
                    {checkbox('target_type', 'Other')}
                  </div>
                  <OtherField visible={form.target_type.includes('Other')} id="target_other_text" value={form.target_other_text} onChange={(v) => setField('target_other_text', v)} invalid={fieldInvalid('target_other_text')} placeholder="Describe the target type" />
                </div>
                <SelectField id="scale" label="Suspected scale" optional value={form.scale} onChange={(v) => setField('scale', v)} options={['Isolated - single actor or incident', 'Small network - a few connected individuals or sites', 'Large network / Organized crime', 'Unknown']} />
                <Subgroup>Ongoing client engagement</Subgroup>
                <SelectField id="status_updates" label="Written status updates" value={form.status_updates} onChange={(v) => setField('status_updates', v)} options={['None - final report only', 'Ad-hoc / On request only', 'Weekly', 'Bi-weekly', 'Monthly', 'Unknown']} help="If the client expects written progress updates while the investigation is running, indicate how often. Recurring updates add scope we need to price in." />
                <SelectField id="meetings_calls" label="Meetings or calls with client" value={form.meetings_calls} onChange={(v) => setField('meetings_calls', v)} options={['None', 'Ad-hoc / On request only', 'Weekly', 'Bi-weekly', 'Monthly', 'Unknown']} help="Recurring check-ins, syncs, or steering calls during the investigation. Flag them here so we can budget the time." />
                <div className={`field span-2 conditional-block${engagementVisible ? ' visible' : ''}`}>
                  <TextareaField id="engagement_notes" label="Engagement notes" optional rows={2} value={form.engagement_notes} onChange={(v) => setField('engagement_notes', v)} placeholder="Specific cadence, attendees, or format..." />
                </div>
                <Subgroup>Timing</Subgroup>
                <DateField id="deadline_proposal" label="Proposal / estimate required by" value={form.deadline_proposal} min={today} onChange={(v) => setField('deadline_proposal', v)} echo={formatLongDate(form.deadline_proposal)} help="Only fill this in if it is a hard requirement - not just a preference. Email estimates are typically returned within 2 business days." />
                <DateField id="deadline_investigation" label="Investigation deadline" value={form.deadline_investigation} min={today} onChange={(v) => setField('deadline_investigation', v)} echo={formatLongDate(form.deadline_investigation)} help="Only fill this in if it is a non-negotiable date provided by the client - not wishful thinking." warn="This date is subject to capacity and cannot be committed to the client until we have confirmed it. Do not treat it as guaranteed." />
                <div className={`deadline-warning${deadlineWarn ? ' visible' : ''}`}><span>The investigation completion deadline is earlier than the proposal deadline - please check the dates.</span></div>
              </div>
            </section>

            <section className="section" id="sec-3">
              <SectionHead num="03" title="Target Identifiers" helper="Anything you know about the subject(s). Add multiple entries where needed." />
              <div className="section-notice"><span className="badge">!</span><div className="body"><h3>This section is critical for accurate scoping.</h3><p>Identifiers often arrive forwarded from the client as a long email thread - please transcribe them into the fields below rather than relying on us to extract them from email correspondence. We <strong>will</strong> review any structured investigation reports you attach in Section 05; we <strong>will not</strong> mine identifiers out of forwarded email threads.</p></div></div>
              <div className="subgroup">
                <div className="subgroup-label">Identifiers</div>
                {identifiers.map((item, index) => {
                  const cfg = idConfig[item.type] || idConfig.custom;
                  return (
                    <div className="repeatable" key={index}>
                      <button type="button" className="remove-btn" style={{ visibility: identifiers.length === 1 ? 'hidden' : 'visible' }} onClick={() => setIdentifiers((prev) => prev.filter((_, i) => i !== index))}>x</button>
                      <div className="field-grid">
                        <div className="field"><label>Type</label><select value={item.type} onChange={(e) => setIdentifiers((prev) => prev.map((id, i) => i === index ? { ...id, type: e.target.value, value: '', customLabel: '' } : id))}>{groupedIdentifierOptions()}</select></div>
                        <div className="field"><label>{cfg.valueLabel}</label><input id={`id-${index}`} className={`id-value-input${fieldInvalid(`id-${index}`)}`} type={cfg.inputType} value={item.value} placeholder={cfg.placeholder} onChange={(e) => setIdentifiers((prev) => prev.map((id, i) => i === index ? { ...id, value: e.target.value } : id))} /><div className="format-hint">{cfg.hint || ''}</div></div>
                        <div className={`field span-2 conditional-block id-custom-row${item.type === 'custom' ? ' visible' : ''}`}><label>Custom type label</label><input id={`custom-${index}`} className={fieldInvalid(`custom-${index}`)} type="text" value={item.customLabel} placeholder="Describe what this identifier is - e.g. supplier code, registration number" onChange={(e) => setIdentifiers((prev) => prev.map((id, i) => i === index ? { ...id, customLabel: e.target.value } : id))} /></div>
                        <div className="field span-2"><label>Notes <span className="opt">- optional</span></label><input type="text" value={item.notes} placeholder="e.g. active as of May 2026, source / context" onChange={(e) => setIdentifiers((prev) => prev.map((id, i) => i === index ? { ...id, notes: e.target.value } : id))} /></div>
                      </div>
                    </div>
                  );
                })}
                <button type="button" className="add-btn" onClick={() => setIdentifiers((prev) => [...prev, { type: 'legal_name', value: '', customLabel: '', notes: '' }])}><span className="plus">+</span> Add another identifier</button>
              </div>
              <div className="subgroup">
                <div className="subgroup-label">Other intelligence</div>
                <div className="field-grid">
                  <TextareaField id="geo_info" label="Geographic information" optional span rows={2} value={form.geo_info} onChange={(v) => setField('geo_info', v)} placeholder="Known or suspected addresses, locations, operating regions, or time zones" help="Distinguish between confirmed addresses and suspected locations where possible." />
                  <TextareaField id="additional_ids" label="Additional target information" optional span rows={2} value={form.additional_ids} onChange={(v) => setField('additional_ids', v)} placeholder="Any other context not captured above - products, brands, SKUs, registration numbers, etc." />
                </div>
              </div>
            </section>

            <section className="section" id="sec-4">
              <SectionHead num="04" title="Prior Investigation History" helper="Anything already tried - known to you or to the client." />
              <div className="field-grid">
                <SelectField id="prior_inv" label="Has an investigation into this matter previously been attempted?" optional span value={form.prior_inv} onChange={(v) => setField('prior_inv', v)} options={['No', 'Yes', 'Unknown']} />
                <div className={`field span-2 conditional-block${form.prior_inv === 'Yes' ? ' visible' : ''}`}>
                  <TextareaField id="prior_details" label="Prior investigation details" rows={3} value={form.prior_details} onChange={(v) => setField('prior_details', v)} placeholder="Who conducted the previous investigation? When? What were the findings? What prevented completion?" help="Attach any prior reports to your email alongside this form." />
                </div>
              </div>
            </section>

            <section className="section" id="sec-5">
              <SectionHead num="05" title="Source Materials & Attachments" helper="Send these alongside the PDF - they live in the email, not the form." />
              <div className="attach-callout"><strong>Please attach all relevant investigative source materials to your email alongside this form.</strong> We are looking for material that provides evidence of the suspected activity or helps us understand the scope of the investigation. This may include:<ul><li>Screenshots or screen recordings of infringing or suspicious content</li><li>Chat logs, emails, or call records relevant to the case</li><li>Email headers or metadata files</li><li>Prior investigation reports or third-party assessments</li><li>Test purchase records or evidence of goods received</li><li>Any other background material that supports the investigation</li></ul></div>
              <div className="field-grid section-gap"><TextareaField id="attachments_desc" label="Description of attached materials" optional span rows={3} value={form.attachments_desc} onChange={(v) => setField('attachments_desc', v)} placeholder="Briefly list what you are attaching and relevant context..." /></div>
            </section>

            <section className="section" id="sec-6">
              <SectionHead num="06" title="Additional Information" helper="Anything that didn't fit above." />
              <div className="field-grid"><TextareaField id="additional_info" label="Anything else we should know?" optional span rows={4} value={form.additional_info} onChange={(v) => setField('additional_info', v)} placeholder="Any information that does not fit the fields above - relevant background, sensitivities, access restrictions, key contacts, or context that may affect the investigation." /></div>
            </section>
          </form>

          <div className="form-footer">
            <div className="conf">IP House - Confidential &amp; Proprietary</div>
            <div className="legal">Handle in accordance with your data protection obligations. The PDF generated by this form is sent via your standard email client and may not be end-to-end encrypted.</div>
          </div>
        </main>

        <div className="action-bar">
          <div className="inner">
            <div className="state"><span className="dot" /><span>{savedAt ? <><strong>Autosaved</strong> at {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</> : 'Not saved yet'}</span></div>
            <div className="submit-target">Email PDF to <code><span>requiredemail</span><span>@</span><span>ip-house</span><span>.com</span></code></div>
            <button type="button" className="btn btn-accent" onClick={generatePDF} disabled={!jspdfReady}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{intakeCss}</style>
    </>
  );
}

function groupedIdentifierOptions() {
  const groups = Object.entries(idConfig).reduce<Record<string, [string, string][]>>((acc, [value, cfg]) => {
    acc[cfg.group] ||= [];
    acc[cfg.group].push([value, cfg.label]);
    return acc;
  }, {});
  return Object.entries(groups).map(([group, options]) => (
    <optgroup label={group} key={group}>{options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</optgroup>
  ));
}

function SectionHead({ num, title, helper }: { num: string; title: string; helper: string }) {
  return <div className="section-head"><div><div className="eyebrow">SECTION {num}</div><h2>{title}</h2></div><div className="helper">{helper}</div></div>;
}

function Subgroup({ children }: { children: React.ReactNode }) {
  return <div className="span-2"><div className="subgroup-label">{children}</div></div>;
}

function TextField(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; optionalText?: string; span?: boolean; invalid?: string }) {
  return <div className={`field${props.span ? ' span-2' : ''}`}><label htmlFor={props.id}>{props.label} {props.required ? <span className="req">*</span> : props.optional || props.optionalText ? <span className="opt">- {props.optionalText || 'optional'}</span> : null}</label><input className={props.invalid || ''} type="text" id={props.id} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} /></div>;
}

function TextareaField(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; optionalText?: string; span?: boolean; rows?: number; help?: string; invalid?: string }) {
  return <div className={`field${props.span ? ' span-2' : ''}`}><label htmlFor={props.id}>{props.label} {props.required ? <span className="req">*</span> : props.optional || props.optionalText ? <span className="opt">- {props.optionalText || 'optional'}</span> : null}</label><textarea className={props.invalid || ''} id={props.id} rows={props.rows || 3} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />{props.help ? <div className="help">{props.help}</div> : null}</div>;
}

function SelectField(props: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; optional?: boolean; span?: boolean; help?: string; invalid?: string }) {
  return <div className={`field${props.span ? ' span-2' : ''}`}><label htmlFor={props.id}>{props.label} {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}</label><select className={props.invalid || ''} id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)}>{!props.value && <option value="">- Select -</option>}{props.options.map((option) => <option key={option}>{option}</option>)}</select>{props.help ? <div className="help">{props.help}</div> : null}</div>;
}

function DateField(props: { id: string; label: string; value: string; min: string; onChange: (v: string) => void; echo: string; help: string; warn?: string }) {
  return <div className="field"><label htmlFor={props.id}>{props.label} <span className="opt">- optional</span></label><input type="date" id={props.id} min={props.min} value={props.value} onChange={(e) => props.onChange(e.target.value)} /><div className="date-echo">{props.echo}</div><div className="help">{props.help}</div>{props.warn ? <div className="help warn-help">{props.warn}</div> : null}</div>;
}

function OtherField(props: { visible: boolean; id: string; value: string; onChange: (v: string) => void; placeholder: string; invalid?: string }) {
  return <div className={`other-field${props.visible ? ' visible' : ''}`}><div className="field"><label htmlFor={props.id}>Please specify <span className="req">*</span></label><input id={props.id} className={props.invalid || ''} type="text" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} /></div></div>;
}

const intakeCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
.intake-page{--iph-navy:#0D244B;--iph-navy-deep:#081832;--iph-ink:#3A3A3A;--iph-ink-soft:#595959;--iph-orange:#FC934C;--iph-yellow:#FFC82B;--iph-gray:#7C899C;--iph-gray-line:#C6CDD7;--iph-gray-bg:#E9ECEF;--iph-paper:#F6F7F9;--danger:#B73A3A;--danger-soft:#FDECEC;--warn-soft:#FFF4EB;--ok:#2E7D52;--font-sans:'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--shadow-1:0 1px 2px rgba(13,36,75,.06),0 1px 1px rgba(13,36,75,.04);--form-w:1080px;--r-sm:6px;--r-lg:12px;font-family:var(--font-sans);font-size:15px;line-height:1.55;color:var(--iph-ink);background:var(--iph-paper);min-height:100vh;padding-bottom:120px;font-feature-settings:"ss01","cv11";}
.intake-page *,.intake-page *::before,.intake-page *::after{box-sizing:border-box}.app-bar{position:sticky;top:0;z-index:30;background:var(--iph-navy);color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);isolation:isolate}.app-bar .lockup{display:flex;align-items:center;gap:16px;min-width:0;flex-wrap:wrap}.app-bar .lockup .app-logo{height:32px;width:auto;display:block}.app-bar .pipe{width:1px;height:22px;background:rgba(255,255,255,.22);flex:none}.app-bar .teams{display:flex;align-items:center;gap:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.92)}.app-bar .teams .dot{width:4px;height:4px;border-radius:999px;background:rgba(255,255,255,.35);flex:none}.app-bar .meta{font-family:var(--font-mono);font-size:11.5px;color:rgba(255,255,255,.55);letter-spacing:.04em;white-space:nowrap}.page{max-width:var(--form-w);margin:28px auto 0;padding:0 32px}.form-head{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:28px 32px 24px;box-shadow:var(--shadow-1);margin-bottom:18px;position:relative;overflow:hidden}.form-head::before{content:"";position:absolute;top:0;right:0;width:180px;height:4px;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow))}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow));-webkit-background-clip:text;background-clip:text;color:transparent}.form-head h1{font-size:34px;font-weight:700;color:var(--iph-navy);margin:6px 0 8px;letter-spacing:-.02em;line-height:1.1}.sub{font-size:14.5px;color:var(--iph-gray);max-width:700px;line-height:1.55}.sub strong{color:var(--iph-ink);font-weight:600}.sub a{color:var(--iph-navy);font-weight:600;text-decoration-color:var(--iph-orange)}.required-inline{color:var(--iph-orange);font-weight:700}.progress{display:flex;gap:8px;margin-top:22px;padding-top:20px;border-top:1px solid var(--iph-gray-bg);flex-wrap:wrap}.chip{flex:1 1 0;min-width:130px;display:flex;flex-direction:column;gap:4px;padding:10px 12px 11px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper);cursor:pointer;transition:border-color .15s,background .15s,color .15s,box-shadow .15s;text-decoration:none;position:relative}.chip:hover{border-color:var(--iph-navy);background:#fff}.chip .head{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;color:var(--iph-gray);letter-spacing:.08em}.marker{width:12px;height:12px;border-radius:999px;border:1.5px solid var(--iph-gray-line);background:#fff;flex:none;display:inline-flex;align-items:center;justify-content:center}.lbl{font-size:13px;font-weight:600;color:var(--iph-navy)}.status{font-size:11px;font-weight:500;color:var(--iph-gray);margin-top:2px}.chip.is-required .marker{border-color:var(--iph-orange);box-shadow:0 0 0 2px rgba(252,147,76,.18)}.chip.is-required .status{color:var(--iph-orange);font-weight:600}.chip.is-complete{background:#fff;border-color:var(--iph-navy)}.chip.is-complete .head{color:var(--iph-navy)}.chip.is-complete .marker{border-color:var(--ok);background:var(--ok);box-shadow:none}.chip.is-complete .marker::after{content:"";width:6px;height:3px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translate(.5px,-.5px)}.chip.is-complete .status{color:var(--ok);font-weight:600}.draft-banner{display:none;align-items:center;gap:12px;background:#fff;border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-navy);border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--iph-ink);margin-bottom:14px}.draft-banner.visible{display:flex}.save-time{margin-left:auto;color:var(--iph-gray);font-size:12px;font-family:var(--font-mono)}.draft-banner button{background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-navy);font-family:inherit;font-size:12px;font-weight:600;padding:4px 10px;border-radius:var(--r-sm);cursor:pointer}.validation-msg{display:none;background:var(--danger-soft);border:1px solid #E8B5B5;border-left:3px solid var(--danger);border-radius:var(--r-sm);padding:12px 16px;font-size:13.5px;color:var(--danger);margin-bottom:14px;font-weight:500}.validation-msg.visible{display:block}.section{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:24px 28px 26px;box-shadow:var(--shadow-1);margin-bottom:16px;scroll-margin-top:100px}.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--iph-gray-bg)}.section-head .eyebrow{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;color:var(--iph-gray);background:none;-webkit-text-fill-color:currentColor}.section-head h2{font-size:22px;font-weight:700;color:var(--iph-navy);margin:6px 0 0;letter-spacing:-.015em;line-height:1.2}.helper{font-size:13px;color:var(--iph-gray);max-width:320px;line-height:1.5;text-align:right;flex:0 0 auto}.subgroup{margin-top:22px}.subgroup-label{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--iph-gray);margin-bottom:12px}.subgroup-label::after{content:"";flex:1;height:1px;background:var(--iph-gray-bg)}.field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px}.span-2{grid-column:span 2}.field{display:flex;flex-direction:column;min-width:0}.field>label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--iph-navy);margin-bottom:6px;display:flex;align-items:baseline;flex-wrap:wrap;gap:6px}.req{color:var(--iph-orange);font-weight:700;margin-left:-2px}.opt{color:var(--iph-gray);font-weight:500;letter-spacing:.01em;text-transform:none;font-size:11px}.label-hint{font-size:13px;color:var(--iph-gray);margin:-2px 0 8px;line-height:1.45}.label-hint strong{color:var(--iph-ink);font-weight:600}.intake-page input[type=text],.intake-page input[type=email],.intake-page input[type=tel],.intake-page input[type=url],.intake-page input[type=number],.intake-page input[type=date],.intake-page select,.intake-page textarea{width:100%;font-family:var(--font-sans);font-size:14.5px;color:var(--iph-ink);background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;transition:border-color .12s,box-shadow .12s,background .12s;outline:none;line-height:1.5}.intake-page textarea{resize:vertical;min-height:88px;line-height:1.55}.intake-page input:focus,.intake-page select:focus,.intake-page textarea:focus{border-color:var(--iph-navy);box-shadow:0 0 0 3px rgba(13,36,75,.12)}.intake-page input::placeholder,.intake-page textarea::placeholder{color:#A6AEBC}.intake-page select{appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237C899C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}.help{font-size:12.5px;color:var(--iph-gray);margin-top:5px;line-height:1.45}.warn-help{color:var(--iph-ink);font-weight:500;background:var(--warn-soft);border-left:2px solid var(--iph-orange);padding:8px 10px;border-radius:0 var(--r-sm) var(--r-sm) 0;margin-top:8px}.date-echo{font-size:12.5px;color:var(--iph-navy);font-weight:500;margin-top:5px;min-height:1em}.date-echo:empty{display:none}.format-hint{font-size:12px;color:var(--iph-gray);margin-top:4px}.invalid{border-color:var(--danger)!important;background:#FFFBFB!important}.invalid-group{outline:1.5px solid var(--danger);outline-offset:4px;border-radius:var(--r-sm)}.chip-group{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}.chip-group.radio-pair{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.chip-group>label{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:#fff;font-size:13.5px;color:var(--iph-ink);cursor:pointer;user-select:none;transition:border-color .12s,background .12s,color .12s;line-height:1.35}.chip-group>label:hover{border-color:var(--iph-navy);background:var(--iph-paper)}.chip-group input{width:16px;height:16px;accent-color:var(--iph-navy);flex:none;cursor:pointer}.chip-group>label:has(input:checked){border-color:var(--iph-navy);background:#F1F5FB;color:var(--iph-navy);font-weight:600;box-shadow:inset 0 0 0 1px var(--iph-navy)}.other-field{display:none;margin-top:12px;grid-column:1/-1}.other-field.visible{display:flex;flex-direction:column}.other-field input{max-width:480px}.conditional-block{display:none;margin-top:14px;padding:16px 18px 18px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper)}.conditional-block.visible{display:block}.conditional-block .field-grid{gap:14px 18px}.ccy-amount{display:flex;gap:8px}.ccy-amount select{flex:0 0 96px;padding-right:28px}.ccy-amount input{flex:1;min-width:0}.repeatable{position:relative;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper);padding:14px 16px;margin-bottom:10px}.repeatable .field-grid{gap:12px 16px}.remove-btn{position:absolute;top:10px;right:10px;background:transparent;border:1px solid transparent;color:var(--iph-gray);width:26px;height:26px;border-radius:var(--r-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;font-size:14px;line-height:1}.remove-btn:hover{color:var(--danger);border-color:#E8B5B5;background:#fff}.add-btn{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px dashed var(--iph-gray-line);color:var(--iph-navy);font-family:var(--font-sans);font-size:13px;font-weight:600;padding:9px 14px;border-radius:var(--r-sm);cursor:pointer}.add-btn:hover{border-color:var(--iph-navy);background:#fff}.plus{font-size:16px;line-height:1;color:var(--iph-orange);font-weight:700}.attach-callout{background:var(--iph-paper);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-navy);border-radius:var(--r-sm);padding:18px 20px 16px;font-size:14px;color:var(--iph-ink);line-height:1.55}.attach-callout strong{color:var(--iph-navy);font-weight:700}.attach-callout ul{margin:10px 0 0;padding-left:20px;color:var(--iph-ink-soft)}.attach-callout li{margin-bottom:4px}.attach-callout li::marker{color:var(--iph-orange)}.section-notice{display:flex;gap:14px;background:var(--warn-soft);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-orange);border-radius:var(--r-sm);padding:16px 18px;margin-bottom:20px;line-height:1.55}.badge{flex:none;width:22px;height:22px;background:var(--iph-orange);color:#fff;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-top:1px}.section-notice .body{flex:1;min-width:0}.section-notice h3{margin:0 0 6px;font-size:14px;font-weight:700;color:var(--iph-navy);letter-spacing:-.005em;line-height:1.35}.section-notice p{margin:0;font-size:13.5px;color:var(--iph-ink)}.section-notice strong{color:var(--iph-navy);font-weight:600}.deadline-warning{display:none;grid-column:1/-1;align-items:flex-start;gap:10px;background:var(--warn-soft);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-orange);border-radius:var(--r-sm);padding:12px 14px;font-size:13px;color:var(--iph-ink);font-weight:500;line-height:1.5}.deadline-warning.visible{display:flex}.deadline-warning::before{content:"!";flex:none;width:18px;height:18px;background:var(--iph-orange);color:#fff;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;margin-top:1px}.section-gap{margin-top:18px}.action-bar{position:fixed;bottom:0;left:0;right:0;z-index:30;background:#fff;border-top:1px solid var(--iph-gray-line);box-shadow:0 -4px 14px rgba(13,36,75,.05)}.action-bar .inner{max-width:var(--form-w);margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.state{font-size:12.5px;color:var(--iph-gray);display:flex;align-items:center;gap:8px;flex:1;min-width:200px}.state .dot{width:7px;height:7px;border-radius:999px;background:var(--ok);flex:none}.state strong{color:var(--iph-ink);font-weight:600}.submit-target{font-size:12.5px;color:var(--iph-gray);display:inline-flex;align-items:center;gap:6px}.submit-target code{background:var(--iph-gray-bg);color:var(--iph-navy);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px}.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-sans);font-size:14px;font-weight:600;padding:11px 22px;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:transform .12s,box-shadow .15s,background .15s,border-color .15s;white-space:nowrap;line-height:1}.btn-accent{background:linear-gradient(15deg,var(--iph-orange) 0%,var(--iph-yellow) 100%);color:var(--iph-navy);font-weight:700;box-shadow:0 1px 2px rgba(252,147,76,.25)}.btn-accent:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(252,147,76,.32)}.btn-accent svg{width:16px;height:16px}.btn:disabled{opacity:.7;cursor:not-allowed}.form-footer{max-width:var(--form-w);margin:28px auto 0;padding:18px 32px 8px;border-top:1px solid var(--iph-gray-bg);display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--iph-gray);line-height:1.55}.conf{font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--iph-navy)}.legal{max-width:760px}@media (max-width:720px){.app-bar{padding:12px 16px}.meta{display:none}.page{padding:0 16px;margin-top:16px}.form-head{padding:22px 20px 20px}.form-head h1{font-size:26px}.section{padding:20px 18px}.section-head{flex-direction:column;gap:4px}.helper{text-align:left;max-width:none}.field-grid{grid-template-columns:1fr}.span-2{grid-column:1}.chip-group{grid-template-columns:1fr}.action-bar .inner{padding:12px 16px}.state{flex-basis:100%;min-width:0}.submit-target{display:none}.form-footer{padding:14px 16px 8px}}
`;
