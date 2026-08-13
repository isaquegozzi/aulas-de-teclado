import bcrypt from "bcryptjs";

const password = process.argv[2] || "admin123";
const hash = await bcrypt.hash(password, 10);
const escaped = hash.replaceAll("$", "\\$");
console.log(escaped);
console.log("\nUse este valor em ADMIN_PASSWORD_HASH no .env (já com os $ escapados).");