import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records in reverse order of FK constraints
  await prisma.activityLog.deleteMany({});
  await prisma.notificationHistory.deleteMany({});
  await prisma.reminderSchedule.deleteMany({});
  await prisma.renewal.deleteMany({});
  await prisma.insurancePolicy.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.settings.deleteMany({});

  console.log('Cleaned up previous database state.');

  // 2. Seed Default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const defaultAdmin = await prisma.admin.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });
  console.log(`Seeded default admin: ${defaultAdmin.email}`);

  // 3. Seed Default System Settings
  const defaultSettings = [
    { key: 'company_name', value: 'Shield Insurance Agency' },
    { key: 'company_logo', value: '' },
    { key: 'company_contact_number', value: '+15550199' },
    { key: 'company_email', value: 'contact@shieldinsurance.com' },
    { key: 'reminder_days_config', value: JSON.stringify([30, 15, 7, 3, 1, 0]) },
    { key: 'channel_toggles', value: JSON.stringify({ sms: true, whatsapp: true, email: true }) },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.create({ data: setting });
  }
  console.log('Seeded default settings configuration.');

  // 4. Seed Test Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      mobile: '+15550100',
      altMobile: '+15550101',
      email: 'john.doe@example.com',
      address: '123 Maple Street, Springfield',
      notes: 'Prefers WhatsApp notifications over SMS.',
      preferredNotificationChannel: 'whatsapp',
      preferredLanguage: 'en',
      customerStatus: 'active',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      mobile: '+15550200',
      altMobile: null,
      email: 'jane.smith@example.com',
      address: '456 Oak Avenue, Metropolis',
      notes: 'Corporate client.',
      preferredNotificationChannel: 'email',
      preferredLanguage: 'en',
      customerStatus: 'active',
    },
  });
  console.log('Seeded test customers.');

  // 5. Seed Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      customerId: customer1.id,
      vehicleNumber: 'NY-ABC-123',
      vehicleType: 'four_wheeler',
      make: 'Toyota',
      model: 'Camry',
      manufacturingYear: 2021,
      fuelType: 'petrol',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      customerId: customer2.id,
      vehicleNumber: 'CA-XYZ-789',
      vehicleType: 'two_wheeler',
      make: 'Honda',
      model: 'CBR500R',
      manufacturingYear: 2022,
      fuelType: 'petrol',
    },
  });
  console.log('Seeded test vehicles.');

  // 6. Seed Insurance Policies
  // Policy 1: Expiry date in 25 days (triggers 30d reminder already sent, pending 15d)
  const dateIn25Days = new Date();
  dateIn25Days.setDate(dateIn25Days.getDate() + 25);

  const policy1 = await prisma.insurancePolicy.create({
    data: {
      vehicleId: vehicle1.id,
      insuranceCompany: 'Progressive',
      policyNumber: 'POL-100099',
      insuranceType: 'comprehensive',
      startDate: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000), // ~11 months ago
      expiryDate: dateIn25Days,
      status: 'active',
      renewalStatus: 'reminder_sent',
      renewalAmount: 850.00,
      lastReminderDate: new Date(),
      nextReminderDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
    },
  });

  // Policy 2: Expiry date in 5 days (triggers 7d reminder sent, pending 3d)
  const dateIn5Days = new Date();
  dateIn5Days.setDate(dateIn5Days.getDate() + 5);

  await prisma.insurancePolicy.create({
    data: {
      vehicleId: vehicle2.id,
      insuranceCompany: 'Geico',
      policyNumber: 'POL-200088',
      insuranceType: 'third_party',
      startDate: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000), // ~1 year ago
      expiryDate: dateIn5Days,
      status: 'active',
      renewalStatus: 'pending',
      renewalAmount: 320.50,
      lastReminderDate: null,
      nextReminderDate: new Date(),
    },
  });
  console.log('Seeded test insurance policies.');

  // 7. Seed Reminder Schedules & Histories for auditing
  const schedule1 = await prisma.reminderSchedule.create({
    data: {
      policyId: policy1.id,
      reminderType: '30d',
      scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      sent: true,
    },
  });

  await prisma.notificationHistory.create({
    data: {
      reminderId: schedule1.id,
      recipientType: 'customer',
      channel: 'whatsapp',
      status: 'sent',
      deliveryResult: 'Message delivered to +15550100',
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seeded reminder schedules and history logs.');
  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during database seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
