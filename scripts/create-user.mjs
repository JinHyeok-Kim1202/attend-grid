import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL이 설정되지 않았습니다.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const [, , emailArg, passwordArg, roleArg = "USER", ...nameParts] = process.argv;

const email = emailArg?.trim().toLowerCase();
const password = passwordArg?.trim();
const role = roleArg.trim().toUpperCase();
const name = nameParts.join(" ").trim() || email?.split("@")[0] || "AttendGrid User";

const validRoles = ["ADMIN", "MANAGER", "USER"];

if (!email || !password || !validRoles.includes(role)) {
  console.error(
    "사용법: npm run db:create-user -- <email> <password> <ADMIN|MANAGER|USER> [name]"
  );
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

await prisma.user.upsert({
  where: { email },
  update: {
    name,
    passwordHash,
    role,
  },
  create: {
    email,
    name,
    passwordHash,
    role,
  },
});

console.log(`사용자 생성 또는 갱신 완료: ${email} (${role})`);

await prisma.$disconnect();
