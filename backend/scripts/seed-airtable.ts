import "dotenv/config";
import { hashPassword } from "../src/utils/password";
import { createUser, findUserByEmail } from "../src/modules/users/users.repository";

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await createUser({ name, email, passwordHash, role: "ADMIN" });

  console.log(`Seeded admin user: ${email} / ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
