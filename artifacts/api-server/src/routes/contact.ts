import { Router } from "express";

const contactRouter = Router();

// POST /api/contact — hero registration handler
contactRouter.post("/contact", (req, res) => {
  const { nama, email, password } = req.body as {
    nama?: string;
    email?: string;
    password?: string;
  };

  if (!nama || !email || !password) {
    return res.status(400).json({ success: false, message: "Semua field harus diisi" });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password minimal 8 karakter" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Format email tidak valid" });
  }

  req.log.info({ nama, email }, "[Tales Hero] Pendaftaran baru");

  return res.status(200).json({ success: true, message: "Akun berhasil dibuat!" });
});

export default contactRouter;
