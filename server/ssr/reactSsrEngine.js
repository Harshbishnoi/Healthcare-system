const React = require('react');
const ReactDOMServer = require('react-dom/server');
const DoctorService = require('../services/doctorService');

/**
 * React Component for Server-Side Rendered Doctor Directory
 */
function SsrDoctorDirectory({ doctors, title, timestamp }) {
  return React.createElement(
    'div',
    { style: { fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#0f172a', padding: '2rem' } },
    React.createElement(
      'header',
      { style: { maxWidth: '1000px', margin: '0 auto 2rem auto', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' } },
      React.createElement('h1', { style: { color: '#0369a1', margin: 0 } }, 'DocPulse — Server-Side Rendered Directory'),
      React.createElement('p', { style: { color: '#64748b', fontSize: '0.875rem' } }, `Rendered on server at: ${timestamp}`)
    ),
    React.createElement(
      'main',
      { style: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' } },
      doctors.map((doc, idx) =>
        React.createElement(
          'article',
          {
            key: doc.id || idx,
            style: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
          },
          React.createElement('h2', { style: { fontSize: '1.25rem', margin: '0 0 0.25rem 0', color: '#0f172a' } }, doc.name),
          React.createElement('p', { style: { color: '#0284c7', fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '0.875rem' } }, `${doc.degree} • ${doc.specialization}`),
          React.createElement('p', { style: { color: '#475569', fontSize: '0.875rem', margin: '0 0 1rem 0' } }, `${doc.hospitalClinic}, ${doc.city}`),
          React.createElement(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' } },
            React.createElement('span', { style: { fontWeight: 'bold', color: '#0f172a' } }, `$${doc.consultationFee}`),
            React.createElement('span', { style: { color: '#d97706', fontWeight: 'bold' } }, `★ ${doc.ratingAvg}`)
          ),
          React.createElement(
            'a',
            {
              href: `/doctors/${doc.id || doc.doctorId}`,
              style: { display: 'block', textAlign: 'center', background: '#0284c7', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', textDecoration: 'none', marginTop: '1rem', fontWeight: '600', fontSize: '0.875rem' },
            },
            'Book Consultation'
          )
        )
      )
    )
  );
}

/**
 * Server-Side Rendered (SSR) HTML Generator
 */
async function renderDoctorDirectoryHtml() {
  const result = await DoctorService.searchDoctors({});
  const doctors = result.doctors || [];
  const timestamp = new Date().toUTCString();

  // Execute React DOM Server-Side Rendering
  const reactHtml = ReactDOMServer.renderToString(
    React.createElement(SsrDoctorDirectory, {
      doctors,
      title: 'DocPulse Doctor Directory (SSR)',
      timestamp,
    })
  );

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DocPulse — Verified Doctor Directory (SSR)</title>
  <meta name="description" content="Server-side rendered physician directory with verified medical doctors, real-time availability, and instant consultation booking." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0;">
  <div id="ssr-root">${reactHtml}</div>
</body>
</html>`;

  return fullHtml;
}

module.exports = {
  renderDoctorDirectoryHtml,
  SsrDoctorDirectory,
};
