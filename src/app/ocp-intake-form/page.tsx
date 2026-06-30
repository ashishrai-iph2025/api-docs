'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';

const DRAFT_KEY = 'ocp_intake_draft_v1';

const CONTENT_TYPES = [
  'Live Piracy',
  'VOD',
  'Audiobooks',
  'Music',
  'EBooks',
  'Games',
  'Anime',
  'Software',
  'News',
  'Other',
];

const OPERATIONAL_SERVICES = [
  'Detection & Disruption',
  'Monitoring Only',
  'Search Engine Delisting',
  'TRAC Monitoring Service',
  'Leak Containment',
  'Gen AI Threat Assessment',
  'WAR Room',
  'OSINT',
  'Other',
];

const SERVICE_REQUEST_TYPES = [
  'POC',
  'Landscaping',
  'Ongoing Monitoring',
  'Event-Based Coverage',
  'Ad-hoc Request',
];

const MONITORING_PERIODS = [
  'One-off',
  'Weekly',
  'Monthly',
  'Quarterly',
  'Annually',
  'Event-specific',
  'Other',
];

const PLATFORM_TYPES = [
  'Pirate Websites',
  'Search Engines',
  'UGC / Social Media Platforms',
  'Messenger Apps (Telegram)',
  'Mobile Apps',
  'IPTV',
  'Others',
];

const EXPECTED_DELIVERABLES = [
  'Daily Updates',
  'Weekly Report',
  'Monthly Report',
  'Executive Summary',
  'Live Event Updates',
  'Dashboard',
  'Raw Data Export',
  'Other',
];

const REPORTING_FREQUENCIES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Event-based',
];

const initialForm = {
  date: '',
  requestor_name: '',
  department: '',
  client_status: '',
  client_name: '',
  third_party: '',
  cost_proposal: '',
  requested_start_date: '',
  deadline: '',
  content_type: [] as string[],
  content_type_other: '',
  operational_services: [] as string[],
  operational_services_other: '',
  service_request_type: '',
  num_titles_events: '',
  title_event_names: '',
  monitoring_period: '',
  monitoring_period_other: '',
  platforms: [] as string[],
  platforms_other: '',
  platform_names: '',
  geography: '',
  geography_details: '',
  language_requirements: '',
  allowlist_available: '',
  allowlist_details: '',
  expected_deliverables: [] as string[],
  reporting_frequency: '',
  additional_context: '',
  ocp_poc_name: '',
  proposed_resources_hours: '',
  proposed_commercials: '',
  kickoff_date: '',
  internal_notes: '',
};

const sections = [
  ['sec-1', 'Request Details', true],
  ['sec-2', 'Scope of Work', true],
  ['sec-3', 'Coverage Requirements', true],
  ['sec-5', 'Internal Use Only', false],
] as const;

export default function OcpIntakeFormPage() {
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

  function toggleArray(name: 'content_type' | 'operational_services' | 'platforms' | 'expected_deliverables', value: string, checked: boolean) {
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

  const progress = [
    !!form.date.trim() && !!form.requestor_name.trim() && !!form.department.trim() && !!form.client_name.trim(),
    form.content_type.length > 0 && form.operational_services.length > 0 && !!form.service_request_type && !!form.num_titles_events.trim(),
    form.platforms.length > 0 && !!form.geography.trim() && form.expected_deliverables.length > 0 && !!form.reporting_frequency,
    !!form.ocp_poc_name.trim(),
  ];

  function generatePDF() {
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) return;
    const pdfDoc = new jsPDF({ unit: 'mm', format: 'a4' });
    generatePDFContent(pdfDoc);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const client = (form.client_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    pdfDoc.save(`${stamp}_OCP_Intake_${client}.pdf`);
    clearDraft();
  }

  function generatePDFContent(doc: any) {
    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const contentW = pageW - margin * 2;
    const col1W = 95;
    const col2Start = margin + col1W + 4;
    const col2W = pageW - col2Start - margin;
    let y = 0;
    const footerReserve = 20;

    const checkPage = (needed: number) => {
      if (y + needed > pageH - footerReserve) { doc.addPage(); y = margin; }
    };

    const addFieldPair = (label1: string, value1: string, label2: string, value2: string) => {
      checkPage(12);
      const baseY = y;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(13, 36, 75);
      doc.text(label1, margin + 1, baseY + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
      const val1Lines = doc.splitTextToSize(value1 || '—', col1W - 3);
      doc.text(val1Lines, margin + 1, baseY + 6);
      const h1 = Math.max(val1Lines.length * 3.5 + 8, 10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(13, 36, 75);
      doc.text(label2, col2Start + 1, baseY + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
      const val2Lines = doc.splitTextToSize(value2 || '—', col2W - 3);
      doc.text(val2Lines, col2Start + 1, baseY + 6);
      const h2 = Math.max(val2Lines.length * 3.5 + 8, 10);
      y += Math.max(h1, h2);
    };

    const addFullField = (label: string, value: string) => {
      checkPage(10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(13, 36, 75);
      doc.text(label, margin + 1, y + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
      const valLines = doc.splitTextToSize(value || '—', contentW - 3);
      doc.text(valLines, margin + 1, y + 6);
      y += Math.max(valLines.length * 3.5 + 8, 10);
    };

    const addSection = (num: string, title: string) => {
      checkPage(8); y += 12;
      doc.setFillColor(13, 36, 75);
      doc.rect(margin, y, contentW, 7.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(252, 147, 76);
      doc.text(`SECTION ${num}`, margin + 2.5, y + 2.5);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 2.5, y + 6);
      y += 14;
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    doc.setFillColor(13, 36, 75);
    const headerHeight = 52;
    doc.rect(0, y, pageW, headerHeight, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(252, 147, 76);
    doc.text('INTAKE > SCOPING > ESTIMATE > KICKOFF', margin + 3, y + 10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
    doc.text('IP HOUSE', pageW - margin - 3, y + 38, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    doc.text(dateStr, pageW - margin - 3, y + 43, { align: 'right' });
    doc.text(timeStr, pageW - margin - 3, y + 48, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(255, 255, 255);
    doc.text('OCP Intake Form', margin + 3, y + 24);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    doc.text('Online Content Protection · OCP Team', margin + 3, y + 32);
    y += headerHeight;

    doc.setFillColor(252, 147, 76);
    doc.rect(0, y, pageW, 5, 'F');
    y += 15;

    const bannerTop = y;
    const bannerHeight = 14;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, bannerTop, contentW, bannerHeight, 'F');
    doc.setFillColor(13, 36, 75);
    doc.rect(margin, bannerTop, 3.5, bannerHeight, 'F');
    doc.setDrawColor(190, 190, 190); doc.setLineWidth(0.3);
    doc.rect(margin, bannerTop, contentW, bannerHeight, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(13, 36, 75);
    doc.text('PLEASE EMAIL THIS PDF (WITH ANY SUPPORTING ATTACHMENTS) TO', margin + 5.5, bannerTop + 4.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
    doc.text('ocp@ip-house.com', margin + 5.5, bannerTop + 9.5);
    y += bannerHeight + 8;

    addSection('01', 'Request Details');
    addFieldPair('Date', form.date, 'Requestor Name', form.requestor_name);
    addFieldPair('Department', form.department, 'Client (New or Existing)', form.client_status);
    addFieldPair('Client Name', form.client_name, 'Third-Party Request', form.third_party || '—');
    addFieldPair('Cost Proposal Requested', form.cost_proposal || '—', 'Requested Start Date', form.requested_start_date || '—');
    addFullField('Deadline (if any)', form.deadline || '—');

    addSection('02', 'Scope of Work');
    const contentTypeVal = form.content_type.includes('Other') && form.content_type_other
      ? form.content_type.map(t => t === 'Other' ? `Other: ${form.content_type_other}` : t).join(', ')
      : form.content_type.join(', ');
    addFullField('Content Type(s)', contentTypeVal);
    const opsVal = form.operational_services.includes('Other') && form.operational_services_other
      ? form.operational_services.map(t => t === 'Other' ? `Other: ${form.operational_services_other}` : t).join(', ')
      : form.operational_services.join(', ');
    addFullField('Operational Services Required', opsVal);
    addFieldPair('Service Request Type', form.service_request_type, 'No. of Titles / Events', form.num_titles_events);
    addFullField('Title / Event Names', form.title_event_names);
    const monPeriodVal = form.monitoring_period === 'Other' && form.monitoring_period_other
      ? `Other: ${form.monitoring_period_other}`
      : form.monitoring_period;
    addFullField('Monitoring Period', monPeriodVal);

    addSection('03', 'Coverage Requirements');
    const platformVal = form.platforms.includes('Others') && form.platforms_other
      ? form.platforms.map(t => t === 'Others' ? `Others: ${form.platforms_other}` : t).join(', ')
      : form.platforms.join(', ');
    addFullField('Platforms', platformVal);
    addFullField('Platform Names (if known)', form.platform_names || '—');
    addFieldPair('Geography', form.geography, 'Geography Details', form.geography_details || '—');
    addFullField('Language Requirements', form.language_requirements || '—');
    addFieldPair('Allowlist Available', form.allowlist_available || '—', 'Allowlist Details', form.allowlist_details || '—');
    addFullField('Expected Deliverables', form.expected_deliverables.join(', '));
    addFullField('Reporting Frequency', form.reporting_frequency);
    addFullField('Additional Details / Background / Context', form.additional_context || '—');

    addSection('05', 'For Internal Use Only');
    addFieldPair('OCP PoC Name', form.ocp_poc_name, 'Proposed Resources / Hours', form.proposed_resources_hours);
    addFieldPair('Proposed Commercials', form.proposed_commercials, 'Kick-off Date', form.kickoff_date);
    addFullField('Internal Notes', form.internal_notes || '—');

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 208, 220); doc.setLineWidth(0.3);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(90, 100, 120);
      doc.text('IP HOUSE  ·  CONFIDENTIAL & PROPRIETARY', margin, pageH - 6);
      doc.text(`Page ${i}`, pageW - margin, pageH - 6, { align: 'right' });
      doc.text('Online Content Protection  ·  OCP Team', margin, pageH - 2);
    }
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
              <span>Online Content Protection</span>
            </div>
          </div>
          <div className="meta">OCP INTAKE FORM</div>
        </header>

        <main className="page">
          <div className="form-head">
            <div className="eyebrow">INTAKE &gt; SCOPING &gt; ESTIMATE &gt; KICKOFF</div>
            <h1>OCP Intake Form</h1>
            <div className="sub">
              Complete all required fields (marked <span className="required-inline">*</span>) and as many optional fields as you can. When finished, generate the PDF and email it, with any supporting materials, to <a href="mailto:ocp@ip-house.com">ocp@ip-house.com</a>.
            </div>
            <nav className="progress" aria-label="Form sections">
              {sections.map(([href, label, required], index) => (
                <a key={href} className={`chip ${progress[index] ? 'is-complete' : required ? 'is-required' : 'is-optional'}`} href={`#${href}`}>
                  <span className="head"><span className="marker" />{String(index + 1).padStart(2, '0')}</span>
                  <span className="lbl">{label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className={`draft-banner${restored ? ' visible' : ''}`}>
            <span>Draft restored from your last session.</span>
            <button type="button" onClick={clearDraft}>Clear draft</button>
            <span className="save-time">{savedAt ? `Last saved ${new Date(savedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span>
          </div>

          <form id="ocpIntakeForm" noValidate>

            {/* ── Section 01: Request Details ───────────────────────────────── */}
            <section className="section" id="sec-1">
              <SectionHead num="01" title="Request Details" helper="" />
              <div className="field-grid">
                <DateField id="date" label="Date" value={form.date} onChange={(v) => setField('date', v)} required />
                <TextField id="requestor_name" label="Requestor Name" value={form.requestor_name} onChange={(v) => setField('requestor_name', v)} required />
                <TextField id="department" label="Department" value={form.department} onChange={(v) => setField('department', v)} required />
                <RadioField id="client_status" label="Client (New or Existing)" value={form.client_status} onChange={(v) => setField('client_status', v)} options={['New', 'Existing']} required />
                <TextField id="client_name" label="Client Name" value={form.client_name} onChange={(v) => setField('client_name', v)} required />
                <TextField id="third_party" label="Third-Party Request" value={form.third_party} onChange={(v) => setField('third_party', v)} optional placeholder="[if applicable]" />
                <RadioField id="cost_proposal" label="Cost Proposal Requested" value={form.cost_proposal} onChange={(v) => setField('cost_proposal', v)} options={['Yes', 'No']} optional />
                <DateField id="requested_start_date" label="Requested Start Date" value={form.requested_start_date} onChange={(v) => setField('requested_start_date', v)} />
                <TextField id="deadline" label="Deadline (if any)" value={form.deadline} onChange={(v) => setField('deadline', v)} placeholder="[specify date or timeframe]" span />
              </div>
            </section>

            {/* ── Section 02: Scope of Work ─────────────────────────────────── */}
            <section className="section" id="sec-2">
              <SectionHead num="02" title="Scope of Work" helper="" />
              <div className="field-grid">

                <CheckboxField
                  id="content_type"
                  label="Content Type (Select all applicable)"
                  required
                  span
                  values={form.content_type}
                  options={CONTENT_TYPES}
                  onChange={(v, checked) => toggleArray('content_type', v, checked)}
                />
                {form.content_type.includes('Other') && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="content_type_other">Please specify content type <span className="req">*</span></label>
                    <textarea id="content_type_other" rows={2} value={form.content_type_other} placeholder="Describe the content type" onChange={(e) => setField('content_type_other', e.target.value)} />
                  </div>
                )}

                <CheckboxField
                  id="operational_services"
                  label="Operational Services Required (Select all applicable)"
                  required
                  span
                  values={form.operational_services}
                  options={OPERATIONAL_SERVICES}
                  onChange={(v, checked) => toggleArray('operational_services', v, checked)}
                />
                {form.operational_services.includes('Other') && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="operational_services_other">Please specify service <span className="req">*</span></label>
                    <textarea id="operational_services_other" rows={2} value={form.operational_services_other} placeholder="Describe the operational service" onChange={(e) => setField('operational_services_other', e.target.value)} />
                  </div>
                )}

                <div className="field span-2">
                  <label>Service Request Type <span className="req">*</span></label>
                  <div className="chip-group">
                    {SERVICE_REQUEST_TYPES.map((opt) => (
                      <label key={opt}>
                        <input type="radio" name="service_request_type" value={opt} checked={form.service_request_type === opt} onChange={() => setField('service_request_type', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <TextField id="num_titles_events" label="No. of Titles / Events" value={form.num_titles_events} onChange={(v) => setField('num_titles_events', v)} required placeholder="[enter number]" />
                <div />

                <TextareaField id="title_event_names" label="Title / Event Names" value={form.title_event_names} onChange={(v) => setField('title_event_names', v)} placeholder="[list all titles or events]" span rows={3} required />

                <div className="field span-2">
                  <label>Monitoring Period <span className="req">*</span></label>
                  <div className="chip-group">
                    {MONITORING_PERIODS.map((opt) => (
                      <label key={opt}>
                        <input type="radio" name="monitoring_period" value={opt} checked={form.monitoring_period === opt} onChange={() => setField('monitoring_period', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                {form.monitoring_period === 'Other' && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="monitoring_period_other">Please specify monitoring period <span className="req">*</span></label>
                    <textarea id="monitoring_period_other" rows={2} value={form.monitoring_period_other} placeholder="Describe the monitoring period" onChange={(e) => setField('monitoring_period_other', e.target.value)} />
                  </div>
                )}

              </div>
            </section>

            {/* ── Section 03: Coverage Requirements ────────────────────────── */}
            <section className="section" id="sec-3">
              <SectionHead num="03" title="Coverage Requirements" helper="" />
              <div className="field-grid">

                <CheckboxField
                  id="platforms"
                  label="Platforms"
                  required
                  span
                  values={form.platforms}
                  options={PLATFORM_TYPES}
                  onChange={(v, checked) => toggleArray('platforms', v, checked)}
                />
                {form.platforms.includes('Others') && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="platforms_other">Please specify platform(s) <span className="req">*</span></label>
                    <textarea id="platforms_other" rows={2} value={form.platforms_other} placeholder="Describe the platform(s)" onChange={(e) => setField('platforms_other', e.target.value)} />
                  </div>
                )}

                <TextareaField id="platform_names" label="Platform Names (if known)" value={form.platform_names} onChange={(v) => setField('platform_names', v)} placeholder="List specific platform names, URLs or app names" span rows={2} />

                <div className="field span-2">
                  <label>Geography <span className="req">*</span></label>
                  <div className="chip-group radio-pair">
                    {['Global (specify priority regions)', 'Geo-specific (specify regions)'].map((opt) => (
                      <label key={opt}>
                        <input type="radio" name="geography" value={opt} checked={form.geography === opt} onChange={() => setField('geography', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                {form.geography && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="geography_details">
                      {form.geography.startsWith('Global') ? 'Priority Regions' : 'Specify Regions'} <span className="req">*</span>
                    </label>
                    <textarea id="geography_details" rows={2} value={form.geography_details} placeholder="e.g. North America, Europe, Southeast Asia..." onChange={(e) => setField('geography_details', e.target.value)} />
                  </div>
                )}

                <TextareaField id="language_requirements" label="Language Requirements" value={form.language_requirements} onChange={(v) => setField('language_requirements', v)} placeholder="[specify any language requirements]" span rows={2} />

                <div className="field span-2">
                  <label>Allowlist Available <span className="opt">– Applicable for Notice and Takedowns</span></label>
                  <div className="chip-group radio-pair">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt}>
                        <input type="radio" name="allowlist_available" value={opt} checked={form.allowlist_available === opt} onChange={() => setField('allowlist_available', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                {form.allowlist_available === 'Yes' && (
                  <div className="field span-2 dynamic-field">
                    <label htmlFor="allowlist_details">Allowlist Details <span className="req">*</span></label>
                    <textarea id="allowlist_details" rows={3} value={form.allowlist_details} placeholder="Please provide official websites, URLs, domains, channels, apps, social media handles, or approved partners." onChange={(e) => setField('allowlist_details', e.target.value)} />
                  </div>
                )}

                <CheckboxField
                  id="expected_deliverables"
                  label="Expected Deliverables"
                  required
                  span
                  values={form.expected_deliverables}
                  options={EXPECTED_DELIVERABLES}
                  onChange={(v, checked) => toggleArray('expected_deliverables', v, checked)}
                />

                <div className="field span-2">
                  <label>Reporting Frequency <span className="req">*</span></label>
                  <div className="chip-group">
                    {REPORTING_FREQUENCIES.map((opt) => (
                      <label key={opt}>
                        <input type="radio" name="reporting_frequency" value={opt} checked={form.reporting_frequency === opt} onChange={() => setField('reporting_frequency', opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <TextareaField id="additional_context" label="Any Other Details / Background / Context" value={form.additional_context} onChange={(v) => setField('additional_context', v)} placeholder="[provide any additional information, background or context that would help the team]" span rows={4} />

              </div>
            </section>

            {/* ── Section 05: For Internal Use Only ────────────────────────── */}
            <section className="section" id="sec-5">
              <SectionHead num="05" title="For Internal Use Only" helper="" />
              <div className="section-notice">
                <span className="badge">!</span>
                <div className="body">
                  <p>This section is for OCP team use only. Do not share with clients or third parties.</p>
                </div>
              </div>
              <div className="field-grid">
                <TextField id="ocp_poc_name" label="OCP PoC Name" value={form.ocp_poc_name} onChange={(v) => setField('ocp_poc_name', v)} placeholder="[assigned point of contact]" />
                <TextField id="proposed_resources_hours" label="Proposed Resources / Hours" value={form.proposed_resources_hours} onChange={(v) => setField('proposed_resources_hours', v)} placeholder="[estimated effort]" />
                <TextField id="proposed_commercials" label="Proposed Commercials" value={form.proposed_commercials} onChange={(v) => setField('proposed_commercials', v)} placeholder="[pricing or commercial terms]" />
                <DateField id="kickoff_date" label="Kick-off Date" value={form.kickoff_date} onChange={(v) => setField('kickoff_date', v)} />
                <TextareaField id="internal_notes" label="Internal Notes" value={form.internal_notes} onChange={(v) => setField('internal_notes', v)} placeholder="[any internal notes, caveats or action items]" span rows={4} />
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
            <div className="submit-target">Email PDF to <code><span>ocp</span><span>@</span><span>ip-house</span><span>.com</span></code></div>
            <button type="button" className="btn btn-accent" onClick={generatePDF} disabled={!jspdfReady}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{ocpIntakeCss}</style>
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

const ocpIntakeCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
.intake-page{--iph-navy:#0D244B;--iph-navy-deep:#081832;--iph-ink:#3A3A3A;--iph-ink-soft:#595959;--iph-orange:#FC934C;--iph-yellow:#FFC82B;--iph-gray:#7C899C;--iph-gray-line:#C6CDD7;--iph-gray-bg:#E9ECEF;--iph-paper:#F6F7F9;--danger:#B73A3A;--danger-soft:#FDECEC;--warn-soft:#FFF4EB;--ok:#2E7D52;--font-sans:'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--shadow-1:0 1px 2px rgba(13,36,75,.06),0 1px 1px rgba(13,36,75,.04);--form-w:1080px;--r-sm:6px;--r-lg:12px;font-family:var(--font-sans);font-size:15px;line-height:1.55;color:var(--iph-ink);background:var(--iph-paper);min-height:100vh;padding-bottom:120px;font-feature-settings:"ss01","cv11";}
.intake-page *,.intake-page *::before,.intake-page *::after{box-sizing:border-box}.app-bar{position:sticky;top:0;z-index:30;background:var(--iph-navy);color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);isolation:isolate}.app-bar .lockup{display:flex;align-items:center;gap:16px;min-width:0;flex-wrap:wrap}.app-bar .lockup .app-logo{height:32px;width:auto;display:block}.app-bar .pipe{width:1px;height:22px;background:rgba(255,255,255,.22);flex:none}.app-bar .teams{display:flex;align-items:center;gap:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.92)}.app-bar .meta{font-family:var(--font-mono);font-size:11.5px;color:rgba(255,255,255,.55);letter-spacing:.04em;white-space:nowrap}.page{max-width:var(--form-w);margin:28px auto 0;padding:0 32px}.form-head{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:28px 32px 24px;box-shadow:var(--shadow-1);margin-bottom:18px;position:relative;overflow:hidden}.form-head::before{content:"";position:absolute;top:0;right:0;width:180px;height:4px;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow))}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:linear-gradient(15deg,var(--iph-orange),var(--iph-yellow));-webkit-background-clip:text;background-clip:text;color:transparent}.form-head h1{font-size:34px;font-weight:700;color:var(--iph-navy);margin:6px 0 8px;letter-spacing:-.02em;line-height:1.1}.sub{font-size:14.5px;color:var(--iph-gray);max-width:700px;line-height:1.55}.sub a{color:var(--iph-navy);font-weight:600;text-decoration-color:var(--iph-orange)}.required-inline{color:var(--iph-orange);font-weight:700}.progress{display:flex;gap:8px;margin-top:22px;padding-top:20px;border-top:1px solid var(--iph-gray-bg);flex-wrap:wrap}.chip{flex:1 1 0;min-width:130px;display:flex;flex-direction:column;gap:4px;padding:10px 12px 11px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:var(--iph-paper);cursor:pointer;transition:border-color .15s,background .15s,color .15s,box-shadow .15s;text-decoration:none;position:relative}.chip:hover{border-color:var(--iph-navy);background:#fff}.chip .head{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10.5px;font-weight:500;color:var(--iph-gray);letter-spacing:.08em}.marker{width:12px;height:12px;border-radius:999px;border:1.5px solid var(--iph-gray-line);background:#fff;flex:none;display:inline-flex;align-items:center;justify-content:center}.lbl{font-size:13px;font-weight:600;color:var(--iph-navy)}.chip.is-required .marker{border-color:var(--iph-orange);box-shadow:0 0 0 2px rgba(252,147,76,.18)}.chip.is-complete{background:#fff;border-color:var(--iph-navy)}.chip.is-complete .marker{border-color:var(--ok);background:var(--ok);box-shadow:none}.chip.is-complete .marker::after{content:"";width:6px;height:3px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translate(.5px,-.5px)}.draft-banner{display:none;align-items:center;gap:12px;background:#fff;border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-navy);border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--iph-ink);margin-bottom:14px}.draft-banner.visible{display:flex}.save-time{margin-left:auto;color:var(--iph-gray);font-size:12px;font-family:var(--font-mono)}.draft-banner button{background:transparent;border:1px solid var(--iph-gray-line);color:var(--iph-navy);font-family:inherit;font-size:12px;font-weight:600;padding:4px 10px;border-radius:var(--r-sm);cursor:pointer}.section{background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);padding:24px 28px 26px;box-shadow:var(--shadow-1);margin-bottom:16px;scroll-margin-top:100px}.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--iph-gray-bg)}.section-head.no-helper{display:block}.section-head .eyebrow{font-family:var(--font-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;color:var(--iph-gray);background:none;-webkit-text-fill-color:currentColor}.section-head h2{font-size:22px;font-weight:700;color:var(--iph-navy);margin:6px 0 0;letter-spacing:-.015em;line-height:1.2}.field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px}.span-2{grid-column:span 2}.field{display:flex;flex-direction:column;min-width:0}.field>label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--iph-navy);margin-bottom:6px;display:flex;align-items:baseline;flex-wrap:wrap;gap:6px}.req{color:var(--iph-orange);font-weight:700;margin-left:-2px}.opt{color:var(--iph-gray);font-weight:500;letter-spacing:.01em;text-transform:none;font-size:11px}.intake-page input[type=text],.intake-page input[type=email],.intake-page input[type=tel],.intake-page input[type=url],.intake-page input[type=number],.intake-page input[type=date],.intake-page select,.intake-page textarea{width:100%;font-family:var(--font-sans);font-size:14.5px;color:var(--iph-ink);background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;transition:border-color .12s,box-shadow .12s,background .12s;outline:none;line-height:1.5}.intake-page textarea{resize:vertical;min-height:88px;line-height:1.55}.intake-page input:focus,.intake-page select:focus,.intake-page textarea:focus{border-color:var(--iph-navy);box-shadow:0 0 0 3px rgba(13,36,75,.12)}.intake-page input::placeholder,.intake-page textarea::placeholder{color:#A6AEBC}.chip-group{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.chip-group.radio-pair{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}.chip-group>label{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);background:#fff;font-size:13.5px;color:var(--iph-ink);cursor:pointer;user-select:none;transition:border-color .12s,background .12s,color .12s;line-height:1.35}.chip-group>label:hover{border-color:var(--iph-navy);background:var(--iph-paper)}.chip-group input[type=radio],.chip-group input[type=checkbox]{width:16px;height:16px;accent-color:var(--iph-navy);flex:none;cursor:pointer}.chip-group>label:has(input:checked){border-color:var(--iph-navy);background:#F1F5FB;color:var(--iph-navy);font-weight:600;box-shadow:inset 0 0 0 1px var(--iph-navy)}.section-notice{display:flex;gap:14px;background:var(--warn-soft);border:1px solid var(--iph-gray-line);border-left:3px solid var(--iph-orange);border-radius:var(--r-sm);padding:16px 18px;margin-bottom:20px;line-height:1.55}.badge{flex:none;width:22px;height:22px;background:var(--iph-orange);color:#fff;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-top:1px}.section-notice .body{flex:1;min-width:0}.section-notice p{margin:0;font-size:13.5px;color:var(--iph-ink)}.action-bar{position:fixed;bottom:0;left:0;right:0;z-index:30;background:#fff;border-top:1px solid var(--iph-gray-line);box-shadow:0 -4px 14px rgba(13,36,75,.05)}.action-bar .inner{max-width:var(--form-w);margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.state{font-size:12.5px;color:var(--iph-gray);display:flex;align-items:center;gap:8px;flex:1;min-width:200px}.state .dot{width:7px;height:7px;border-radius:999px;background:var(--ok);flex:none}.state strong{color:var(--iph-ink);font-weight:600}.submit-target{font-size:12.5px;color:var(--iph-gray);display:inline-flex;align-items:center;gap:6px}.submit-target code{background:var(--iph-gray-bg);color:var(--iph-navy);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px}.btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-sans);font-size:14px;font-weight:600;padding:11px 22px;border-radius:var(--r-sm);border:1px solid transparent;cursor:pointer;transition:transform .12s,box-shadow .15s,background .15s,border-color .15s;white-space:nowrap;line-height:1}.btn-accent{background:linear-gradient(15deg,var(--iph-orange) 0%,var(--iph-yellow) 100%);color:var(--iph-navy);font-weight:700;box-shadow:0 1px 2px rgba(252,147,76,.25)}.btn-accent:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(252,147,76,.32)}.btn-accent svg{width:16px;height:16px}.btn:disabled{opacity:.7;cursor:not-allowed}.form-footer{max-width:var(--form-w);margin:28px auto 0;padding:18px 32px 8px;border-top:1px solid var(--iph-gray-bg);display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--iph-gray);line-height:1.55}.conf{font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--iph-navy)}.legal{max-width:760px}.field.dynamic-field{background:#F1F5FB;padding:16px;border-radius:var(--r-sm);border:1px solid #E8EEF8;transition:background .2s,border-color .2s}
.csel-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-sans);font-size:14.5px;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;cursor:pointer;transition:border-color .12s,box-shadow .12s;text-align:left}.csel-trigger:hover,.csel-trigger.csel-open{border-color:var(--iph-navy)}.csel-trigger.csel-open{box-shadow:0 0 0 3px rgba(13,36,75,.12)}.csel-placeholder{color:#A6AEBC}.csel-val{color:var(--iph-ink);font-weight:500;flex:1;min-width:0}.csel-chevron{color:var(--iph-gray);flex:none;transition:transform .2s}.csel-chevron-up{transform:rotate(180deg)}.csel-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:110;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(13,36,75,.13);overflow:hidden;animation:csel-in .12s ease}.csel-option{width:100%;display:flex;align-items:center;gap:10px;background:transparent;border:none;font-family:var(--font-sans);font-size:14px;color:var(--iph-ink);padding:10px 14px;cursor:pointer;text-align:left;transition:background .1s,color .1s;border-bottom:1px solid var(--iph-gray-bg)}.csel-option:last-of-type{border-bottom:none}.csel-option:hover{background:var(--iph-paper);color:var(--iph-navy)}.csel-option-selected{background:#F1F5FB;color:var(--iph-navy);font-weight:600}.csel-option-check{width:18px;height:18px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--iph-navy)}.csel-clear{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;border:none;border-top:1px solid var(--iph-gray-bg);font-family:var(--font-sans);font-size:12px;color:var(--iph-gray);padding:9px 14px;cursor:pointer;transition:color .12s,background .12s}.csel-clear:hover{color:var(--danger);background:var(--danger-soft)}@keyframes csel-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.dp-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-sans);font-size:14.5px;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);padding:9px 12px;cursor:pointer;transition:border-color .12s,box-shadow .12s;text-align:left;color:var(--iph-ink)}.dp-trigger:hover,.dp-trigger.dp-open{border-color:var(--iph-navy)}.dp-trigger.dp-open{box-shadow:0 0 0 3px rgba(13,36,75,.12)}.dp-trigger svg{color:var(--iph-gray);flex:none}.dp-placeholder{color:#A6AEBC}.dp-val{color:var(--iph-ink);font-weight:500}.dp-popup{position:absolute;top:calc(100% + 6px);left:0;z-index:100;background:#fff;border:1px solid var(--iph-gray-line);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(13,36,75,.14);padding:16px;width:280px}.dp-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.dp-month-label{font-size:14px;font-weight:700;color:var(--iph-navy)}.dp-nav{background:transparent;border:1px solid var(--iph-gray-line);border-radius:var(--r-sm);width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--iph-navy);transition:background .12s,border-color .12s}.dp-nav:hover{background:var(--iph-paper);border-color:var(--iph-navy)}.dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.dp-day-name{font-size:11px;font-weight:600;color:var(--iph-gray);text-align:center;padding:4px 0;letter-spacing:.04em}.dp-day{background:transparent;border:none;border-radius:var(--r-sm);width:100%;aspect-ratio:1;font-family:var(--font-sans);font-size:13px;color:var(--iph-ink);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s}.dp-day:hover{background:var(--iph-paper);color:var(--iph-navy)}.dp-today{font-weight:700;color:var(--iph-orange)}.dp-selected{background:var(--iph-navy)!important;color:#fff!important;font-weight:700}.dp-header-labels{display:flex;align-items:center;gap:4px}.dp-month-btn,.dp-year-btn{background:transparent;border:none;font-family:var(--font-sans);font-size:14px;font-weight:700;color:var(--iph-navy);cursor:pointer;padding:3px 6px;border-radius:var(--r-sm);transition:background .12s}.dp-month-btn:hover,.dp-year-btn:hover{background:var(--iph-paper)}.dp-month-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}.dp-month-cell{background:transparent;border:1px solid transparent;border-radius:var(--r-sm);font-family:var(--font-sans);font-size:13px;color:var(--iph-ink);cursor:pointer;padding:8px 4px;text-align:center;transition:background .12s,color .12s,border-color .12s}.dp-month-cell:hover{background:var(--iph-paper);color:var(--iph-navy);border-color:var(--iph-gray-line)}.dp-month-cell.dp-today{font-weight:700;color:var(--iph-orange)}.dp-month-cell.dp-selected{background:var(--iph-navy)!important;color:#fff!important;font-weight:700;border-color:var(--iph-navy)}.dp-footer{border-top:1px solid var(--iph-gray-bg);margin-top:10px;padding-top:10px;display:flex;justify-content:flex-end}.dp-clear{background:transparent;border:none;font-family:var(--font-sans);font-size:12px;color:var(--iph-gray);cursor:pointer;padding:2px 6px;border-radius:4px}.dp-clear:hover{color:var(--danger)}@media(max-width:720px){.app-bar{padding:12px 16px}.meta{display:none}.page{padding:0 16px;margin-top:16px}.form-head{padding:22px 20px 20px}.form-head h1{font-size:26px}.section{padding:20px 18px}.section-head{flex-direction:column;gap:4px}.field-grid{grid-template-columns:1fr}.span-2{grid-column:1}.action-bar .inner{padding:12px 16px}.state{flex-basis:100%;min-width:0}.submit-target{display:none}.form-footer{padding:14px 16px 8px}}
`;
