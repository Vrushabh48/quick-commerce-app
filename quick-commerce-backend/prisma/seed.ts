// import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Starting database seeding...');

//   // Hash password for admin
//   const passwordHash = await bcrypt.hash('Admin@123456', 10);

//   // Create Admin User
//   const admin = await prisma.user.upsert({
//     where: { email: 'admin@quickcommerce.com' },
//     update: {},
//     create: {
//       email: 'admin@quickcommerce.com',
//       phone: '+919876543210',
//       passwordHash: passwordHash,
//       firstName: 'Super',
//       lastName: 'Admin',
//       role: UserRole.ADMIN,
//       status: UserStatus.ACTIVE,
//       emailVerified: true,
//       phoneVerified: true,
//       lastLoginAt: new Date(),
//     },
//   });

//   console.log('✅ Admin user created:', {
//     id: admin.id,
//     email: admin.email,
//     role: admin.role,
//   });

//   // Optional: Create additional test admins
//   const additionalAdmins = [
//     {
//       email: 'support@quickcommerce.com',
//       phone: '+919876543211',
//       firstName: 'Support',
//       lastName: 'Team',
//     },
//   ];

//   for (const adminData of additionalAdmins) {
//     const testAdmin = await prisma.user.upsert({
//       where: { email: adminData.email },
//       update: {},
//       create: {
//         ...adminData,
//         passwordHash: passwordHash,
//         role: UserRole.ADMIN,
//         status: UserStatus.ACTIVE,
//         emailVerified: true,
//         phoneVerified: true,
//       },
//     });

//     console.log('✅ Additional admin created:', {
//       id: testAdmin.id,
//       email: testAdmin.email,
//     });
//   }

//   console.log('\n🎉 Database seeding completed successfully!');
//   console.log('\n📧 Login Credentials:');
//   console.log('Email: admin@quickcommerce.com');
//   console.log('Password: Admin@123456');
//   console.log('\n⚠️  IMPORTANT: Change the default password in production!');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Error during seeding:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });