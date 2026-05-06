const QRCode = require("qrcode");
const encryptQR = require("./encryptQR");

exports.generateQR = async (req, res) => {
  const encrypted = encryptQR({
    username: "admin01",
    password: "Penv!sa@123",
    user_type: "ADMIN",
    is_expired: false,
    exp: Date.now() + 60000, // optional
  });

  const qrImage = await QRCode.toDataURL(encrypted);

  res.json({
    success: true,
    qr_image: qrImage,
  });
};
