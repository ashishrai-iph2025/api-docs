'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';

const DRAFT_KEY = 'field_intake_draft_v1';

const initialForm = {
  date: '',
  case_reference: '',
  iph_manager: '',
  iph_department: '',
  email_address: '',
  requesting_region: '',
  client_status: '',
  client: '',
  third_party: '',
  client_reference: '',
  project_name: '',
  budget: '',
  cost_proposal: '',
  country: '',
  threat_type: '',
  new_current: '',
  service_description: '',
  target_name: '',
  target_type: '',
  business_location: '',
  resource_required: '',
  product_type: '',
  product_special_needs: '',
  intended_use: '',
  additional_info: '',
  tp_product_type: '',
  tp_buying_links: '',
  tp_evidential: '',
  tp_quantities: '',
  tp_shipped: '',
  tp_shipped_location: '',
  tp_paperwork: '',
  tp_deadline: '',
  gfi_internal_iph: '',
  gfi_external_sp: '',
  gfi_sp_poc: '',
  gfi_region: '',
  gfi_regional_manager: '',
};

const sections = [
  ['sec-1', 'Request Details', true],
  ['sec-2', 'Service Request', true],
  ['sec-3', 'Test Purchase Details', false],
  ['sec-4', 'GFI Internal Use Only', false],
] as const;

export default function FieldIntakeFormPage() {
  const [form, setForm] = useState(initialForm);
  const [savedAt, setSavedAt] = useState('');
  const [restored, setRestored] = useState(false);
  const [jspdfReady, setJspdfReady] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, date: prev.date || today }));
  }, [today]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      setForm({ ...initialForm, ...state.form });
      setSavedAt(state.savedAt || '');
      setRestored(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSavedAt = new Date().toISOString();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, savedAt: nextSavedAt }));
      setSavedAt(nextSavedAt);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [form]);

  function setField(name: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setRestored(false);
    setSavedAt('');
  }

  const progress = [
    !!form.date.trim() && !!form.iph_manager.trim() && !!form.iph_department.trim() && !!form.client.trim(),
    !!form.country.trim() && !!form.threat_type.trim() && !!form.service_description.trim() && !!form.target_name.trim(),
    !!form.tp_product_type.trim(),
    !!form.gfi_internal_iph.trim(),
  ];

  function generatePDF() {
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const contentW = pageW - margin * 2;
    const leftColW = 72;
    const rightColW = contentW - leftColW;
    const normalH = 8;
    const largeH = 22;
    const sectionH = 14;
    const titleH = 11;
    const footerReserve = 18;
    let y = margin;

    const checkPage = (needed: number) => {
      if (y + needed > pageH - footerReserve) { doc.addPage(); y = margin; }
    };

    const drawRow = (label: string, value: string, rowH: number) => {
      checkPage(rowH);
      doc.setDrawColor(190, 190, 190);
      doc.setLineWidth(0.25);
      doc.rect(margin, y, leftColW, rowH, 'S');
      doc.rect(margin + leftColW, y, rightColW, rowH, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(25, 25, 25);
      const labelLines = doc.splitTextToSize(label, leftColW - 5);
      doc.text(labelLines, margin + 3, y + 5.5);
      doc.setTextColor(60, 60, 60);
      const valLines = doc.splitTextToSize(value || '', rightColW - 5);
      doc.text(valLines, margin + leftColW + 3, y + 5.5);
      y += rowH;
    };

    const drawSection = (label: string, sub?: string) => {
      checkPage(sectionH);
      doc.setFillColor(13, 36, 75);
      doc.rect(margin, y, contentW, sectionH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(252, 147, 76);
      doc.text(label.toUpperCase(), margin + 3, y + 5.5);
      if (sub) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 190, 210);
        doc.text(sub, margin + contentW - 3, y + 5.5, { align: 'right' });
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      const titles: Record<string, string> = {
        'SEC-1': 'Request Details',
        'SEC-2': 'Service Request',
        'SEC-3': 'Test Purchase Details',
        'SEC-4': 'GFI Internal Use Only',
      };
      doc.text(titles[label] || label, margin + 3, y + 11.5);
      y += sectionH + 2;
    };

    // Page title row
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, y, contentW, titleH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('IP HOUSE FIELD INVESTIGATION INTAKE REQUEST', pageW / 2, y + 7, { align: 'center' });
    y += titleH + 4;

    drawSection('SEC-1');
    drawRow('Date', form.date, normalH);
    drawRow('Case Reference', form.case_reference, normalH);
    drawRow('IPH Manager/Requester', form.iph_manager, normalH);
    drawRow('IPH Department', form.iph_department, normalH);
    drawRow('Email Address', form.email_address, normalH);
    drawRow('Requesting Region', form.requesting_region, normalH);
    drawRow('Client (New or Existing)', form.client_status, normalH);
    drawRow('Client / Brand Name', form.client, normalH);
    drawRow('Third Party Request', form.third_party, normalH);
    drawRow('Client Reference', form.client_reference, normalH);
    drawRow('Project Name', form.project_name, normalH);
    drawRow('Specific Budget / Costs', form.budget, normalH);
    drawRow('Cost Proposal Available or Required', form.cost_proposal, normalH);

    drawSection('SEC-2');
    drawRow('Country', form.country, normalH);
    drawRow('Threat Type', form.threat_type, normalH);
    drawRow('New/Current', form.new_current, normalH);
    drawRow('Description of Service Request', form.service_description, largeH);
    drawRow('Target Name', form.target_name, normalH);
    drawRow('Target Type', form.target_type, normalH);
    drawRow('Business Location/Address/Website', form.business_location, normalH);
    drawRow('Resource Required (Internal/External Service Partner)', form.resource_required, normalH);
    drawRow('Type of Product Involved', form.product_type, normalH);
    drawRow('Describe if Product requires special needs', form.product_special_needs, normalH);
    drawRow('Intended Use of Findings', form.intended_use, normalH);
    drawRow('Additional Information', form.additional_info, largeH);

    drawSection('SEC-3', '[if applicable]');
    drawRow('Type of Product(s) to be purchased', form.tp_product_type, largeH);
    drawRow('Buying Link(s)', form.tp_buying_links, largeH);
    drawRow('Non-Evidential or Evidential Product Purchase', form.tp_evidential, largeH);
    drawRow('Quantities to be purchased', form.tp_quantities, largeH);
    drawRow('Does client require product shipped for analysis?', form.tp_shipped, normalH);
    if (form.tp_shipped === 'Yes') drawRow('If Yes — Where to (Country / City)', form.tp_shipped_location, normalH);
    drawRow('Any specific paperwork to be shipped with product', form.tp_paperwork, normalH);
    drawRow('Deadline (Y/N)', form.tp_deadline, normalH);

    drawSection('SEC-4');
    drawRow('Internal - IPH', form.gfi_internal_iph, normalH);
    drawRow('External - Service Partner (SP)', form.gfi_external_sp, normalH);
    drawRow('Service Partner PoC (SP)', form.gfi_sp_poc, normalH);
    drawRow('Assigned Region', form.gfi_region, normalH);
    drawRow('IPH Regional Manager', form.gfi_regional_manager, normalH);

    // Footer on all pages
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 208, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 100, 120);
      doc.text('IP HOUSE  ·  CONFIDENTIAL & PROPRIETARY', margin, pageH - 8);
      doc.text(`Page ${i}`, pageW - margin, pageH - 8, { align: 'right' });
      doc.text('Special Investigations Unit  ·  Field Investigations Team', margin, pageH - 4);
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const client = (form.client || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${stamp}_Field_Intake_${client}.pdf`);
    clearDraft();
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
              <span>Field Investigations</span>
            </div>
          </div>
          <div className="meta">INTAKE FORM</div>
        </header>

        <main className="page">
          <div className="form-head">
            <div className="eyebrow">INTAKE &gt; SCOPING &gt; ESTIMATE &gt; KICKOFF</div>
            <h1>Field Investigation Intake</h1>
            <div className="sub">
              Complete all required fields (marked <span className="required-inline">*</span>) and as many optional fields as you can. When finished, generate the PDF and email it, with any supporting materials, to <a href="mailto:osint@ip-house.com">osint@ip-house.com</a>.
            </div>
            <nav className="progress" aria-label="Form sections">
              {sections.map(([href, label, required], index) => (
                <a key={href} className={`chip ${progress[index] ? 'is-complete' : required ? 'is-required' : 'is-optional'}`} href={`#${href}`}>
                  <span className="head"><span className="marker" />{String(index + 1).padStart(2, '0')}</span>
                  <span className="lbl">{label}</span>
                  <span className="status">{progress[index] ? (required ? 'Complete' : 'Added') : required ? 'Required' : 'Optional'}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className={`draft-banner${restored ? ' visible' : ''}`}>
            <span>Draft restored from your last session.</span>
            <button type="button" onClick={clearDraft}>Clear draft</button>
            <span className="save-time">{savedAt ? `Last saved ${new Date(savedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span>
          </div>

          <form id="fieldIntakeForm" noValidate>

            {/* ── Section 01: Request Details ───────────────────────────────── */}
            <section className="section" id="sec-1">
              <SectionHead num="01" title="Request Details" helper="Who is requesting, for which client, and basic reference information." />
              <div className="field-grid">
                <DateField id="date" label="Date" value={form.date} onChange={(v) => setField('date', v)} required />
                <TextField id="case_reference" label="Case Reference" value={form.case_reference} onChange={(v) => setField('case_reference', v)} placeholder="[any known internal IPH reference]" optional />
                <TextField id="iph_manager" label="IPH Manager / Requester" value={form.iph_manager} onChange={(v) => setField('iph_manager', v)} required />
                <TextField id="iph_department" label="IPH Department" value={form.iph_department} onChange={(v) => setField('iph_department', v)} required />
                <TextField id="email_address" label="Email Address" value={form.email_address} onChange={(v) => setField('email_address', v)} />
                <TextField id="requesting_region" label="Requesting Region" value={form.requesting_region} onChange={(v) => setField('requesting_region', v)} />
                <RadioField id="client_status" label="Client (New or Existing)" value={form.client_status} onChange={(v) => setField('client_status', v)} options={['Existing client', 'New client']} required />
                <TextField id="client" label="Client / Brand Name" value={form.client} onChange={(v) => setField('client', v)} placeholder="[brand name]" required />
                <TextField id="third_party" label="Third Party Request" value={form.third_party} onChange={(v) => setField('third_party', v)} placeholder="[if approached through Attorney Firm]" optional />
                <TextField id="client_reference" label="Client Reference" value={form.client_reference} onChange={(v) => setField('client_reference', v)} placeholder="[if applicable]" optional />
                <TextField id="project_name" label="Project Name" value={form.project_name} onChange={(v) => setField('project_name', v)} placeholder="[If applicable]" optional />
                <TextField id="budget" label="Specific Budget / Costs" value={form.budget} onChange={(v) => setField('budget', v)} placeholder="[If applicable or known]" optional />
                <RadioField id="cost_proposal" label="Cost Proposal Available or Required" value={form.cost_proposal} onChange={(v) => setField('cost_proposal', v)} options={['Yes', 'No', 'None']} optional />
              </div>
            </section>

            {/* ── Section 02: Service Request ───────────────────────────────── */}
            <section className="section" id="sec-2">
              <SectionHead num="02" title="Service Request" helper="Details of the investigation — scope, targets, and resources needed." />
              <div className="field-grid">
                <TextField id="country" label="Country" value={form.country} onChange={(v) => setField('country', v)} required />
                <TextField id="threat_type" label="Threat Type" value={form.threat_type} onChange={(v) => setField('threat_type', v)} placeholder="[counterfeit, parallel, grey market, stolen]" required />
                <TextField id="new_current" label="New / Current" value={form.new_current} onChange={(v) => setField('new_current', v)} placeholder="[is this a new or part of an ongoing investigation]" span />
                <TextareaField id="service_description" label="Description of Service Request" value={form.service_description} onChange={(v) => setField('service_description', v)} placeholder="[Test Purchase (Tier 1, 2 or 3), Site Visit, Market Survey, Surveillance, any other support required]" span rows={3} required />
                <TextField id="target_name" label="Target Name" value={form.target_name} onChange={(v) => setField('target_name', v)} placeholder="[subject of the investigation]" required />
                <TextField id="target_type" label="Target Type" value={form.target_type} onChange={(v) => setField('target_type', v)} placeholder="[person, business company, group, address]" />
                <TextField id="business_location" label="Business Location / Address / Website" value={form.business_location} onChange={(v) => setField('business_location', v)} placeholder="[if known]" span optional />
                <TextField id="resource_required" label="Resource Required (Internal / External Service Partner)" value={form.resource_required} onChange={(v) => setField('resource_required', v)} placeholder="[for example, 1 x investigator (licensed, unlicensed), product expert]" span />
                <TextField id="product_type" label="Type of Product Involved" value={form.product_type} onChange={(v) => setField('product_type', v)} placeholder="[brand, product, SKU]" />
                <TextField id="product_special_needs" label="Describe if Product Requires Special Needs" value={form.product_special_needs} onChange={(v) => setField('product_special_needs', v)} placeholder="[for example, cold storage]" />
                <TextField id="intended_use" label="Intended Use of Findings" value={form.intended_use} onChange={(v) => setField('intended_use', v)} placeholder="[what is the goal/aim]" span />
                <TextareaField id="additional_info" label="Additional Information" value={form.additional_info} onChange={(v) => setField('additional_info', v)} placeholder="[any information which provides context to the service/support request]" span rows={3} optional />
              </div>
            </section>

            {/* ── Section 03: Test Purchase Details ────────────────────────── */}
            <section className="section" id="sec-3">
              <SectionHead num="03" title="Test Purchase Details" helper="If applicable — complete only if a test purchase is part of the service request." />
              <div className="section-notice">
                <span className="badge">!</span>
                <div className="body"><p>Complete this section only if a test purchase is required. Leave blank if not applicable.</p></div>
              </div>
              <div className="field-grid">
                <TextareaField id="tp_product_type" label="Type of Product(s) to be Purchased" value={form.tp_product_type} onChange={(v) => setField('tp_product_type', v)} placeholder="[full description supported by an image if available]" span rows={3} optional />
                <TextareaField id="tp_buying_links" label="Buying Link(s)" value={form.tp_buying_links} onChange={(v) => setField('tp_buying_links', v)} placeholder="[if applicable]" span rows={2} optional />
                <TextareaField id="tp_evidential" label="Non-Evidential or Evidential Product Purchase" value={form.tp_evidential} onChange={(v) => setField('tp_evidential', v)} placeholder="[what does the client want or need from the test purchase]" span rows={2} optional />
                <TextareaField id="tp_quantities" label="Quantities to be Purchased" value={form.tp_quantities} onChange={(v) => setField('tp_quantities', v)} placeholder="[how many per product type]" span rows={2} optional />
                <RadioField id="tp_shipped" label="Does Client Require Product Shipped for Analysis?" value={form.tp_shipped} onChange={(v) => setField('tp_shipped', v)} options={['Yes', 'No']} span optional />
                {form.tp_shipped === 'Yes' && (
                  <TextField id="tp_shipped_location" label="If Yes — Where to (Country / City)" value={form.tp_shipped_location} onChange={(v) => setField('tp_shipped_location', v)} placeholder="e.g. United Kingdom, London" span />
                )}
                <TextField id="tp_paperwork" label="Any Specific Paperwork to be Shipped with Product" value={form.tp_paperwork} onChange={(v) => setField('tp_paperwork', v)} placeholder="[Client Chain of Custody, Shipping documents etc.]" span optional />
                <TextField id="tp_deadline" label="Deadline (Y/N)" value={form.tp_deadline} onChange={(v) => setField('tp_deadline', v)} placeholder="[if applicable or specifically required by a date]" span optional />
              </div>
            </section>

            {/* ── Section 04: GFI Internal Use Only ────────────────────────── */}
            <section className="section" id="sec-4">
              <SectionHead num="04" title="GFI Internal Use Only" helper="For internal assignment and resource allocation — not shared with clients." />
              <div className="field-grid">
                <TextField id="gfi_internal_iph" label="Internal - IPH" value={form.gfi_internal_iph} onChange={(v) => setField('gfi_internal_iph', v)} placeholder="[assigned to]" optional />
                <TextField id="gfi_external_sp" label="External - Service Partner (SP)" value={form.gfi_external_sp} onChange={(v) => setField('gfi_external_sp', v)} placeholder="[company/individual person/investigator name]" optional />
                <TextField id="gfi_sp_poc" label="Service Partner PoC (SP)" value={form.gfi_sp_poc} onChange={(v) => setField('gfi_sp_poc', v)} placeholder="[lead investigator]" optional />
                <TextField id="gfi_region" label="Assigned Region" value={form.gfi_region} onChange={(v) => setField('gfi_region', v)} placeholder="[assigned to AMS, LATAM, MEA, APAC]" optional />
                <TextField id="gfi_regional_manager" label="IPH Regional Manager" value={form.gfi_regional_manager} onChange={(v) => setField('gfi_regional_manager', v)} placeholder="[case owner]" optional />
              </div>
            </section>

          </form>

          <div className="form-footer">
            <div className="conf">IP House — Confidential &amp; Proprietary</div>
            <div className="legal">Handle in accordance with your data protection obligations. The PDF generated by this form is sent via your standard email client and may not be end-to-end encrypted.</div>
          </div>
        </main>

        <div className="action-bar">
          <div className="inner">
            <div className="state">
              <span className="dot" />
              <span>{savedAt ? <><strong>Autosaved</strong> at {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</> : 'Not saved yet'}</span>
            </div>
            <div className="submit-target">Email PDF to <code><span>osint</span><span>@</span><span>ip-house</span><span>.com</span></code></div>
            <button type="button" className="btn btn-accent" onClick={generatePDF} disabled={!jspdfReady}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{fieldIntakeCss}</style>
    </>
  );
}

function SectionHead({ num, title, helper }: { num: string; title: string; helper: string }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">SECTION {num}</div>
        <h2>{title}</h2>
      </div>
      <div className="helper">{helper}</div>
    </div>
  );
}

function TextField(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; span?: boolean }) {
  return (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label htmlFor={props.id}>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <input type="text" id={props.id} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

function DateField(props: { id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean; optional?: boolean; span?: boolean }) {
  return (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label htmlFor={props.id}>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <input type="date" id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

function RadioField(props: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; optional?: boolean; span?: boolean }) {
  return (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <div className="chip-group radio-pair">
        {props.options.map((opt) => (
          <label key={opt}>
            <input type="radio" name={props.id} value={opt} checked={props.value === opt} onChange={() => props.onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function TextareaField(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; span?: boolean; rows?: number }) {
  return (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label htmlFor={props.id}>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <textarea id={props.id} rows={props.rows || 3} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

const fieldIntakeCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
.intake-page{--iph-navy:#0D244B;--iph-navy-deep:#081832;--iph-ink:#3A3A3A;--iph-ink-soft:#595959;--iph-orange:#FC934C;--iph-yellow:#FFC82B;--iph-gray:#7C899C;--iph-gray-line:#C6CDD7;--iph-gray-bg:#E9ECEF;--iph-paper:#F6F7F9;--danger:#B73A3A;--danger-soft:#FDECEC;--warn-soft:#FFF4EB;--ok:#2E7D52;--font-sans:'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--shadow-1:0 1px 2px rgba(13,36,75,.06),0 1px 1px rgba(13,36,75,.04);--form-w:1080px;--r-sm:6px;--r-lg:12px;font-family:var(--font-sans);font-size:15px;line-height:1.55;color:var(--iph-ink);background:var(--iph-paper);min-height:100vh;padding-bottom:120px;font-feature-settings:"ss01","cv11";}
.intake-page *,.intake-page *::before,.intake-page *::after{box-sizing:border-box}.app-bar{position:sticky;top:0;z-index:30;background:var(--iph-navy);color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);isolation:isolate}.app-bar .lockup{display:flex;align-items:center;gap:16px;min-width:0;flex-wrap:wrap}.app-bar .lockup .app-logo{height:32px;width:auto;display:block}.app-bar .pipe{width:1px;height:22px;background:rgba(255,255,255,.22);flex:none}.app-bar .teams{display:flex;align-items:center;gap:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.92)}.app-bar .teams .dot{width:4px;height:4px;border-radius:999px;background:rgba(255,255,255,.35);flex:none}.app-bar .meta{font-family:var(--font-mono);font-size:11.5px;color:rgba(255,255,255,.55);letter-spacing:.04em;white-space:nowrap}.page{max-width:var(--form-w);margin:28px auto 0;padding:0 32px}.form-head{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:28px 32px 24px;box-shadow:var(--shadow-1);margin-bottom:18px;position:relative;overflow:hidden}.form-head::before{content:"";position:absolute;top:0;right:0;width:180px;height:4px;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow))}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow));-webkit-background-clip:text;background-clip:text;color:transparent}.form-head h1{font-size:34px;font-weight:700;color:var(--iph-navy);margin:6px 0 8px;letter-spacing:-.02em;line-height:1.1}.sub{font-size:14.5px;color:var(--iph-gray);max-width:700px;line-height:1.55}.sub strong{color:var(--iph-ink);font-weight:600}.sub a{color:var(--iph-navy);font-weight:600;text-decoration-color:var(--iph-orange)}.required-inline{color:var(--iph-orange);font-weight:700}.progress{display:flex;gap:8px;margin-top:22px;padding-top:20px;border-top:1px solid var(--iph-gray-bg);flex-wrap:wrap}.chip{flex:1 1 0;min-width:130px;display:flex;flex-direction:column;gap:4px;padding:10px 12px 11px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper);cursor:pointer;transition:border-color .15s,background .15s,color .15s,box-shadow .15s;text-decoration:none;position:relative}.chip:hover{border-color:var(--iph-navy);background:#fff}.chip .head{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;color:var(--iph-gray);letter-spacing:.08em}.marker{width:12px;height:12px;border-radius:999px;border:1.5px solid var(--iph-gray-line);background:#fff;flex:none;display:inline-flex;align-items:center;justify-content:center}.lbl{font-size:13px;font-weight:600;color:var(--iph-navy)}.status{font-size:11px;font-weight:500;color:var(--iph-gray);margin-top:2px}.chip.is-required .marker{border-color:var(--iph-orange);box-shadow:0 0 0 2px rgba(252,147,76,.18)}.chip.is-required .status{color:var(--iph-orange);font-weight:600}.chip.is-complete{background:#fff;border-color:var(--iph-navy)}.chip.is-complete .head{color:var(--iph-navy)}.chip.is-complete .marker{border-color:var(--ok);background:var(--ok);box-shadow:none}.chip.is-complete .marker::after{content:"";width:6px;height:3px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translate(.5px,-.5px)}.chip.is-complete .status{color:var(--ok);font-weight:600}.draft-banner{display:none;align-items:center;gap:12px;background:#fff;border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-navy);border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--iph-ink);margin-bottom:14px}.draft-banner.visible{display:flex}.save-time{margin-left:auto;color:var(--iph-gray);font-size:12px;font-family:var(--font-mono)}.draft-banner button{background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-navy);font-family:inherit;font-size:12px;font-weight:600;padding:4px 10px;border-radius:var(--r-sm);cursor:pointer}.section{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:24px 28px 26px;box-shadow:var(--shadow-1);margin-bottom:16px;scroll-margin-top:100px}.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--iph-gray-bg)}.section-head .eyebrow{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;color:var(--iph-gray);background:none;-webkit-text-fill-color:currentColor}.section-head h2{font-size:22px;font-weight:700;color:var(--iph-navy);margin:6px 0 0;letter-spacing:-.015em;line-height:1.2}.helper{font-size:13px;color:var(--iph-gray);max-width:320px;line-height:1.5;text-align:right;flex:0 0 auto}.field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px}.span-2{grid-column:span 2}.field{display:flex;flex-direction:column;min-width:0}.field>label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--iph-navy);margin-bottom:6px;display:flex;align-items:baseline;flex-wrap:wrap;gap:6px}.req{color:var(--iph-orange);font-weight:700;margin-left:-2px}.opt{color:var(--iph-gray);font-weight:500;letter-spacing:.01em;text-transform:none;font-size:11px}.intake-page input[type=text],.intake-page input[type=email],.intake-page input[type=tel],.intake-page input[type=url],.intake-page input[type=number],.intake-page input[type=date],.intake-page select,.intake-page textarea{width:100%;font-family:var(--font-sans);font-size:14.5px;color:var(--iph-ink);background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;transition:border-color .12s,box-shadow .12s,background .12s;outline:none;line-height:1.5}.intake-page textarea{resize:vertical;min-height:88px;line-height:1.55}.intake-page input:focus,.intake-page select:focus,.intake-page textarea:focus{border-color:var(--iph-navy);box-shadow:0 0 0 3px rgba(13,36,75,.12)}.intake-page input::placeholder,.intake-page textarea::placeholder{color:#A6AEBC}.chip-group{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.chip-group.radio-pair{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}.chip-group>label{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:#fff;font-size:13.5px;color:var(--iph-ink);cursor:pointer;user-select:none;transition:border-color .12s,background .12s,color .12s;line-height:1.35}.chip-group>label:hover{border-color:var(--iph-navy);background:var(--iph-paper)}.chip-group input[type=radio],.chip-group input[type=checkbox]{width:16px;height:16px;accent-color:var(--iph-navy);flex:none;cursor:pointer}.chip-group>label:has(input:checked){border-color:var(--iph-navy);background:#F1F5FB;color:var(--iph-navy);font-weight:600;box-shadow:inset 0 0 0 1px var(--iph-navy)}.section-notice{display:flex;gap:14px;background:var(--warn-soft);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-orange);border-radius:var(--r-sm);padding:16px 18px;margin-bottom:20px;line-height:1.55}.badge{flex:none;width:22px;height:22px;background:var(--iph-orange);color:#fff;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-top:1px}.section-notice .body{flex:1;min-width:0}.section-notice p{margin:0;font-size:13.5px;color:var(--iph-ink)}.action-bar{position:fixed;bottom:0;left:0;right:0;z-index:30;background:#fff;border-top:1px solid var(--iph-gray-line);box-shadow:0 -4px 14px rgba(13,36,75,.05)}.action-bar .inner{max-width:var(--form-w);margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.state{font-size:12.5px;color:var(--iph-gray);display:flex;align-items:center;gap:8px;flex:1;min-width:200px}.state .dot{width:7px;height:7px;border-radius:999px;background:var(--ok);flex:none}.state strong{color:var(--iph-ink);font-weight:600}.submit-target{font-size:12.5px;color:var(--iph-gray);display:inline-flex;align-items:center;gap:6px}.submit-target code{background:var(--iph-gray-bg);color:var(--iph-navy);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px}.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-sans);font-size:14px;font-weight:600;padding:11px 22px;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:transform .12s,box-shadow .15s,background .15s,border-color .15s;white-space:nowrap;line-height:1}.btn-accent{background:linear-gradient(15deg,var(--iph-orange) 0%,var(--iph-yellow) 100%);color:var(--iph-navy);font-weight:700;box-shadow:0 1px 2px rgba(252,147,76,.25)}.btn-accent:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(252,147,76,.32)}.btn-accent svg{width:16px;height:16px}.btn:disabled{opacity:.7;cursor:not-allowed}.form-footer{max-width:var(--form-w);margin:28px auto 0;padding:18px 32px 8px;border-top:1px solid var(--iph-gray-bg);display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--iph-gray);line-height:1.55}.conf{font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--iph-navy)}.legal{max-width:760px}@media(max-width:720px){.app-bar{padding:12px 16px}.meta{display:none}.page{padding:0 16px;margin-top:16px}.form-head{padding:22px 20px 20px}.form-head h1{font-size:26px}.section{padding:20px 18px}.section-head{flex-direction:column;gap:4px}.helper{text-align:left;max-width:none}.field-grid{grid-template-columns:1fr}.span-2{grid-column:1}.action-bar .inner{padding:12px 16px}.state{flex-basis:100%;min-width:0}.submit-target{display:none}.form-footer{padding:14px 16px 8px}}
`;
