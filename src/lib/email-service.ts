import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// Inisialisasi transporter nodemailer secara dinamis
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "⚠️ SMTP Mailer belum dikonfigurasi di file .env. Sistem berjalan dalam mode DRY-RUN (log email dicetak di konsol saja)."
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true untuk 465, false untuk port lainnya
    auth: {
      user,
      pass,
    },
  });
}

// Fungsi utama pengiriman email
export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const from = process.env.SMTP_FROM || `"Silsilah Bani Abd. Mutthalib" <no-reply@baniabdmutthalib.id>`;
  
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.log(`[DRY-RUN EMAIL]
To: ${to}
Subject: ${subject}
Content: (Lihat cuplikan HTML di bawah ini)
--------------------------------------------
${html.replace(/<[^>]*>/g, "").slice(0, 500)}...
--------------------------------------------`);
      return true;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`✉️ Email berhasil dikirim ke: ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Gagal mengirim email:", error);
    return false;
  }
}

// Templating Email Premium bertema HSL Gold / Slate Dark
function getEmailWrapper(contentHtml: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #0b0b0f;
          color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #13131a;
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .header {
          background: linear-gradient(135deg, #1e1b12 0%, #13131a 100%);
          padding: 30px 40px;
          text-align: center;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #d4a853;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .body {
          padding: 40px;
          line-height: 1.6;
          color: #d1d5db;
        }
        .footer {
          background-color: #0b0b0f;
          padding: 20px 40px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          border-top: 1px solid rgba(255,255,255,0.03);
        }
        h1 {
          color: #f3f4f6;
          font-size: 22px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 25px;
          text-transform: uppercase;
        }
        .status-approved {
          background-color: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .status-rejected {
          background-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .btn {
          display: inline-block;
          background: linear-gradient(90deg, #d4a853 0%, #b38632 100%);
          color: #0b0b0f !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 25px;
          box-shadow: 0 4px 15px rgba(212, 168, 83, 0.2);
        }
        .details {
          background-color: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 13px;
        }
        .details-row:last-child {
          border-bottom: 0;
        }
        .label {
          color: #9ca3af;
          font-weight: 500;
        }
        .value {
          color: #f3f4f6;
          font-weight: 600;
          text-align: right;
        }
        .note {
          margin-top: 20px;
          padding: 15px;
          background-color: rgba(255,255,255,0.01);
          border-left: 3px solid #d4a853;
          border-radius: 0 8px 8px 0;
          font-size: 13px;
          font-style: italic;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Bani Abd. Mutthalib</div>
        </div>
        <div class="body">
          ${contentHtml}
        </div>
        <div class="footer">
          Platform Silsilah Keluarga Bani Abd. Mutthalib<br>
          © 2024–2026 baniabdmutthalib.id
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Notifikasi Persetujuan Submisi Anggota Keluarga (Add / Edit)
export async function sendSubmissionNotification({
  to,
  userName,
  personName,
  changeType,
  status,
  adminNote,
}: {
  to: string;
  userName: string;
  personName: string;
  changeType: "ADD" | "EDIT";
  status: "APPROVED" | "REJECTED";
  adminNote?: string;
}) {
  const changeLabel = changeType === "ADD" ? "Penambahan Anggota Baru" : "Perubahan Data Anggota";
  const statusLabel = status === "APPROVED" ? "Disetujui" : "Ditolak";
  const badgeClass = status === "APPROVED" ? "status-approved" : "status-rejected";

  const contentHtml = `
    <h1>Halo, ${userName}!</h1>
    <p>Terima kasih atas kontribusi Anda dalam melengkapi data silsilah keluarga besar Bani Abd. Mutthalib. Admin telah meninjau usulan data yang Anda kirimkan.</p>
    
    <div style="text-align: center;">
      <span class="status-badge ${badgeClass}">${statusLabel}</span>
    </div>

    <div class="details">
      <div class="details-row">
        <span class="label">Jenis Usulan</span>
        <span class="value">${changeLabel}</span>
      </div>
      <div class="details-row">
        <span class="label">Nama Anggota</span>
        <span class="value">${personName}</span>
      </div>
      <div class="details-row">
        <span class="label">Status Keputusan</span>
        <span class="value" style="color: ${status === "APPROVED" ? "#4ade80" : "#f87171"}">${statusLabel}</span>
      </div>
    </div>

    ${
      adminNote
        ? `<div class="note"><strong>Catatan Peninjau:</strong> "${adminNote}"</div>`
        : ""
    }

    <p style="margin-top: 30px;">
      ${
        status === "APPROVED"
          ? "Data ini kini telah resmi dimasukkan ke dalam pohon silsilah keluarga utama. Anda dapat melihatnya langsung di platform."
          : "Mohon tinjau catatan peninjau di atas untuk informasi lebih lanjut mengenai alasan penolakan data ini."
      }
    </p>

    <div style="text-align: center;">
      <a href="${process.env.BETTER_AUTH_URL || "https://silsilah-tan.vercel.app"}/pohon" class="btn">Buka Pohon Silsilah</a>
    </div>
  `;

  const subject = `[Silsilah BAM] Usulan Data Keluarga ${personName} - ${statusLabel}`;
  const html = getEmailWrapper(contentHtml, subject);

  return sendEmail({ to, subject, html });
}

// 2. Notifikasi Keputusan Registrasi / Pengaktifan Akun Pengguna
export async function sendUserStatusNotification({
  to,
  userName,
  status,
  adminNote,
}: {
  to: string;
  userName: string;
  status: "ACTIVE" | "REJECTED" | "SUSPENDED";
  adminNote?: string;
}) {
  const statusLabel =
    status === "ACTIVE"
      ? "Aktif"
      : status === "REJECTED"
      ? "Ditolak"
      : "Ditangguhkan";
  const badgeClass = status === "ACTIVE" ? "status-approved" : "status-rejected";

  const contentHtml = `
    <h1>Halo, ${userName}!</h1>
    <p>Berikut adalah kabar terbaru terkait status pengajuan akun dan hak kontribusi Anda di platform silsilah keluarga Bani Abd. Mutthalib.</p>
    
    <div style="text-align: center;">
      <span class="status-badge ${badgeClass}">Akun ${statusLabel}</span>
    </div>

    <div class="details">
      <div class="details-row">
        <span class="label">Nama Pengguna</span>
        <span class="value">${userName}</span>
      </div>
      <div class="details-row">
        <span class="label">Status Akun</span>
        <span class="value" style="color: ${status === "ACTIVE" ? "#4ade80" : "#f87171"}">${statusLabel}</span>
      </div>
    </div>

    ${
      adminNote
        ? `<div class="note"><strong>Catatan Admin:</strong> "${adminNote}"</div>`
        : ""
    }

    <p style="margin-top: 30px;">
      ${
        status === "ACTIVE"
          ? "Selamat! Akun Anda telah berhasil diaktifkan. Anda sekarang dapat masuk dan berkontribusi melengkapi data silsilah keluarga Anda secara penuh."
          : "Mohon perhatikan catatan keputusan admin di atas terkait status penolakan atau penangguhan akun Anda."
      }
    </p>

    <div style="text-align: center;">
      <a href="${process.env.BETTER_AUTH_URL || "https://silsilah-tan.vercel.app"}/masuk" class="btn">Masuk Ke Platform</a>
    </div>
  `;

  const subject = `[Silsilah BAM] Status Akun Pengguna Anda - ${statusLabel}`;
  const html = getEmailWrapper(contentHtml, subject);

  return sendEmail({ to, subject, html });
}
