import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const franchiseEmail = "testowner55997@example.com";
  const studentEmail = "student.franchise55997@example.com";
  const studentPassword = "12345678";

  const owner = await prisma.user.findUnique({
    where: { email: franchiseEmail },
    include: { franchise: true, ownedFranchises: true },
  });
  if (!owner) throw new Error("Franchise owner not found");

  const franchiseId = owner.franchiseId ?? owner.ownedFranchises[0]?.id;
  if (!franchiseId) throw new Error("No franchise");

  // Prefer existing assigned course, else Web Development / first active
  let fee = await prisma.franchiseCourseFee.findFirst({
    where: { franchiseId },
    include: { course: true },
  });

  let courseId: bigint;
  let courseName: string;
  let totalFee: number;

  if (fee) {
    courseId = fee.courseId;
    courseName = fee.course.name;
    totalFee = Number(fee.customFee);
  } else {
    const course =
      (await prisma.course.findFirst({
        where: { name: { contains: "Web" }, status: "ACTIVE" },
      })) ||
      (await prisma.course.findFirst({ where: { status: "ACTIVE" } }));
    if (!course) throw new Error("No course");
    courseId = course.id;
    courseName = course.name;
    totalFee = Number(course.baseFee);
    await prisma.franchiseCourseFee.create({
      data: { franchiseId, courseId, customFee: totalFee },
    });
  }

  // Admin who creates exam
  const admin =
    (await prisma.user.findFirst({ where: { roleId: 1 } })) ||
    (await prisma.user.findFirst({ where: { roleId: 2 } }));
  if (!admin) throw new Error("No institute admin user");

  // Student user
  const hash = await bcrypt.hash(studentPassword, 10);
  let studentUser = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: { student: true },
  });

  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        fullName: "Test Student 55997",
        phone: "9876505599",
        password: hash,
        roleId: 4,
        franchiseId,
        status: "ACTIVE",
        mustChangePassword: false,
        student: {
          create: {
            franchiseId,
            courseId,
            totalFee,
            paidFee: 1000,
            admissionDate: new Date(),
            status: "ACTIVE",
            city: "Pune",
            state: "Maharashtra",
          },
        },
      },
      include: { student: true },
    });
  } else {
    await prisma.user.update({
      where: { id: studentUser.id },
      data: {
        password: hash,
        mustChangePassword: false,
        status: "ACTIVE",
        franchiseId,
      },
    });
    if (studentUser.student) {
      await prisma.student.update({
        where: { id: studentUser.student.id },
        data: {
          franchiseId,
          courseId,
          status: "ACTIVE",
          totalFee,
        },
      });
    } else {
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          franchiseId,
          courseId,
          totalFee,
          paidFee: 1000,
          admissionDate: new Date(),
          status: "ACTIVE",
          city: "Pune",
          state: "Maharashtra",
        },
      });
    }
    studentUser = await prisma.user.findUnique({
      where: { id: studentUser.id },
      include: { student: true },
    });
  }

  // Remove any previous incomplete demo exam attempts for clean start
  const oldTargets = await prisma.examTarget.findMany({
    where: { franchiseId, courseId },
    select: { examId: true },
  });
  for (const t of oldTargets) {
    const exam = await prisma.exam.findUnique({ where: { id: t.examId } });
    if (exam?.title.startsWith("[DEMO]")) {
      await prisma.exam.delete({ where: { id: exam.id } });
    }
  }

  const exam = await prisma.exam.create({
    data: {
      title: "[DEMO] Web Development Basics Exam",
      description:
        "Practice MCQ exam. Keep your face in the camera. Looking away will close the exam.",
      durationMinutes: 30,
      passPercent: 40,
      status: "PUBLISHED",
      accessMode: "LINK",
      linkToken: require("crypto").randomBytes(24).toString("hex"),
      linkActive: true,
      batchLabel: "Demo Batch A",
      requireCamera: true,
      requireFaceDetect: true,
      maxFaceViolations: 3,
      shuffleQuestions: false,
      createdBy: admin.id,
      targets: {
        create: [{ franchiseId, courseId }],
      },
      questions: {
        create: [
          {
            text: "What does HTML stand for?",
            type: "SINGLE_CHOICE",
            marks: 1,
            sortOrder: 0,
            options: {
              create: [
                { text: "Hyper Text Markup Language", isCorrect: true, sortOrder: 0 },
                { text: "High Transfer Machine Language", isCorrect: false, sortOrder: 1 },
                { text: "Hyperlink Text Module Language", isCorrect: false, sortOrder: 2 },
                { text: "Home Tool Markup Language", isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            text: "Which language is used for styling web pages?",
            type: "SINGLE_CHOICE",
            marks: 1,
            sortOrder: 1,
            options: {
              create: [
                { text: "HTML", isCorrect: false, sortOrder: 0 },
                { text: "CSS", isCorrect: true, sortOrder: 1 },
                { text: "Python", isCorrect: false, sortOrder: 2 },
                { text: "SQL", isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            text: "Which of the following are JavaScript frameworks/libraries? (select all)",
            type: "MULTIPLE_CHOICE",
            marks: 2,
            sortOrder: 2,
            options: {
              create: [
                { text: "React", isCorrect: true, sortOrder: 0 },
                { text: "Vue", isCorrect: true, sortOrder: 1 },
                { text: "Photoshop", isCorrect: false, sortOrder: 2 },
                { text: "Angular", isCorrect: true, sortOrder: 3 },
              ],
            },
          },
          {
            text: "What does CSS stand for?",
            type: "SINGLE_CHOICE",
            marks: 1,
            sortOrder: 3,
            options: {
              create: [
                { text: "Cascading Style Sheets", isCorrect: true, sortOrder: 0 },
                { text: "Computer Style System", isCorrect: false, sortOrder: 1 },
                { text: "Creative Style Syntax", isCorrect: false, sortOrder: 2 },
                { text: "Colorful Style Sheets", isCorrect: false, sortOrder: 3 },
              ],
            },
          },
          {
            text: "Which tag is used for the largest heading in HTML?",
            type: "SINGLE_CHOICE",
            marks: 1,
            sortOrder: 4,
            options: {
              create: [
                { text: "<h6>", isCorrect: false, sortOrder: 0 },
                { text: "<h1>", isCorrect: true, sortOrder: 1 },
                { text: "<head>", isCorrect: false, sortOrder: 2 },
                { text: "<heading>", isCorrect: false, sortOrder: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        franchise: owner.franchise?.name || owner.ownedFranchises[0]?.name,
        course: courseName,
        examId: exam.id.toString(),
        examTitle: exam.title,
        examStatus: "PUBLISHED",
        accessMode: "LINK",
        linkActive: true,
        examLinkPath: `/exam-link/${exam.linkToken}`,
        questions: 5,
        durationMinutes: 30,
        steps: [
          "Login as institute admin → Exams",
          "Copy walk-in link / Activate or Deactivate",
          "Open link on tablet → students enter enrollment + photo",
        ],
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
