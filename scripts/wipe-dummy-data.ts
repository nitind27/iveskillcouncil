/**
 * Wipe all dummy / transactional data.
 * Keep: roles, permissions, role/plan permissions, subscription plans,
 *       userpanel + global settings (config).
 * Ensure only:
 *   Super Admin  — codeatinfotech@gmail.com / NP@@7359
 *   Institute Admin — official.iveskillcouncil@gmail.com / 12345678
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPER_EMAIL = "codeatinfotech@gmail.com";
const SUPER_PASS = "NP@@7359";
const ADMIN_EMAIL = "official.iveskillcouncil@gmail.com";
const ADMIN_PASS = "12345678";

async function countAll() {
  const entries: [string, number][] = [
    ["users", await prisma.user.count()],
    ["franchises", await prisma.franchise.count()],
    ["students", await prisma.student.count()],
    ["staff", await prisma.staff.count()],
    ["courses", await prisma.course.count()],
    ["courseCategories", await prisma.courseCategory.count()],
    ["payments", await prisma.payment.count()],
    ["attendance", await prisma.attendance.count()],
    ["certificates", await prisma.certificate.count()],
    ["exams", await prisma.exam.count()],
    ["examAttempts", await prisma.examAttempt.count()],
    ["announcements", await prisma.announcement.count()],
    ["chatRooms", await prisma.chatRoom.count()],
    ["chatMessages", await prisma.chatMessage.count()],
    ["otps", await prisma.otpVerification.count()],
    ["feedback", await prisma.feedback.count()],
    ["franchiseApps", await prisma.franchiseApplication.count()],
    ["orders", await prisma.franchiseOrder.count()],
    ["support", await prisma.supportRequest.count()],
    ["enrollmentReq", await prisma.courseEnrollmentRequest.count()],
    ["offers", await prisma.offerApplication.count()],
    ["inquiries", await prisma.franchiseInquiry.count()],
  ];
  return Object.fromEntries(entries);
}

async function wipe() {
  console.log("🧹 Clearing dummy / transactional data...\n");

  // ---- Exams (deepest children first) ----
  await prisma.examProctorEvent.deleteMany({});
  await prisma.examAnswer.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.examOption.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.examTarget.deleteMany({});
  await prisma.exam.deleteMany({});
  console.log("✓ exams");

  // ---- Chat ----
  await prisma.chatTyping.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatRoomMember.deleteMany({});
  await prisma.chatRoom.deleteMany({});
  console.log("✓ chat");

  // ---- Certificates / attendance / payments / feedback ----
  await prisma.certificate.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.feedback.deleteMany({});
  console.log("✓ certificates, attendance, payments, feedback");

  // ---- Announcements / support / OTP / forms ----
  await prisma.announcement.deleteMany({});
  await prisma.supportRequest.deleteMany({});
  await prisma.otpVerification.deleteMany({});
  await prisma.courseEnrollmentRequest.deleteMany({});
  await prisma.offerApplication.deleteMany({});
  await prisma.franchiseInquiry.deleteMany({});
  console.log("✓ announcements, support, otps, public forms");

  // ---- Students & staff (before users that own them) ----
  await prisma.student.deleteMany({});
  await prisma.staff.deleteMany({});
  console.log("✓ students, staff");

  // ---- Courses / fees / categories ----
  await prisma.franchiseCourseFee.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.courseCategory.deleteMany({});
  console.log("✓ courses, categories");

  // ---- Franchise orders & applications (unlink franchises first) ----
  await prisma.franchiseOrder.deleteMany({});

  // Clear franchise.applicationId so applications can be deleted
  await prisma.franchise.updateMany({
    data: { applicationId: null },
  });
  await prisma.franchiseApplication.deleteMany({});
  console.log("✓ franchise orders & applications");

  // Detach users from franchises before deleting franchises
  await prisma.user.updateMany({
    data: { franchiseId: null },
  });

  await prisma.franchise.deleteMany({});
  console.log("✓ franchises");

  // ---- All users (admins recreated below) ----
  await prisma.user.deleteMany({});
  console.log("✓ all users");
}

async function ensureRolesAndPlans() {
  const roles = [
    { id: 1, name: "SUPER_ADMIN" },
    { id: 2, name: "ADMIN" },
    { id: 3, name: "SUB_ADMIN" },
    { id: 4, name: "STUDENT" },
    { id: 5, name: "STAFF" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: role,
    });
  }

  const planCount = await prisma.subscriptionPlan.count();
  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        { id: 1, name: "SILVER", price: 5000, durationInDays: 365, status: "ACTIVE" },
        { id: 2, name: "GOLD", price: 10000, durationInDays: 365, status: "ACTIVE" },
        { id: 3, name: "DIAMOND", price: 20000, durationInDays: 365, status: "ACTIVE" },
      ],
    });
  }
  console.log("✓ roles & plans intact");
}

async function createAdmins() {
  const superHash = await bcrypt.hash(SUPER_PASS, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASS, 10);

  const superAdmin = await prisma.user.create({
    data: {
      roleId: 1,
      fullName: "Super Admin",
      email: SUPER_EMAIL,
      password: superHash,
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  const instituteAdmin = await prisma.user.create({
    data: {
      roleId: 2,
      fullName: "Institute Admin",
      email: ADMIN_EMAIL,
      password: adminHash,
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  console.log("\n✅ Super Admin:", superAdmin.email, `(id ${superAdmin.id})`);
  console.log("✅ Institute Admin:", instituteAdmin.email, `(id ${instituteAdmin.id})`);
}

async function main() {
  console.log("📊 BEFORE:");
  console.log(await countAll());

  await wipe();
  await ensureRolesAndPlans();
  await createAdmins();

  // Verify passwords
  const users = await prisma.user.findMany({
    select: { email: true, roleId: true, password: true, status: true },
    orderBy: { roleId: "asc" },
  });
  for (const u of users) {
    const expect =
      u.email === SUPER_EMAIL ? SUPER_PASS : u.email === ADMIN_EMAIL ? ADMIN_PASS : null;
    const ok = expect ? await bcrypt.compare(expect, u.password) : false;
    console.log(`🔐 ${u.email} role=${u.roleId} status=${u.status} passwordOk=${ok}`);
  }

  console.log("\n📊 AFTER:");
  console.log(await countAll());
  console.log("\nDone. Only 2 users remain + system config (roles/plans/permissions/settings).");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
