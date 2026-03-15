// /api/demo.js — StaffingHUD Vercel Serverless Function
// Receives demo request form submissions and emails chris@staffinghud.com via Resend

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, agency, size, type, message } = req.body || {};

  if (!name || !email || !agency) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060a08;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0c1109;border:1px solid #223320;padding:40px;">

    <div style="margin-bottom:24px;">
      <span style="font-family:monospace;font-size:12px;letter-spacing:0.22em;color:#00e57a;font-weight:700;">◈ STAFFINGHUD</span>
      <span style="font-family:monospace;font-size:10px;color:#3a5a42;margin-left:10px;letter-spacing:0.2em;">· NEW DEMO REQUEST</span>
    </div>

    <div style="font-size:20px;font-weight:700;color:#eef4f0;margin-bottom:20px;font-family:monospace;letter-spacing:0.04em;">
      DEMO REQUEST RECEIVED
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">NAME</td>
        <td style="font-size:14px;color:#eef4f0;padding:10px 14px;border:1px solid #1a2716;">${name}</td>
      </tr>
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">EMAIL</td>
        <td style="font-size:14px;color:#00e57a;padding:10px 14px;border:1px solid #1a2716;"><a href="mailto:${email}" style="color:#00e57a;">${email}</a></td>
      </tr>
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">AGENCY</td>
        <td style="font-size:14px;color:#eef4f0;padding:10px 14px;border:1px solid #1a2716;">${agency}</td>
      </tr>
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">TEAM SIZE</td>
        <td style="font-size:14px;color:#eef4f0;padding:10px 14px;border:1px solid #1a2716;">${size || "Not specified"}</td>
      </tr>
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">JOB TYPES</td>
        <td style="font-size:14px;color:#eef4f0;padding:10px 14px;border:1px solid #1a2716;">${type || "Not specified"}</td>
      </tr>
      ${message ? `
      <tr>
        <td style="font-family:monospace;font-size:9px;color:#3a5a42;letter-spacing:0.2em;padding:10px 14px;border:1px solid #1a2716;background:#060a08;white-space:nowrap;vertical-align:top;">MESSAGE</td>
        <td style="font-size:14px;color:#c8dfd0;padding:10px 14px;border:1px solid #1a2716;line-height:1.65;">${message.replace(/\n/g, '<br>')}</td>
      </tr>` : ''}
    </table>

    <a href="mailto:${email}?subject=StaffingHUD Demo — ${encodeURIComponent(agency)}"
       style="display:inline-block;background:rgba(0,229,122,0.08);border:1px solid #00e57a;color:#00e57a;padding:12px 24px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-decoration:none;font-family:monospace;">
      ◈ REPLY TO ${name.split(' ')[0].toUpperCase()}
    </a>

    <div style="margin-top:28px;font-size:11px;color:#3a5a42;font-family:monospace;border-top:1px solid #1a2716;padding-top:16px;line-height:1.8;">
      Submitted via staffinghud.com · ${new Date().toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" })}
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "StaffingHUD <users@staffinghud.com>",
        to: ["cwstaples.backup@gmail.com"],
        reply_to: email,
        subject: `Demo Request — ${agency} (${name})`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      console.error("Resend error:", err);
      return res.status(500).json({ error: "Failed to send email" });
    }

    // Also send confirmation to the prospect
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "StaffingHUD <users@staffinghud.com>",
        to: [email],
        subject: "We received your demo request",
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060a08;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0c1109;border:1px solid #223320;padding:40px;">
    <div style="margin-bottom:28px;">
      <span style="font-family:monospace;font-size:12px;letter-spacing:0.22em;color:#00e57a;font-weight:700;">◈ STAFFINGHUD</span>
    </div>
    <div style="font-size:20px;font-weight:700;color:#eef4f0;margin-bottom:12px;font-family:monospace;letter-spacing:0.04em;">
      REQUEST RECEIVED
    </div>
    <div style="font-size:14px;color:#7a9b85;line-height:1.75;margin-bottom:24px;">
      Hi ${name.split(' ')[0]}, thanks for reaching out. We'll be in touch within 24 hours to schedule a walkthrough of StaffingHUD for ${agency}.
    </div>
    <div style="font-size:13px;color:#3a5a42;line-height:1.75;">
      In the meantime, you can learn more at <a href="https://www.staffinghud.com" style="color:#00e57a;">staffinghud.com</a>.
    </div>
    <div style="margin-top:28px;font-size:11px;color:#3a5a42;font-family:monospace;border-top:1px solid #1a2716;padding-top:16px;">
      STAFFINGHUD · RECRUITMENT OPERATIONS COMMAND PLATFORM
    </div>
  </div>
</body>
</html>`,
      }),
    }).catch(() => {}); // Don't block if confirmation fails

    return res.status(200).json({ ok: true });

  } catch(err) {
    console.error("Demo handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
