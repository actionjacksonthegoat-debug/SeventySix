const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

let emails = [];
const MAX_STORED_EMAILS = 1000;

// ── Brevo API endpoint — captures emails ─────────────────────────
app.post("/v3/smtp/email", (req, res) => {
  const apiKey = req.headers["api-key"];
  if (!apiKey) {
    return res
      .status(401)
      .json({ code: "unauthorized", message: "Missing api-key header" });
  }

  const { sender, to, subject, htmlContent } = req.body;
  if (!sender?.email || !to?.length || !subject || !htmlContent) {
    return res.status(400).json({
      code: "invalid_parameter",
      message: "Missing required fields: sender, to, subject, htmlContent",
    });
  }

  const messageId = `<${crypto.randomUUID()}@mock-brevo>`;

  // Store in E2E fixture-compatible format
  const email = {
    id: crypto.randomUUID(),
    messageId,
    from: [{ address: sender.email, name: sender.name || "" }],
    to: to.map((t) => ({ address: t.email, name: t.name || "" })),
    subject,
    html: htmlContent,
    text: "",
    receivedAt: new Date().toISOString(),
  };

  emails.push(email);

  if (emails.length > MAX_STORED_EMAILS) {
    emails = emails.slice(-MAX_STORED_EMAILS);
  }

  const sanitize = (value) =>
    String(value).replace(/[\r\n\t]/g, "").slice(0, 200);

  const safeSubject = sanitize(subject);
  const safeRecipients = to
    .map((t) => sanitize(t.email).replace(/(?<=.{2}).+(?=@)/, "***"))
    .join(", ");

  console.log(
    `[mock-brevo] Captured: "${safeSubject}" → ${safeRecipients}`
  );

  res.status(201).json({ messageId });
});

// ── Email retrieval endpoints (for E2E fixture) ─────────────────────
app.get("/email", (_req, res) => {
  res.json(emails);
});

app.delete("/email/all", (_req, res) => {
  const count = emails.length;
  emails = [];
  console.log(`[mock-brevo] Cleared ${count} emails`);
  res.status(200).json({ message: "ok" });
});

// ── Health check ─────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", emailCount: emails.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[mock-brevo] Mock Brevo API listening on port ${PORT}`);
});
