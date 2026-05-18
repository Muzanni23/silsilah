import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function clean() {
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["admin@baniabdmutthalib.id", "muzanni@email.com"]
      }
    }
  });
  console.log("Users deleted");

  // Create via fetch
  const res1 = await fetch("http://localhost:3001/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "http://localhost:3001" },
    body: JSON.stringify({
      email: "admin@baniabdmutthalib.id",
      password: "admin123",
      name: "Admin Utama"
    })
  });
  console.log("Admin create status:", res1.status, await res1.text());

  const res2 = await fetch("http://localhost:3001/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "http://localhost:3001" },
    body: JSON.stringify({
      email: "muzanni@email.com",
      password: "member123",
      name: "Ahmad Muzanni"
    })
  });
  console.log("Member create status:", res2.status, await res2.text());

  // Set roles using Prisma since signup only sets defaults
  await prisma.user.update({
    where: { email: "admin@baniabdmutthalib.id" },
    data: { role: "SUPER_ADMIN", status: "ACTIVE" }
  });

  await prisma.user.update({
    where: { email: "muzanni@email.com" },
    data: { role: "MEMBER", status: "ACTIVE" }
  });

  console.log("Roles updated");
}

clean().catch(console.error).finally(() => prisma.$disconnect());
