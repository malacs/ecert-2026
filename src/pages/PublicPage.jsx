import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { downloadCertificate, getCertificateDataUrl } from '../certificateGenerator';

export default function PublicPage() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setPreviewImg(null);

    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('name', `%${search.trim()}%`)
      .limit(5);

    if (data && data.length > 0) setResult(data);
    else setNotFound(true);
    setLoading(false);
  };

  const handlePreview = async (name) => {
    setPreviewing(true);
    const img = await getCertificateDataUrl(name);
    setPreviewImg({ img, name });
    setPreviewing(false);
  };

  const handleDownload = async (name) => {
    setDownloading(true);
    await downloadCertificate(name);
    setDownloading(false);
  };

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <p style={styles.heroLabel}>🎓 DATA INSIGHTS 2026</p>
          <h1 style={styles.heroTitle}>Download Your E-Certificate</h1>
          <p style={styles.heroSub}>Virtual Training Series on Data Mining Concepts, Techniques, and Applications</p>

          <div style={styles.searchBox}>
            <input
              style={styles.searchInput}
              placeholder="Enter your full name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button style={styles.searchBtn} onClick={handleSearch} disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={styles.content}>
        {notFound && (
          <div style={styles.notFound}>
            <p style={styles.notFoundIcon}>😕</p>
            <p style={styles.notFoundTitle}>No participant found</p>
            <p style={styles.notFoundSub}>Make sure to type your full name exactly as registered, or contact your instructor.</p>
          </div>
        )}

        {result && (
          <div>
            <p style={styles.resultLabel}>Found {result.length} result(s) — select your name:</p>
            {result.map(p => (
              <div key={p.id} style={styles.resultCard}>
                <div style={styles.resultAvatar}>{p.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <p style={styles.resultName}>{p.name}</p>
                  <p style={styles.resultBadge}>✅ Verified Participant</p>
                </div>
                <div style={styles.resultActions}>
                  <button style={styles.btnPreview} onClick={() => handlePreview(p.name)} disabled={previewing}>
                    {previewing ? '...' : '👁 Preview'}
                  </button>
                  <button style={styles.btnDownload} onClick={() => handleDownload(p.name)} disabled={downloading}>
                    {downloading ? 'Generating...' : '⬇ Download PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview modal */}
        {previewImg && (
          <div style={styles.modalOverlay} onClick={() => setPreviewImg(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <p style={styles.modalTitle}>Certificate Preview — {previewImg.name}</p>
                <button style={styles.modalClose} onClick={() => setPreviewImg(null)}>✕</button>
              </div>
              <img src={previewImg.img} alt="Certificate preview" style={styles.previewImg} />
              <div style={styles.modalFooter}>
                <button style={styles.btnDownload} onClick={() => handleDownload(previewImg.name)}>
                  ⬇ Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info section */}
        {!result && !notFound && (
          <div style={styles.infoGrid}>
            {[
              { icon: '📅', label: 'Training Dates', value: 'April 15, 17, 22, 24, 29, 2026' },
              { icon: '💻', label: 'Platform', value: 'Google Meet' },
              { icon: '🕗', label: 'Schedule', value: 'Morning Sessions' },
            ].map(item => (
              <div key={item.label} style={styles.infoCard}>
                <span style={styles.infoIcon}>{item.icon}</span>
                <p style={styles.infoLabel}>{item.label}</p>
                <p style={styles.infoValue}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={styles.footer}>
        <p>DATA INSIGHTS 2026 &nbsp;•&nbsp; <a href="/admin" style={styles.footerLink}>Admin Panel</a></p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif' },
  hero: { background: 'linear-gradient(135deg, #1a1060 0%, #2d1b8e 100%)', padding: '60px 24px' },
  heroInner: { maxWidth: 680, margin: '0 auto', textAlign: 'center' },
  heroLabel: { color: '#c9a84c', fontSize: 14, fontWeight: 600, letterSpacing: 1, margin: '0 0 12px' },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2 },
  heroSub: { color: '#c4b8f0', fontSize: 15, margin: '0 0 32px', lineHeight: 1.5 },
  searchBox: { display: 'flex', gap: 0, maxWidth: 520, margin: '0 auto', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  searchInput: { flex: 1, padding: '14px 18px', fontSize: 15, border: 'none', outline: 'none' },
  searchBtn: { background: '#c9a84c', color: '#1a1060', border: 'none', padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  content: { maxWidth: 720, margin: '40px auto', padding: '0 24px' },
  notFound: { textAlign: 'center', padding: '48px 0' },
  notFoundIcon: { fontSize: 48, margin: '0 0 12px' },
  notFoundTitle: { fontSize: 18, fontWeight: 600, color: '#1a1060', margin: '0 0 8px' },
  notFoundSub: { fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  resultLabel: { fontSize: 14, color: '#6b7280', margin: '0 0 12px' },
  resultCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  resultAvatar: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1a1060, #2d1b8e)', color: '#e8c96d', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: 17, fontWeight: 600, color: '#1a1060', margin: 0 },
  resultBadge: { fontSize: 12, color: '#16a34a', margin: '4px 0 0' },
  resultActions: { display: 'flex', gap: 8 },
  btnPreview: { background: '#fff', color: '#1a1060', border: '1px solid #1a1060', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnDownload: { background: '#1a1060', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalCard: { background: '#fff', borderRadius: 16, maxWidth: 860, width: '100%', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e5e7eb' },
  modalTitle: { fontSize: 15, fontWeight: 600, color: '#1a1060', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' },
  previewImg: { width: '100%', display: 'block' },
  modalFooter: { padding: '14px 20px', textAlign: 'right', borderTop: '1px solid #e5e7eb' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 8 },
  infoCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 16px', textAlign: 'center' },
  infoIcon: { fontSize: 28 },
  infoLabel: { fontSize: 12, color: '#9ca3af', margin: '8px 0 4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: 600, color: '#1a1060', margin: 0 },
  footer: { textAlign: 'center', padding: '32px 24px', color: '#9ca3af', fontSize: 13 },
  footerLink: { color: '#1a1060', textDecoration: 'none', fontWeight: 500 },
};
