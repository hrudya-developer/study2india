const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config/config.env",
});

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://study2india.com"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Study2India mail server is running",
  });
});

app.post("/api/send-email", async (req, res) => {
  const { name, email, phone, place, message } = req.body;

  if (!name || !email || !phone || !place || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    await transporter.sendMail({
      from: `"Study2India - Enquiries" <${process.env.EMAIL_USER}>`,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: "Study2India - Enquiries",
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Place: ${place}

Message:
${message}
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.log("Email error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send email",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});