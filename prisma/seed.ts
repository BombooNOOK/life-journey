/**
 * ローカル DB 用の最小シード（任意）。
 * プロフィールは通常ログイン後に ensureDefaultProfile で自動作成されます。
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Local seed: schema is ready. Log in with Firebase to create your profile.");
  const count = await prisma.profile.count();
  console.log(`Current profiles in DB: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
