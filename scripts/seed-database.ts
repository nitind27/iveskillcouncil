import { PrismaClient, PlanType, PlanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSION_KEYS, PERMISSION_LABELS, ROLES } from '../lib/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create/Ensure Roles exist
    console.log('📝 Creating roles...');
    const roles = [
      { id: 1, name: 'SUPER_ADMIN' },
      { id: 2, name: 'ADMIN' },
      { id: 3, name: 'SUB_ADMIN' },
      { id: 4, name: 'STUDENT' },
      { id: 5, name: 'STAFF' },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }
    console.log('✅ Roles created');

    // 2. Create Subscription Plans
    console.log('📝 Creating subscription plans...');
    const plans: { id: number; name: PlanType; price: number; durationInDays: number; status: PlanStatus }[] = [
      { id: 1, name: PlanType.SILVER, price: 5000.00, durationInDays: 365, status: PlanStatus.ACTIVE },
      { id: 2, name: PlanType.GOLD, price: 10000.00, durationInDays: 365, status: PlanStatus.ACTIVE },
      { id: 3, name: PlanType.DIAMOND, price: 20000.00, durationInDays: 365, status: PlanStatus.ACTIVE },
    ];

    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { id: plan.id },
        update: { name: plan.name, price: plan.price, durationInDays: plan.durationInDays, status: plan.status },
        create: plan,
      });
    }
    console.log('✅ Subscription plans created');

    // 2b. Create Permissions and default Role/Plan permissions
    console.log('📝 Creating permissions...');
    for (const key of PERMISSION_KEYS) {
      const { label, module } = PERMISSION_LABELS[key];
      await prisma.permission.upsert({
        where: { key },
        update: { label, module },
        create: { key, label, module },
      });
    }
    const allPermissionIds = (await prisma.permission.findMany({ select: { id: true } })).map((p) => p.id);
    console.log('✅ Permissions created:', allPermissionIds.length);

    console.log('📝 Assigning default role permissions (SUPER_ADMIN = all)...');
    for (const role of roles) {
      const existing = await prisma.rolePermission.findMany({ where: { roleId: role.id } });
      if (existing.length > 0) continue;
      if (role.id === ROLES.SUPER_ADMIN) {
        await prisma.rolePermission.createMany({
          data: allPermissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }
    }
    console.log('✅ Role permissions set');

    console.log('📝 Assigning default plan permissions (all plans get all permissions)...');
    for (const plan of plans) {
      const existing = await prisma.planPermission.findMany({ where: { planId: plan.id } });
      if (existing.length > 0) continue;
      await prisma.planPermission.createMany({
        data: allPermissionIds.map((permissionId) => ({ planId: plan.id, permissionId })),
        skipDuplicates: true,
      });
    }
    console.log('✅ Plan permissions set');

    // 3. Create Super Admin User
    console.log('📝 Creating super admin user...');
    const superAdminPassword = await bcrypt.hash('NP@@7359', 10);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'codeatinfotech@gmail.com' },
      update: {
        password: superAdminPassword,
        status: 'ACTIVE',
      },
      create: {
        roleId: 1, // SUPER_ADMIN
        fullName: 'Super Admin',
        email: 'codeatinfotech@gmail.com',
        password: superAdminPassword,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // 4. Create Regular Admin User
    console.log('📝 Creating admin user...');
    const adminPassword = await bcrypt.hash('12345678', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'official.iveskillcouncil@gmail.com' },
      update: {
        password: adminPassword,
        status: 'ACTIVE',
      },
      create: {
        roleId: 2, // ADMIN
        fullName: 'Institute Admin',
        email: 'official.iveskillcouncil@gmail.com',
        password: adminPassword,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Admin created:', admin.email);

    // 5. Create a Test Franchise with Sub Admin
    console.log('📝 Creating test franchise...');
    const subAdminPassword = await bcrypt.hash('franchise123', 10);
    
    const subAdmin = await prisma.user.upsert({
      where: { email: 'franchise@example.com' },
      update: {
        password: subAdminPassword,
        status: 'ACTIVE',
      },
      create: {
        roleId: 3, // SUB_ADMIN
        fullName: 'Franchise Owner',
        email: 'franchise@example.com',
        password: subAdminPassword,
        status: 'ACTIVE',
      },
    });

    const franchise = await prisma.franchise.upsert({
      where: { id: BigInt(1) },
      update: {
        name: 'Test Franchise',
        ownerId: subAdmin.id,
        planId: 2, // GOLD
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'ACTIVE',
      },
      create: {
        id: BigInt(1),
        name: 'Test Franchise',
        ownerId: subAdmin.id,
        planId: 2, // GOLD
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'ACTIVE',
      },
    });

    // Update sub admin with franchise ID
    await prisma.user.update({
      where: { id: subAdmin.id },
      data: { franchiseId: franchise.id },
    });

    console.log('✅ Test Franchise created:', franchise.name);
    console.log('✅ Sub Admin created:', subAdmin.email);

    // 6. Create a Test Student
    console.log('📝 Creating test student...');
    const studentPassword = await bcrypt.hash('student123', 10);
    
    const studentUser = await prisma.user.upsert({
      where: { email: 'student@example.com' },
      update: {
        password: studentPassword,
        status: 'ACTIVE',
      },
      create: {
        roleId: 4, // STUDENT
        fullName: 'Test Student',
        email: 'student@example.com',
        password: studentPassword,
        franchiseId: franchise.id,
        status: 'ACTIVE',
      },
    });

    // Create a course first
    const course = await prisma.course.upsert({
      where: { id: BigInt(1) },
      update: {
        name: 'Web Development Course',
        description: 'Complete web development course',
        type: 'GOLD',
        baseFee: 15000.00,
        durationMonths: 6,
        status: 'ACTIVE',
      },
      create: {
        id: BigInt(1),
        name: 'Web Development Course',
        description: 'Complete web development course',
        type: 'GOLD',
        baseFee: 15000.00,
        durationMonths: 6,
        status: 'ACTIVE',
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {
        totalFee: 15000.00,
        paidFee: 5000.00,
        status: 'ACTIVE',
      },
      create: {
        userId: studentUser.id,
        franchiseId: franchise.id,
        courseId: course.id,
        totalFee: 15000.00,
        paidFee: 5000.00,
        admissionDate: new Date(),
        status: 'ACTIVE',
      },
    });

    console.log('✅ Test Student created:', studentUser.email);

    // 7. Create a Test Staff
    console.log('📝 Creating test staff...');
    const staffPassword = await bcrypt.hash('staff123', 10);

    const staffUser = await prisma.user.upsert({
      where: { email: 'staff@example.com' },
      update: {
        password: staffPassword,
        status: 'ACTIVE',
        franchiseId: franchise.id,
        roleId: 5,
      },
      create: {
        roleId: 5, // STAFF
        fullName: 'Test Staff',
        email: 'staff@example.com',
        password: staffPassword,
        franchiseId: franchise.id,
        status: 'ACTIVE',
      },
    });

    await prisma.staff.upsert({
      where: { userId: staffUser.id },
      update: {
        salary: 25000.00,
        status: 'ACTIVE',
      },
      create: {
        userId: staffUser.id,
        franchiseId: franchise.id,
        salary: 25000.00,
        joiningDate: new Date(),
        status: 'ACTIVE',
      },
    });

    console.log('✅ Test Staff created:', staffUser.email);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: codeatinfotech@gmail.com');
    console.log('  Password: NP@@7359');
    console.log('\nAdmin (Institute):');
    console.log('  Email: official.iveskillcouncil@gmail.com');
    console.log('  Password: 12345678');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

