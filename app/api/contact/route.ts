import { NextRequest, NextResponse } from "next/server";

// Install Resend: npm install resend
// Then add RESEND_API_KEY to your .env.local
// Get a free key at: https://resend.com (free tier: 3,000 emails/month)

const OWNER_EMAIL = "swanjari2515@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if Resend is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — email will not be sent in production.");
      // Return success in dev so the UI works
      return NextResponse.json({ success: true, dev: true });
    }

    // Dynamically import resend to avoid build errors when package isn't installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Resend: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Resend = require("resend").Resend;
    } catch {
      return NextResponse.json({ error: "Email service not installed. Run: npm install resend" }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "SKW Portfolio <onboarding@resend.dev>",
      to: [OWNER_EMAIL],
      replyTo: email,
      subject: `[Portfolio] ${subject || `Message from ${name}`}`,
      html: `
        <div style="font-family:'JetBrains Mono',monospace,sans-serif;background:#09090F;color:#e2e8f0;padding:28px;border-radius:10px;max-width:560px">
          <div style="color:#7C6FFF;font-size:18px;font-weight:700;margin-bottom:16px">
            📨 New Portfolio Message
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
            <tr><td style="color:#64748b;padding:4px 12px 4px 0;width:70px">From</td>
                <td style="color:#00D4FF">${name} &lt;${email}&gt;</td></tr>
            <tr><td style="color:#64748b;padding:4px 12px 4px 0">Subject</td>
                <td style="color:#e2e8f0">${subject || "(none)"}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #1e1e2e;margin:16px 0"/>
          <div style="color:#94a3b8;font-size:13px;line-height:1.7;white-space:pre-wrap">${message}</div>
          <div style="margin-top:20px;color:#334155;font-size:11px">
            Sent via SKW Portfolio OS · Reply directly to ${email}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
