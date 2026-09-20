const request = require('supertest');
const app = require('../app');
const { renderDoctorDirectoryHtml, SsrDoctorDirectory } = require('../ssr/reactSsrEngine');
const { renderDoctorProfileSSR } = require('../ssr/ssrRenderer');

describe('System & Integration: Server-Side Rendering (SSR) & SEO Tests', () => {
  describe('React DOM Server Rendering Engine', () => {
    it('renderDoctorDirectoryHtml - should render full HTML document containing #ssr-root and physician list', async () => {
      const html = await renderDoctorDirectoryHtml();

      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<div id="ssr-root">');
      expect(html).toContain('DocPulse — Server-Side Rendered Directory');
      expect(html).toContain('Cardiology');
    });

    it('renderDoctorProfileSSR - should produce pre-rendered HTML with Schema.org JSON-LD and OpenGraph metadata', async () => {
      const html = await renderDoctorProfileSSR('mock-doc-cardio-001');

      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('application/ld+json');
      expect(html).toContain('"@type":"Physician"');
      expect(html).toContain('"medicalSpecialty":"Cardiology"');
      expect(html).toContain('Dr. Sarah Jenkins');
    });

    it('renderDoctorProfileSSR - should return null for non-existent doctor', async () => {
      const html = await renderDoctorProfileSSR('non-existent-random-doctor-999');
      expect(html).toBeNull();
    });
  });

  describe('SSR Express HTTP Endpoints', () => {
    it('GET /ssr - should return 200 OK with text/html content-type and server-rendered directory', async () => {
      const res = await request(app).get('/ssr');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('DocPulse — Server-Side Rendered Directory');
      expect(res.text).toContain('<div id="ssr-root">');
    });

    it('GET /ssr/doctors - should return 200 OK with text/html content-type', async () => {
      const res = await request(app).get('/ssr/doctors');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Book Consultation');
    });

    it('GET /ssr/doctor/:id - should return 200 OK with server-rendered physician profile and JSON-LD', async () => {
      const res = await request(app).get('/ssr/doctor/mock-doc-cardio-001');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Dr. Sarah Jenkins');
      expect(res.text).toContain('Mount Sinai Heart Hospital');
      expect(res.text).toContain('application/ld+json');
    });

    it('GET /ssr/doctor/:id - should return 404 for unknown doctor', async () => {
      const res = await request(app).get('/ssr/doctor/unknown-doctor-xyz');

      expect(res.status).toBe(404);
      expect(res.text).toContain('Doctor Profile Not Found');
    });
  });
});
