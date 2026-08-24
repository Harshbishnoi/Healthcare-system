const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Review = require('../models/Review');
const { hashPassword } = require('./passwordUtils');

const SAMPLE_DOCTORS = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@docpulse.com',
    mobile: '+1-555-0101',
    city: 'New York',
    degree: 'MD, FACC (Harvard Medical School)',
    specialization: 'Cardiology',
    experienceYears: 14,
    hospitalClinic: 'Mount Sinai Heart Hospital',
    serviceLocation: 'Suite 400, 1425 Madison Ave, New York',
    bio: 'Board-certified cardiologist specializing in preventive cardiology, hypertension management, echocardiography, and coronary artery disease prevention.',
    consultationModes: ['online', 'offline'],
    consultationFee: 750,
    ratingAvg: 4.9,
    totalReviews: 28,
  },
  {
    name: 'Dr. Rajesh Patel',
    email: 'rajesh.patel@docpulse.com',
    mobile: '+1-555-0102',
    city: 'San Francisco',
    degree: 'MBBS, MD (Dermatology), FAAD',
    specialization: 'Dermatology',
    experienceYears: 11,
    hospitalClinic: 'Bay Area Skin Institute',
    serviceLocation: 'Floor 3, 450 Sutter St, San Francisco',
    bio: 'Experienced dermatologist focusing on eczema, psoriasis, acne therapy, mole mapping, and chronic inflammatory skin disorders.',
    consultationModes: ['online', 'offline'],
    consultationFee: 600,
    ratingAvg: 4.8,
    totalReviews: 19,
  },
  {
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@docpulse.com',
    mobile: '+1-555-0103',
    city: 'Chicago',
    degree: 'MD (Internal Medicine), FACP',
    specialization: 'General Medicine',
    experienceYears: 16,
    hospitalClinic: 'Northwestern Memorial Clinic',
    serviceLocation: 'Pavilion B, 251 E Huron St, Chicago',
    bio: 'Senior internist providing comprehensive primary care, metabolic syndrome management, chronic disease prevention, and executive health checkups.',
    consultationModes: ['online', 'offline'],
    consultationFee: 500,
    ratingAvg: 4.9,
    totalReviews: 35,
  },
  {
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@docpulse.com',
    mobile: '+1-555-0104',
    city: 'Austin',
    degree: 'MD, MS (Orthopedic Surgery), FAAOS',
    specialization: 'Orthopedics',
    experienceYears: 12,
    hospitalClinic: 'Austin Joint & Spine Center',
    serviceLocation: 'Suite 210, 3705 Medical Pkwy, Austin',
    bio: 'Specialist in joint restoration, sports injuries, knee and shoulder pain management, and minimally invasive musculoskeletal therapies.',
    consultationModes: ['online', 'offline'],
    consultationFee: 700,
    ratingAvg: 4.7,
    totalReviews: 22,
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@docpulse.com',
    mobile: '+1-555-0105',
    city: 'Seattle',
    degree: 'MD (Pediatrics), FAAP',
    specialization: 'Pediatrics',
    experienceYears: 9,
    hospitalClinic: 'Seattle Childrens Health Care',
    serviceLocation: '4800 Sand Point Way NE, Seattle',
    bio: 'Dedicated pediatrician providing empathetic care from newborn stages through adolescence, developmental assessments, and childhood immunizations.',
    consultationModes: ['online', 'offline'],
    consultationFee: 550,
    ratingAvg: 4.9,
    totalReviews: 31,
  },
  {
    name: 'Dr. David Kim',
    email: 'david.kim@docpulse.com',
    mobile: '+1-555-0106',
    city: 'Boston',
    degree: 'MD (Neurology), PhD (Neuroscience)',
    specialization: 'Neurology',
    experienceYears: 15,
    hospitalClinic: 'Massachusetts Neurological Center',
    serviceLocation: '15 Parkman St, Boston',
    bio: 'Clinical neurologist specializing in migraine therapy, neuropathic pain, movement disorders, memory health, and sleep neurology.',
    consultationModes: ['online', 'offline'],
    consultationFee: 800,
    ratingAvg: 4.8,
    totalReviews: 17,
  },
];

async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already seeded
    }

    console.log('[Seed] Database is empty. Seeding initial doctors and sample records...');

    const defaultPasswordHash = await hashPassword('password123');

    // Create a demo patient
    const demoPatient = await User.create({
      name: 'Alex Morgan',
      email: 'alex.patient@example.com',
      password: defaultPasswordHash,
      mobile: '+1-555-0199',
      city: 'New York',
      role: 'patient',
    });

    await PatientProfile.create({
      userId: demoPatient._id,
      dateOfBirth: new Date('1992-06-15'),
      gender: 'female',
      bloodGroup: 'O+',
      primaryHealthConcern: 'Occasional chest tightness and palpitations during exercise',
      problemDuration: '3 weeks',
      pastMedicalHistory: 'Mild seasonal asthma, no prior surgeries',
      allergies: ['Penicillin'],
      chronicConditions: ['None'],
    });

    // Create Doctors
    for (const docData of SAMPLE_DOCTORS) {
      const docUser = await User.create({
        name: docData.name,
        email: docData.email,
        password: defaultPasswordHash,
        mobile: docData.mobile,
        city: docData.city,
        role: 'doctor',
      });

      await DoctorProfile.create({
        userId: docUser._id,
        degree: docData.degree,
        specialization: docData.specialization,
        experienceYears: docData.experienceYears,
        city: docData.city,
        hospitalClinic: docData.hospitalClinic,
        serviceLocation: docData.serviceLocation,
        bio: docData.bio,
        consultationModes: docData.consultationModes,
        consultationFee: docData.consultationFee,
        ratingAvg: docData.ratingAvg,
        totalReviews: docData.totalReviews,
      });

      await Availability.create({
        doctorId: docUser._id,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 30,
        onlineAvailable: true,
        offlineAvailable: true,
      });
    }

    console.log('[Seed] Initial data seeded successfully! Demo logins ready:');
    console.log('   Doctor: sarah.jenkins@docpulse.com / password123');
    console.log('   Patient: alex.patient@example.com / password123');
  } catch (err) {
    console.warn('[Seed] Notice during seed execution:', err.message);
  }
}

module.exports = { seedInitialData };
