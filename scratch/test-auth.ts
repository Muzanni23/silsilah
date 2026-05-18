import { auth } from "../src/lib/auth";

async function run() {
  const admin = await auth.api.signUpEmail({
    body: {
      email: "admin2@baniabdmutthalib.id",
      password: "admin123",
      name: "Admin Utama 2"
    }
  });
  console.log("Admin 2 created:", admin);
}

run().catch(console.error);
