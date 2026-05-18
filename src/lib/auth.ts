import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: true },
      fatherName: { type: "string", required: false, input: true },
      motherName: { type: "string", required: false, input: true },
      role: { type: "string", required: false, defaultValue: "MEMBER" },
      status: { type: "string", required: false, defaultValue: "PENDING" },
      approvedBy: { type: "string", required: false },
      approvedAt: { type: "date", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24,      // Refresh setiap 24 jam
  },
});
