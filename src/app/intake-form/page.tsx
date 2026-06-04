'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';

const DRAFT_KEY = 'field_intake_draft_v2';

const THREAT_TYPES = [
  'Counterfeiting',
  'Parallel Trade / Grey Market',
  'Diversion',
  'Stolen Goods',
  'Fraud / Impersonation',
  'Other',
];

const SERVICE_REQUEST_TYPES = [
  'Test Purchase',
  'Site Visit',
  'Market Survey',
  'Surveillance',
  'Other',
];

const INTENDED_USE_OPTIONS = [
  'Internal decisioning',
  'Enforcement action',
  'Litigation support',
  'Law enforcement referral',
  'Takedown / Disruption',
  'Due diligence',
  'Other',
];

const TP_LEVEL_OPTIONS = [
  'Level 1 – Basic / Non-evidential (standard consumer transaction)',
  'Level 2 – Evidential (documented chain of custody)',
  'Level 3 – Full evidentiary (court-ready, full chain of custody)',
];

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
  threat_type: [] as string[],
  threat_type_other: '',
  service_request_type: [] as string[],
  service_request_type_other: '',
  new_current: '',
  service_description: '',
  target_name: '',
  target_type: '',
  business_location: '',
  product_type: '',
  product_special_needs: '',
  intended_use: '',
  intended_use_other: '',
  additional_info: '',
  tp_product_type: '',
  tp_buying_links: '',
  tp_level: '',
  tp_evidentiary_standard: '',
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
  const [productImages, setProductImages] = useState<{ name: string; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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

  function toggleArray(name: 'threat_type' | 'service_request_type', value: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter((v) => v !== value),
    }));
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setRestored(false);
    setSavedAt('');
  }

  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImages((prev) => [...prev, { name: file.name, url: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  }

  const progress = [
    !!form.date.trim() && !!form.iph_manager.trim() && !!form.iph_department.trim() && !!form.client.trim(),
    !!form.country.trim() && form.threat_type.length > 0 && !!form.service_description.trim() && !!form.target_name.trim(),
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

    const drawSection = (label: string) => {
      checkPage(sectionH);
      doc.setFillColor(13, 36, 75);
      doc.rect(margin, y, contentW, sectionH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(252, 147, 76);
      doc.text(label.toUpperCase(), margin + 3, y + 5.5);
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
    doc.text('IP HOUSE FIELD INVESTIGATION & TEST PURCHASE INTAKE REQUEST', pageW / 2, y + 7, { align: 'center' });
    y += titleH + 4;

    drawSection('SEC-1');
    drawRow('Date', form.date, normalH);
    drawRow('Case Reference', form.case_reference, normalH);
    drawRow('IPH Requester', form.iph_manager, normalH);
    drawRow('IPH Department', form.iph_department, normalH);
    drawRow('Email Address', form.email_address, normalH);
    drawRow("IPH Requestor's Location", form.requesting_region, normalH);
    drawRow('Client (New or Existing)', form.client_status, normalH);
    drawRow('Client / Brand Name (in HubSpot)', form.client, normalH);
    drawRow('Third Party Request', form.third_party, normalH);
    drawRow('Client Reference', form.client_reference, normalH);
    drawRow('Project Name', form.project_name, normalH);
    drawRow('Specific Budget / Costs', form.budget, normalH);
    drawRow('Cost Proposal Requested', form.cost_proposal, normalH);

    drawSection('SEC-2');
    drawRow('Territory (include Cit(ies) if known)', form.country, normalH);
    const threatTypeVal = form.threat_type.includes('Other') && form.threat_type_other
      ? form.threat_type.map((t) => t === 'Other' ? `Other: ${form.threat_type_other}` : t).join(', ')
      : form.threat_type.join(', ');
    drawRow('Threat Type(s)', threatTypeVal, normalH);
    const serviceTypeVal = form.service_request_type.includes('Other') && form.service_request_type_other
      ? form.service_request_type.map((t) => t === 'Other' ? `Other: ${form.service_request_type_other}` : t).join(', ')
      : form.service_request_type.join(', ');
    drawRow('Service Request Type(s)', serviceTypeVal, normalH);
    drawRow('New / Current', form.new_current, normalH);
    drawRow('Description of Service Request', form.service_description, largeH);
    drawRow('Target Name', form.target_name, normalH);
    drawRow('Target Type', form.target_type, normalH);
    drawRow('Target Business Location / Address / Website', form.business_location, normalH);
    drawRow('Type of Product Involved', form.product_type, normalH);
    drawRow('Describe if Product Requires Special Needs', form.product_special_needs, normalH);
    const intendedUseVal = form.intended_use === 'Other' && form.intended_use_other
      ? `Other: ${form.intended_use_other}`
      : form.intended_use;
    drawRow('Intended Use of Findings', intendedUseVal, normalH);
    drawRow('Additional Information', form.additional_info, largeH);

    drawSection('SEC-3');
    drawRow('Type of Product(s) to be Purchased', form.tp_product_type, largeH);
    drawRow('Buying Link(s)', form.tp_buying_links, largeH);
    drawRow('Test Purchase Level', form.tp_level, largeH);
    drawRow('Evidentiary Standard Product Purchase', form.tp_evidentiary_standard, normalH);
    drawRow('Quantities to be Purchased', form.tp_quantities, largeH);
    drawRow('Does Client Require Product Shipped for Analysis?', form.tp_shipped, normalH);
    if (form.tp_shipped === 'Yes') drawRow('If Yes — Where to (Country / City)', form.tp_shipped_location, normalH);
    drawRow('Any Specific Paperwork to be Shipped with Product', form.tp_paperwork, normalH);
    drawRow('Deadline (Y/N)', form.tp_deadline, normalH);

    drawSection('SEC-4');
    drawRow('Internal - IPH', form.gfi_internal_iph, normalH);
    drawRow('External - Service Partner (SP)', form.gfi_external_sp, normalH);
    drawRow('Service Partner PoC (SP)', form.gfi_sp_poc, normalH);
    drawRow('Assigned Region', form.gfi_region, normalH);
    drawRow('IPH FI Regional Manager', form.gfi_regional_manager, normalH);

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
            <h1>Field Investigation &amp; Test Purchase Intake Form</h1>
            <div className="sub">
              Complete all required fields (marked <span className="required-inline">*</span>) and as many optional fields as you can. When finished, generate the PDF and email it, with any supporting materials, to <a href="mailto:gfi@ip-house.com">gfi@ip-house.com</a>.
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
              <SectionHead num="01" title="Request Details" helper="" />
              <div className="field-grid">
                <DateField id="date" label="Date" value={form.date} onChange={(v) => setField('date', v)} required />
                <TextField id="case_reference" label="Case Reference" value={form.case_reference} onChange={(v) => setField('case_reference', v)} placeholder="[any known internal IPH reference]" optional />
                <TextField id="iph_manager" label="IPH Requester" value={form.iph_manager} onChange={(v) => setField('iph_manager', v)} required />
                <TextField id="iph_department" label="IPH Department" value={form.iph_department} onChange={(v) => setField('iph_department', v)} required />
                <TextField id="email_address" label="Email Address" value={form.email_address} onChange={(v) => setField('email_address', v)} />
                <TextField id="requesting_region" label="IPH Requestor's Location (e.g., City and Territory)" value={form.requesting_region} onChange={(v) => setField('requesting_region', v)} />
                <RadioField id="client_status" label="Client (New or Existing)" value={form.client_status} onChange={(v) => setField('client_status', v)} options={['Existing client', 'New client']} required />
                <TextField id="client" label="Client / Brand Name (in HubSpot)" value={form.client} onChange={(v) => setField('client', v)} placeholder="[brand name]" required />
                <TextField id="third_party" label="Third Party Request" value={form.third_party} onChange={(v) => setField('third_party', v)} placeholder="[if approached through Attorney Firm]" optional />
                <TextField id="client_reference" label="Client Reference" value={form.client_reference} onChange={(v) => setField('client_reference', v)} placeholder="[if applicable]" optional />
                <TextField id="project_name" label="Project Name" value={form.project_name} onChange={(v) => setField('project_name', v)} placeholder="[If applicable]" optional />
                <TextField id="budget" label="Specific Budget / Costs" value={form.budget} onChange={(v) => setField('budget', v)} placeholder="[If applicable or known]" optional />
                <RadioField id="cost_proposal" label="Cost Proposal Requested" value={form.cost_proposal} onChange={(v) => setField('cost_proposal', v)} options={['Yes', 'No']} optional />
              </div>
            </section>

            {/* ── Section 02: Service Request ───────────────────────────────── */}
            <section className="section" id="sec-2">
              <SectionHead num="02" title="Service Request" helper="" />
              <div className="field-grid">
                <TextField id="country" label="Territory (include Cit(ies) if known)" value={form.country} onChange={(v) => setField('country', v)} required />
                <TextField id="new_current" label="New / Current" value={form.new_current} onChange={(v) => setField('new_current', v)} placeholder="[is this a new or part of an ongoing investigation]" />
                <CheckboxField
                  id="threat_type"
                  label="Threat Type"
                  required
                  span
                  values={form.threat_type}
                  options={THREAT_TYPES}
                  onChange={(v, checked) => toggleArray('threat_type', v, checked)}
                />
                {form.threat_type.includes('Other') && (
                  <div className="field span-2">
                    <label htmlFor="threat_type_other">Please specify threat type <span className="req">*</span></label>
                    <textarea id="threat_type_other" rows={2} value={form.threat_type_other} placeholder="Describe the threat type" onChange={(e) => setField('threat_type_other', e.target.value)} />
                  </div>
                )}
                <CheckboxField
                  id="service_request_type"
                  label="Service Request Type"
                  required
                  span
                  values={form.service_request_type}
                  options={SERVICE_REQUEST_TYPES}
                  onChange={(v, checked) => toggleArray('service_request_type', v, checked)}
                />
                {form.service_request_type.includes('Other') && (
                  <div className="field span-2">
                    <label htmlFor="service_request_type_other">Please specify service request type <span className="req">*</span></label>
                    <textarea id="service_request_type_other" rows={2} value={form.service_request_type_other} placeholder="Describe the service request type" onChange={(e) => setField('service_request_type_other', e.target.value)} />
                  </div>
                )}
                <TextareaField id="service_description" label="Description of Service Request" value={form.service_description} onChange={(v) => setField('service_description', v)} placeholder="[any additional detail about the scope of the request]" span rows={3} required />
                <TextField id="target_name" label="Target Name" value={form.target_name} onChange={(v) => setField('target_name', v)} placeholder="[subject of the investigation]" required />
                <TextField id="target_type" label="Target Type" value={form.target_type} onChange={(v) => setField('target_type', v)} placeholder="[person, business company, group, address]" />
                <TextField id="business_location" label="Target Business Location / Address / Website" value={form.business_location} onChange={(v) => setField('business_location', v)} placeholder="[if known]" span optional />
                <TextField id="product_type" label="Type of Product Involved" value={form.product_type} onChange={(v) => setField('product_type', v)} placeholder="[brand, product, SKU]" />
                <TextField id="product_special_needs" label="Describe if Product Requires Special Needs" value={form.product_special_needs} onChange={(v) => setField('product_special_needs', v)} placeholder="[for example, cold storage]" />
                <CustomSelect id="intended_use" label="Intended Use of Findings" optional span value={form.intended_use} onChange={(v) => setField('intended_use', v)} options={INTENDED_USE_OPTIONS} />
                {form.intended_use === 'Other' && (
                  <div className="field span-2">
                    <label>Please specify <span className="req">*</span></label>
                    <textarea
                      rows={3}
                      value={form.intended_use_other}
                      placeholder="Please specify the intended use of findings"
                      onChange={(e) => setField('intended_use_other', e.target.value)}
                    />
                  </div>
                )}
                <div className="field span-2" style={{display:'none'}}>{/* placeholder to keep grid intact */}
                </div>
                <TextareaField id="additional_info" label="Additional Information" value={form.additional_info} onChange={(v) => setField('additional_info', v)} placeholder="[any information which provides context to the service/support request]" span rows={3} optional />
              </div>
            </section>

            {/* ── Section 03: Test Purchase Details ────────────────────────── */}
            <section className="section" id="sec-3">
              <SectionHead num="03" title="Test Purchase Details" helper="" />
              <div className="section-notice">
                <span className="badge">!</span>
                <div className="body">
                  <p>Complete this section only if a test purchase is required. Leave blank if not applicable. Images of products can be attached to your email alongside the PDF.</p>
                </div>
              </div>
              <div className="field-grid">
                <TextareaField id="tp_product_type" label="Type of Product(s) to be Purchased" value={form.tp_product_type} onChange={(v) => setField('tp_product_type', v)} placeholder="[full description]" span rows={3} optional />
                <div className="field span-2">
                  <label>Product Images <span className="opt">- optional</span></label>
                  <div
                    className={`img-upload-zone${dragOver ? ' drag-over' : ''}`}
                    onClick={() => document.getElementById('img-upload-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageFiles(e.dataTransfer.files); }}
                  >
                    <input id="img-upload-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleImageFiles(e.target.files)} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="upload-label">Click to upload or drag &amp; drop images</span>
                    <span className="upload-hint">PNG, JPG, WEBP · multiple files supported</span>
                  </div>
                  {productImages.length > 0 && (
                    <div className="img-preview-header">
                      <span className="img-preview-count">{productImages.length} image{productImages.length > 1 ? 's' : ''} uploaded</span>
                      {productImages.length > 1 && (
                        <button type="button" className="img-remove-all-btn" onClick={() => setProductImages([])}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          Remove all
                        </button>
                      )}
                    </div>
                  )}
                  {productImages.length > 0 && (
                    <div className="img-preview-grid">
                      {productImages.map((img, i) => (
                        <div className="img-preview-card" key={i}>
                          <div className="img-preview-thumb-wrap" onClick={() => setPreviewIndex(i)}>
                            <img src={img.url} alt={img.name} className="img-preview-thumb" />
                            <div className="img-preview-overlay">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </div>
                          </div>
                          <div className="img-preview-meta">
                            <span className="img-preview-name">{img.name}</span>
                            <button type="button" className="img-remove-btn" onClick={() => removeImage(i)} title="Remove">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <TextareaField id="tp_buying_links" label="Buying Link(s)" value={form.tp_buying_links} onChange={(v) => setField('tp_buying_links', v)} placeholder="[if applicable]" span rows={2} optional />
                <CustomSelect id="tp_level" label="Test Purchase Level" optional span value={form.tp_level} onChange={(v) => setField('tp_level', v)} options={TP_LEVEL_OPTIONS} />
                <div className="field span-2">
                  <label>Evidentiary Standard Product Purchase (e.g., for potential use with law enforcement or with the courts)? <span className="opt">- optional</span></label>
                  <div style={{maxWidth:'50%'}}><div className="chip-group radio-pair">{['Yes','No'].map((opt)=>(<label key={opt}><input type="radio" name="tp_evidentiary_standard" value={opt} checked={form.tp_evidentiary_standard===opt} onChange={()=>setField('tp_evidentiary_standard',opt)}/>{opt}</label>))}</div></div>
                </div>
                <TextareaField id="tp_quantities" label="Quantities to be Purchased" value={form.tp_quantities} onChange={(v) => setField('tp_quantities', v)} placeholder="[how many per product type]" span rows={2} optional />
                <RadioField id="tp_shipped" label="Does Client Require Product Shipped for Analysis?" value={form.tp_shipped} onChange={(v) => setField('tp_shipped', v)} options={['Yes', 'No']} optional />
                {form.tp_shipped === 'Yes' && (
                  <TextField id="tp_shipped_location" label="If Yes — Where to (Country / City)" value={form.tp_shipped_location} onChange={(v) => setField('tp_shipped_location', v)} placeholder="e.g. United Kingdom, London" span />
                )}
                <TextField id="tp_paperwork" label="Any Specific Paperwork to be Shipped with Product" value={form.tp_paperwork} onChange={(v) => setField('tp_paperwork', v)} placeholder="[Client Chain of Custody, Shipping documents etc.]" span optional />
                <TextField id="tp_deadline" label="Deadline (Y/N)" value={form.tp_deadline} onChange={(v) => setField('tp_deadline', v)} placeholder="[if applicable or specifically required by a date]" span optional />
              </div>
            </section>

            {/* ── Section 04: GFI Internal Use Only ────────────────────────── */}
            <section className="section" id="sec-4">
              <SectionHead num="04" title="GFI Internal Use Only" helper="" />
              <div className="field-grid">
                <TextField id="gfi_internal_iph" label="Internal - IPH" value={form.gfi_internal_iph} onChange={(v) => setField('gfi_internal_iph', v)} placeholder="[assigned to]" optional />
                <TextField id="gfi_external_sp" label="External - Service Partner (SP)" value={form.gfi_external_sp} onChange={(v) => setField('gfi_external_sp', v)} placeholder="[company/individual person/investigator name]" optional />
                <TextField id="gfi_sp_poc" label="Service Partner PoC (SP)" value={form.gfi_sp_poc} onChange={(v) => setField('gfi_sp_poc', v)} placeholder="[lead investigator]" optional />
                <TextField id="gfi_region" label="Assigned Region" value={form.gfi_region} onChange={(v) => setField('gfi_region', v)} placeholder="[assigned to AMS, LATAM, MEA, APAC]" optional />
                <TextField id="gfi_regional_manager" label="IPH FI Regional Manager" value={form.gfi_regional_manager} onChange={(v) => setField('gfi_regional_manager', v)} placeholder="[case owner]" optional />
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
            <div className="submit-target">Email PDF to <code><span>gfi</span><span>@</span><span>ip-house</span><span>.com</span></code></div>
            <button type="button" className="btn btn-accent" onClick={generatePDF} disabled={!jspdfReady}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
      {previewIndex !== null && productImages[previewIndex] && (
        <div className="img-modal-backdrop" onClick={() => setPreviewIndex(null)}>
          <div className="img-modal" onClick={(e) => e.stopPropagation()}>
            <div className="img-modal-header">
              <span className="img-modal-name">{productImages[previewIndex].name}</span>
              <span className="img-modal-counter">{previewIndex + 1} / {productImages.length}</span>
              <button type="button" className="img-modal-close" onClick={() => setPreviewIndex(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="img-modal-body">
              <img src={productImages[previewIndex].url} alt={productImages[previewIndex].name} className="img-modal-img" />
            </div>
            {productImages.length > 1 && (
              <div className="img-modal-nav">
                <button type="button" className="img-modal-nav-btn" onClick={() => setPreviewIndex(i => i !== null ? (i - 1 + productImages.length) % productImages.length : 0)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Previous
                </button>
                <div className="img-modal-dots">
                  {productImages.map((_, i) => (
                    <button key={i} type="button" className={`img-modal-dot${i === previewIndex ? ' active' : ''}`} onClick={() => setPreviewIndex(i)} />
                  ))}
                </div>
                <button type="button" className="img-modal-nav-btn" onClick={() => setPreviewIndex(i => i !== null ? (i + 1) % productImages.length : 0)}>
                  Next
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx global>{fieldIntakeCss}</style>
    </>
  );
}

function SectionHead({ num, title, helper }: { num: string; title: string; helper: string }) {
  return (
    <div className={`section-head${helper ? '' : ' no-helper'}`}>
      <div>
        <div className="eyebrow">SECTION {num}</div>
        <h2>{title}</h2>
      </div>
      {helper && <div className="helper">{helper}</div>}
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');
  const ref = useRef<HTMLDivElement>(null);

  const parsed = props.value ? new Date(`${props.value}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const [yearPage, setYearPage] = useState(Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setMode('day'); }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    props.onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false); setMode('day');
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const displayVal = parsed
    ? parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const years = Array.from({ length: 12 }, (_, i) => yearPage + i);

  return (
    <div className={`field${props.span ? ' span-2' : ''}`} ref={ref} style={{ position: 'relative' }}>
      <label>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <button type="button" className={`dp-trigger${open ? ' dp-open' : ''}`} onClick={() => { setOpen(o => !o); setMode('day'); }}>
        <span className={displayVal ? 'dp-val' : 'dp-placeholder'}>{displayVal || 'Select a date'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>

      {open && (
        <div className="dp-popup">

          {/* ── Day view ── */}
          {mode === 'day' && (
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav" onClick={prevMonth}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="dp-header-labels">
                  <button type="button" className="dp-month-btn" onClick={() => setMode('month')}>{MONTHS[viewMonth]}</button>
                  <button type="button" className="dp-year-btn" onClick={() => { setYearPage(Math.floor(viewYear / 12) * 12); setMode('year'); }}>{viewYear}</button>
                </div>
                <button type="button" className="dp-nav" onClick={nextMonth}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="dp-grid">
                {DAYS.map(d => <div className="dp-day-name" key={d}>{d}</div>)}
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const cellDate = new Date(viewYear, viewMonth, day);
                  const isSelected = parsed && cellDate.toDateString() === parsed.toDateString();
                  const isToday = cellDate.toDateString() === today.toDateString();
                  return (
                    <button key={day} type="button"
                      className={`dp-day${isSelected ? ' dp-selected' : ''}${isToday && !isSelected ? ' dp-today' : ''}`}
                      onClick={() => selectDay(day)}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Month view ── */}
          {mode === 'month' && (
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav" onClick={() => setViewYear(y => y - 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" className="dp-year-btn" onClick={() => { setYearPage(Math.floor(viewYear / 12) * 12); setMode('year'); }}>{viewYear}</button>
                <button type="button" className="dp-nav" onClick={() => setViewYear(y => y + 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="dp-month-grid">
                {MONTHS_SHORT.map((m, i) => (
                  <button key={m} type="button"
                    className={`dp-month-cell${viewMonth === i ? ' dp-selected' : ''}${today.getMonth() === i && today.getFullYear() === viewYear ? ' dp-today' : ''}`}
                    onClick={() => { setViewMonth(i); setMode('day'); }}>
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Year view ── */}
          {mode === 'year' && (
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav" onClick={() => setYearPage(p => p - 12)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="dp-month-label">{yearPage} – {yearPage + 11}</span>
                <button type="button" className="dp-nav" onClick={() => setYearPage(p => p + 12)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="dp-month-grid">
                {years.map(y => (
                  <button key={y} type="button"
                    className={`dp-month-cell${viewYear === y ? ' dp-selected' : ''}${today.getFullYear() === y ? ' dp-today' : ''}`}
                    onClick={() => { setViewYear(y); setMode('month'); }}>
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}

          {props.value && (
            <div className="dp-footer">
              <button type="button" className="dp-clear" onClick={() => { props.onChange(''); setOpen(false); setMode('day'); }}>Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomSelect(props: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; required?: boolean; optional?: boolean; span?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={`field${props.span ? ' span-2' : ''}`} ref={ref} style={{ position: 'relative' }}>
      <label>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <button type="button" className={`csel-trigger${open ? ' csel-open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={props.value ? 'csel-val' : 'csel-placeholder'}>
          {props.value || (props.placeholder ?? '- Select -')}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`csel-chevron${open ? ' csel-chevron-up' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="csel-dropdown">
          {props.options.map((opt) => {
            const isSelected = props.value === opt;
            return (
              <button
                key={opt}
                type="button"
                className={`csel-option${isSelected ? ' csel-option-selected' : ''}`}
                onClick={() => { props.onChange(opt); setOpen(false); }}
              >
                <span className="csel-option-check">
                  {isSelected && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
          {props.value && (
            <button type="button" className="csel-clear" onClick={() => { props.onChange(''); setOpen(false); }}>
              Clear selection
            </button>
          )}
        </div>
      )}
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

function CheckboxField(props: { id: string; label: string; values: string[]; options: string[]; onChange: (v: string, checked: boolean) => void; required?: boolean; optional?: boolean; span?: boolean }) {
  return (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label>
        {props.label}{' '}
        {props.required ? <span className="req">*</span> : props.optional ? <span className="opt">- optional</span> : null}
      </label>
      <div className="chip-group">
        {props.options.map((opt) => (
          <label key={opt}>
            <input type="checkbox" name={props.id} value={opt} checked={props.values.includes(opt)} onChange={(e) => props.onChange(opt, e.target.checked)} />
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
.intake-page *,.intake-page *::before,.intake-page *::after{box-sizing:border-box}.app-bar{position:sticky;top:0;z-index:30;background:var(--iph-navy);color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);isolation:isolate}.app-bar .lockup{display:flex;align-items:center;gap:16px;min-width:0;flex-wrap:wrap}.app-bar .lockup .app-logo{height:32px;width:auto;display:block}.app-bar .pipe{width:1px;height:22px;background:rgba(255,255,255,.22);flex:none}.app-bar .teams{display:flex;align-items:center;gap:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.92)}.app-bar .teams .dot{width:4px;height:4px;border-radius:999px;background:rgba(255,255,255,.35);flex:none}.app-bar .meta{font-family:var(--font-mono);font-size:11.5px;color:rgba(255,255,255,.55);letter-spacing:.04em;white-space:nowrap}.page{max-width:var(--form-w);margin:28px auto 0;padding:0 32px}.form-head{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:28px 32px 24px;box-shadow:var(--shadow-1);margin-bottom:18px;position:relative;overflow:hidden}.form-head::before{content:"";position:absolute;top:0;right:0;width:180px;height:4px;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow))}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow));-webkit-background-clip:text;background-clip:text;color:transparent}.form-head h1{font-size:34px;font-weight:700;color:var(--iph-navy);margin:6px 0 8px;letter-spacing:-.02em;line-height:1.1}.sub{font-size:14.5px;color:var(--iph-gray);max-width:700px;line-height:1.55}.sub strong{color:var(--iph-ink);font-weight:600}.sub a{color:var(--iph-navy);font-weight:600;text-decoration-color:var(--iph-orange)}.required-inline{color:var(--iph-orange);font-weight:700}.progress{display:flex;gap:8px;margin-top:22px;padding-top:20px;border-top:1px solid var(--iph-gray-bg);flex-wrap:wrap}.chip{flex:1 1 0;min-width:130px;display:flex;flex-direction:column;gap:4px;padding:10px 12px 11px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper);cursor:pointer;transition:border-color .15s,background .15s,color .15s,box-shadow .15s;text-decoration:none;position:relative}.chip:hover{border-color:var(--iph-navy);background:#fff}.chip .head{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;color:var(--iph-gray);letter-spacing:.08em}.marker{width:12px;height:12px;border-radius:999px;border:1.5px solid var(--iph-gray-line);background:#fff;flex:none;display:inline-flex;align-items:center;justify-content:center}.lbl{font-size:13px;font-weight:600;color:var(--iph-navy)}.status{font-size:11px;font-weight:500;color:var(--iph-gray);margin-top:2px}.chip.is-required .marker{border-color:var(--iph-orange);box-shadow:0 0 0 2px rgba(252,147,76,.18)}.chip.is-required .status{color:var(--iph-orange);font-weight:600}.chip.is-complete{background:#fff;border-color:var(--iph-navy)}.chip.is-complete .head{color:var(--iph-navy)}.chip.is-complete .marker{border-color:var(--ok);background:var(--ok);box-shadow:none}.chip.is-complete .marker::after{content:"";width:6px;height:3px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translate(.5px,-.5px)}.chip.is-complete .status{color:var(--ok);font-weight:600}.draft-banner{display:none;align-items:center;gap:12px;background:#fff;border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-navy);border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--iph-ink);margin-bottom:14px}.draft-banner.visible{display:flex}.save-time{margin-left:auto;color:var(--iph-gray);font-size:12px;font-family:var(--font-mono)}.draft-banner button{background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-navy);font-family:inherit;font-size:12px;font-weight:600;padding:4px 10px;border-radius:var(--r-sm);cursor:pointer}.section{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:24px 28px 26px;box-shadow:var(--shadow-1);margin-bottom:16px;scroll-margin-top:100px}.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--iph-gray-bg)}.section-head.no-helper{display:block}.section-head .eyebrow{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;color:var(--iph-gray);background:none;-webkit-text-fill-color:currentColor}.section-head h2{font-size:22px;font-weight:700;color:var(--iph-navy);margin:6px 0 0;letter-spacing:-.015em;line-height:1.2}.helper{font-size:13px;color:var(--iph-gray);max-width:320px;line-height:1.5;text-align:right;flex:0 0 auto}.field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px}.span-2{grid-column:span 2}.field{display:flex;flex-direction:column;min-width:0}.field>label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--iph-navy);margin-bottom:6px;display:flex;align-items:baseline;flex-wrap:wrap;gap:6px}.req{color:var(--iph-orange);font-weight:700;margin-left:-2px}.opt{color:var(--iph-gray);font-weight:500;letter-spacing:.01em;text-transform:none;font-size:11px}.intake-page input[type=text],.intake-page input[type=email],.intake-page input[type=tel],.intake-page input[type=url],.intake-page input[type=number],.intake-page input[type=date],.intake-page select,.intake-page textarea{width:100%;font-family:var(--font-sans);font-size:14.5px;color:var(--iph-ink);background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;transition:border-color .12s,box-shadow .12s,background .12s;outline:none;line-height:1.5}.intake-page textarea{resize:vertical;min-height:88px;line-height:1.55}.intake-page input:focus,.intake-page select:focus,.intake-page textarea:focus{border-color:var(--iph-navy);box-shadow:0 0 0 3px rgba(13,36,75,.12)}.intake-page input::placeholder,.intake-page textarea::placeholder{color:#A6AEBC}.chip-group{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.chip-group.radio-pair{grid-template-columns:1fr 1fr}.chip-group>label{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:#fff;font-size:13.5px;color:var(--iph-ink);cursor:pointer;user-select:none;transition:border-color .12s,background .12s,color .12s;line-height:1.35}.chip-group>label:hover{border-color:var(--iph-navy);background:var(--iph-paper)}.chip-group input[type=radio],.chip-group input[type=checkbox]{width:16px;height:16px;accent-color:var(--iph-navy);flex:none;cursor:pointer}.chip-group>label:has(input:checked){border-color:var(--iph-navy);background:#F1F5FB;color:var(--iph-navy);font-weight:600;box-shadow:inset 0 0 0 1px var(--iph-navy)}.section-notice{display:flex;gap:14px;background:var(--warn-soft);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-orange);border-radius:var(--r-sm);padding:16px 18px;margin-bottom:20px;line-height:1.55}.badge{flex:none;width:22px;height:22px;background:var(--iph-orange);color:#fff;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-top:1px}.section-notice .body{flex:1;min-width:0}.section-notice p{margin:0;font-size:13.5px;color:var(--iph-ink)}.action-bar{position:fixed;bottom:0;left:0;right:0;z-index:30;background:#fff;border-top:1px solid var(--iph-gray-line);box-shadow:0 -4px 14px rgba(13,36,75,.05)}.action-bar .inner{max-width:var(--form-w);margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.state{font-size:12.5px;color:var(--iph-gray);display:flex;align-items:center;gap:8px;flex:1;min-width:200px}.state .dot{width:7px;height:7px;border-radius:999px;background:var(--ok);flex:none}.state strong{color:var(--iph-ink);font-weight:600}.submit-target{font-size:12.5px;color:var(--iph-gray);display:inline-flex;align-items:center;gap:6px}.submit-target code{background:var(--iph-gray-bg);color:var(--iph-navy);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px}.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-sans);font-size:14px;font-weight:600;padding:11px 22px;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:transform .12s,box-shadow .15s,background .15s,border-color .15s;white-space:nowrap;line-height:1}.btn-accent{background:linear-gradient(15deg,var(--iph-orange) 0%,var(--iph-yellow) 100%);color:var(--iph-navy);font-weight:700;box-shadow:0 1px 2px rgba(252,147,76,.25)}.btn-accent:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(252,147,76,.32)}.btn-accent svg{width:16px;height:16px}.btn:disabled{opacity:.7;cursor:not-allowed}.form-footer{max-width:var(--form-w);margin:28px auto 0;padding:18px 32px 8px;border-top:1px solid var(--iph-gray-bg);display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--iph-gray);line-height:1.55}.conf{font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--iph-navy)}.legal{max-width:760px}
.img-preview-thumb-wrap{position:relative;cursor:pointer;overflow:hidden}.img-preview-overlay{position:absolute;inset:0;background:rgba(13,36,75,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}.img-preview-thumb-wrap:hover .img-preview-overlay{opacity:1}.img-modal-backdrop{position:fixed;inset:0;z-index:200;background:rgba(8,24,50,.72);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)}.img-modal{background:#fff;border-radius:var(--r-lg);box-shadow:0 24px 60px rgba(13,36,75,.28);max-width:min(880px,100%);width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden}.img-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--iph-gray-bg)}.img-modal-name{font-size:13px;font-weight:600;color:var(--iph-navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.img-modal-close{flex:none;background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-gray);width:30px;height:30px;border-radius:var(--r-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s}.img-modal-close:hover{color:var(--danger);border-color:#E8B5B5;background:var(--danger-soft)}.img-modal-counter{font-size:12px;color:var(--iph-gray);font-family:var(--font-mono);margin-left:auto;margin-right:8px;white-space:nowrap}.img-modal-body{overflow:auto;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--iph-paper);flex:1}.img-modal-img{max-width:100%;max-height:62vh;object-fit:contain;border-radius:var(--r-sm);box-shadow:var(--shadow-1)}.img-modal-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-top:1px solid var(--iph-gray-bg)}.img-modal-nav-btn{display:flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-navy);font-family:var(--font-sans);font-size:13px;font-weight:600;padding:7px 14px;border-radius:var(--r-sm);cursor:pointer;transition:all .12s}.img-modal-nav-btn:hover{background:var(--iph-navy);color:#fff;border-color:var(--iph-navy)}.img-modal-nav-btn:hover svg{stroke:#fff}.img-modal-dots{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}.img-modal-dot{width:8px;height:8px;border-radius:999px;background:var(--iph-gray-line);border:none;cursor:pointer;padding:0;transition:background .15s,transform .15s}.img-modal-dot.active{background:var(--iph-navy);transform:scale(1.3)}
.img-upload-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px dashed var(--iph-gray-line);border-radius:var(--r-lg);padding:24px 20px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s;min-height:120px}.img-upload-zone:hover,.img-upload-zone.drag-over{border-color:var(--iph-navy);background:#F1F5FB}.upload-icon{color:var(--iph-gray);flex:none;transition:color .15s}.img-upload-zone:hover .upload-icon,.img-upload-zone.drag-over .upload-icon{color:var(--iph-navy)}.upload-label{font-size:14px;font-weight:600;color:var(--iph-navy)}.upload-hint{font-size:12px;color:var(--iph-gray)}.img-preview-header{display:flex;align-items:center;justify-content:space-between;margin-top:14px;margin-bottom:2px}.img-preview-count{font-size:12.5px;font-weight:600;color:var(--iph-gray)}.img-remove-all-btn{display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid #E8B5B5;color:var(--danger);font-family:var(--font-sans);font-size:12px;font-weight:600;padding:5px 10px;border-radius:var(--r-sm);cursor:pointer;transition:all .12s}.img-remove-all-btn:hover{background:var(--danger-soft)}.img-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:14px}.img-preview-card{border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);overflow:hidden;background:#fff;box-shadow:var(--shadow-1)}.img-preview-thumb{width:100%;height:120px;object-fit:cover;display:block;background:var(--iph-paper)}.img-preview-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;border-top:1px solid var(--iph-gray-bg)}.img-preview-name{font-size:11px;color:var(--iph-ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}.img-remove-btn{flex:none;background:transparent;border:none;cursor:pointer;color:var(--iph-gray);padding:2px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:color .12s,background .12s}.img-remove-btn:hover{color:var(--danger);background:var(--danger-soft)}.img-remove-btn svg{width:14px;height:14px}
.csel-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-sans);font-size:14.5px;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;cursor:pointer;transition:border-color .12s,box-shadow .12s;text-align:left}.csel-trigger:hover,.csel-trigger.csel-open{border-color:var(--iph-navy)}.csel-trigger.csel-open{box-shadow:0 0 0 3px rgba(13,36,75,.12)}.csel-placeholder{color:#A6AEBC}.csel-val{color:var(--iph-ink);font-weight:500;flex:1;min-width:0}.csel-chevron{color:var(--iph-gray);flex:none;transition:transform .2s}.csel-chevron-up{transform:rotate(180deg)}.csel-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:110;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(13,36,75,.13);overflow:hidden;animation:csel-in .12s ease}.csel-option{width:100%;display:flex;align-items:center;gap:10px;background:transparent;border:none;font-family:var(--font-sans);font-size:14px;color:var(--iph-ink);padding:10px 14px;cursor:pointer;text-align:left;transition:background .1s,color .1s;border-bottom:1px solid var(--iph-gray-bg)}.csel-option:last-of-type{border-bottom:none}.csel-option:hover{background:var(--iph-paper);color:var(--iph-navy)}.csel-option-selected{background:#F1F5FB;color:var(--iph-navy);font-weight:600}.csel-option-selected:hover{background:#E8EEF8}.csel-option-check{width:18px;height:18px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--iph-navy)}.csel-clear{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;border:none;border-top:1px solid var(--iph-gray-bg);font-family:var(--font-sans);font-size:12px;color:var(--iph-gray);padding:9px 14px;cursor:pointer;transition:color .12s,background .12s}.csel-clear:hover{color:var(--danger);background:var(--danger-soft)}@keyframes csel-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.dp-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-sans);font-size:14.5px;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;cursor:pointer;transition:border-color .12s,box-shadow .12s;text-align:left;color:var(--iph-ink)}.dp-trigger:hover,.dp-trigger.dp-open{border-color:var(--iph-navy)}.dp-trigger.dp-open{box-shadow:0 0 0 3px rgba(13,36,75,.12)}.dp-trigger svg{color:var(--iph-gray);flex:none}.dp-placeholder{color:#A6AEBC}.dp-val{color:var(--iph-ink);font-weight:500}.dp-popup{position:absolute;top:calc(100% + 6px);left:0;z-index:100;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(13,36,75,.14);padding:16px;width:280px}.dp-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.dp-month-label{font-size:14px;font-weight:700;color:var(--iph-navy)}.dp-nav{background:transparent;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--iph-navy);transition:background .12s,border-color .12s}.dp-nav:hover{background:var(--iph-paper);border-color:var(--iph-navy)}.dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.dp-day-name{font-size:11px;font-weight:600;color:var(--iph-gray);text-align:center;padding:4px 0;letter-spacing:.04em}.dp-day{background:transparent;border:none;border-radius:var(--r-sm);width:100%;aspect-ratio:1;font-family:var(--font-sans);font-size:13px;color:var(--iph-ink);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s}.dp-day:hover{background:var(--iph-paper);color:var(--iph-navy)}.dp-today{font-weight:700;color:var(--iph-orange)}.dp-selected{background:var(--iph-navy)!important;color:#fff!important;font-weight:700}.dp-header-labels{display:flex;align-items:center;gap:4px}.dp-month-btn,.dp-year-btn{background:transparent;border:none;font-family:var(--font-sans);font-size:14px;font-weight:700;color:var(--iph-navy);cursor:pointer;padding:3px 6px;border-radius:var(--r-sm);transition:background .12s}.dp-month-btn:hover,.dp-year-btn:hover{background:var(--iph-paper)}.dp-month-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}.dp-month-cell{background:transparent;border:1px solid transparent;border-radius:var(--r-sm);font-family:var(--font-sans);font-size:13px;color:var(--iph-ink);cursor:pointer;padding:8px 4px;text-align:center;transition:background .12s,color .12s,border-color .12s}.dp-month-cell:hover{background:var(--iph-paper);color:var(--iph-navy);border-color:var(--iph-gray-line)}.dp-month-cell.dp-today{font-weight:700;color:var(--iph-orange)}.dp-month-cell.dp-selected{background:var(--iph-navy)!important;color:#fff!important;font-weight:700;border-color:var(--iph-navy)}.dp-footer{border-top:1px solid var(--iph-gray-bg);margin-top:10px;padding-top:10px;display:flex;justify-content:flex-end}.dp-clear{background:transparent;border:none;font-family:var(--font-sans);font-size:12px;color:var(--iph-gray);cursor:pointer;padding:2px 6px;border-radius:4px}.dp-clear:hover{color:var(--danger)}@media(max-width:720px){.app-bar{padding:12px 16px}.meta{display:none}.page{padding:0 16px;margin-top:16px}.form-head{padding:22px 20px 20px}.form-head h1{font-size:26px}.section{padding:20px 18px}.section-head{flex-direction:column;gap:4px}.helper{text-align:left;max-width:none}.field-grid{grid-template-columns:1fr}.span-2{grid-column:1}.action-bar .inner{padding:12px 16px}.state{flex-basis:100%;min-width:0}.submit-target{display:none}.form-footer{padding:14px 16px 8px}}
`;
