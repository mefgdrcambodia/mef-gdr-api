const helper = require("../../../util/helper");
const User = require("../user/user.model");
const baseRoute = "auth";
const { logActivity } = require("../../../util/log");
const Session = require("../session/session.model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const route = (prop) => {
  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  prop.app.get(
    `${urlAPI}/test-logged-in`,
    prop.api_auth,
    prop.jwt_auth,
    async (req, res) => {
      res.json({
        success: true,
        message: "API Connected : Permission and Access",
      });
    }
  );

  prop.app.post(`${urlAPI}/login`, prop.api_auth, async (req, res) => {
    const { email, password } = req.body;

    // 1. Validate required fields
    const requiredFields = { email, password };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.json({
          success: false,
          message: `Field '${key}' is required`,
        });
      }
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Username and Password!" }); // User Not Found
    }

    // 3. Check password (plaintext example — use bcrypt in real app)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid Username and Password!",
      }); //. Invalid Password
    }

    // Delete Account
    if (user.deleted) {
      return res.status(404).json({
        success: false,
        message: "មិនមានអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ!",
      });
    }

    // Delete Account
    if (!user.status) {
      return res.status(404).json({
        success: false,
        message: "គណនីត្រូវបានផ្អាក!",
      });
    }

    // send otp to email

    // 4. Log activity after successful login
    const logTitle = "auth";
    await logActivity({
      title: `ឧបករណ៍ ${
        helper.extractDeviceInfo(req).device
      } បានចូលគណនី (សាអេឡិចត្រូនិច : ${email})`,
      description: `ប្រើប្រាស់ ${
        helper.extractDeviceInfo(req).browser
      } ចូលក្នុងប្រព័ន្ធ - ${helper.cambodiaDate()}`,
      categoryTitle: logTitle,
      createdBy: user._id,
      req,
    });

    // 5. Create session
    const access_token = prop.jwt.sign(
      { userName: email, user: password },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );
    const existingSession = await Session.findOne({
      user_id: user._id,
    });

    if (existingSession) {
      // 🔄 Update existing session
      existingSession.time = helper.cambodiaDate();
      existingSession.access_token = access_token;
      existingSession.device = helper.extractDeviceInfo(req);
      await existingSession.save();
    } else {
      // ➕ Create new session
      const session = new Session({
        user_id: user._id,
        device: helper.extractDeviceInfo(req),
        create_by: user._id,
        time: helper.cambodiaDate(),
        access_token: access_token,
      });
      await session.save();
    }

    // 6. Return success
    const userData = user.toObject();
    delete userData.password;

    userData.access_token = access_token;
    res.json({
      success: true,
      data: userData,
      log: {
        device: helper.extractDeviceInfo(req),
      },
    });
  });
};

module.exports = route;
