const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

/**
 * Server-Side Rendering (SSR) & SEO Meta Generator
 * Injects structured schema.org MedicalBusiness metadata and prerendered HTML
 */
async function renderDoctorProfileSSR(doctorId) {
  try {
    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor' });
    const profile = await DoctorProfile.findOne({ userId: doctorId });

    if (!doctorUser || !profile) {
      return null;
    }

    const title = `Dr. ${doctorUser.name} - ${profile.specialization} in ${profile.city} | DocPulse`;
    const description = `Book consultation with Dr. ${doctorUser.name} (${profile.degree}), ${profile.experienceYears}+ years experience in ${profile.specialization} at ${profile.hospitalClinic}.`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      name: `Dr. ${doctorUser.name}`,
      medicalSpecialty: profile.specialization,
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.city,
        streetAddress: profile.serviceLocation,
      },
      hospitalAffiliation: profile.hospitalClinic,
      priceRange: `$${profile.consultationFee}`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: profile.ratingAvg,
        reviewCount: profile.totalReviews || 1,
      },
    };

    const ssrHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="profile" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 2rem;">
  <main style="max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid #e2e8f0;">
    <h1 style="color: #0f172a; margin-bottom: 0.25rem;">Dr. ${doctorUser.name}</h1>
    <p style="color: #0284c7; font-weight: bold; margin-top: 0;">${profile.degree} • ${profile.specialization}</p>
    <p style="color: #475569;">${profile.hospitalClinic} — ${profile.serviceLocation}, ${profile.city}</p>
    <div style="margin: 1.5rem 0; padding: 1rem; background: #f1f5f9; border-radius: 1rem;">
      <strong>Clinical Focus & Biography:</strong>
      <p style="margin-top: 0.5rem; color: #334155; line-height: 1.6;">${profile.bio || 'General Clinical Practice'}</p>
    </div>
    <p><strong>Consultation Fee:</strong> $${profile.consultationFee}</p>
    <a href="/doctors/${doctorId}" style="display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-weight: bold; margin-top: 1rem;">
      Proceed to Interactive Appointment Booking &rarr;
    </a>
  </main>
</body>
</html>
    `;

    return ssrHtml;
  } catch (err) {
    console.warn('[SSR] Render error:', err.message);
    return null;
  }
}

module.exports = {
  renderDoctorProfileSSR,
};
