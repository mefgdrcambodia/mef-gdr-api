const helper = require("../../../util/helper");
const UAParser = require("ua-parser-js");
const { body, validationResult } = require("express-validator");
const User = require("../user/user.model");
const ActivityLog = require("./activity_log.model");
const baseRoute = "activity_log";
const { createActivityLogger } = require("../../../util/createActivityLog");

const route = (prop) => {
  // **************** Declaration ****************
  const urlAPI = `/${prop.main_route}/${baseRoute}`;
  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    createActivityLogger({
      title: "Admin បានចូលគណនី",
      description: "User successfully logged in",
      type: "Authorization",
    }),
    (req, res) => {
      // Final response — can access log from `req.activityLog` if needed
      res.status(201).json({
        success: true,
        message: "Activity log created",
        data: req.activityLog,
      });
    }
  );

  //   prop.app.post(
  //     `${urlAPI}`,
  //     prop.api_auth,
  //     [
  //       body("title").notEmpty().withMessage("Title is required"),
  //       body("description").notEmpty().withMessage("Description is required"),
  //       body("type").notEmpty().withMessage("Type is required"),
  //       body("username").notEmpty().withMessage("Username is required"),
  //     ],
  //     async (req, res) => {
  //       const errors = validationResult(req);
  //       if (!errors.isEmpty()) {
  //         return res.status(400).json({ success: false, errors: errors.array() });
  //       }

  //       const { title, description, type, username } = req.body;
  //       const user = await User.findOne({ username: username });

  //       if (!user) {
  //         return res
  //           .status(404)
  //           .json({ success: false, message: "User not found" });
  //       }

  //       const deviceInfo = extractDeviceInfo(req);
  //       const log = new ActivityLog({
  //         title,
  //         description,
  //         type,
  //         device: deviceInfo,
  //         time: helper.cambodiaDate(),
  //         create_by: user._id,
  //       });

  //       await log.save();

  //       res.status(201).json({
  //         success: true,
  //         message: "Activity log created",
  //         data: log,
  //       });
  //     }
  //   );

  //   prop.app.get(urlAPI, prop.api_auth, async (req, res) => {
  //     const username = req.query.username;
  //     const user = await User.findOne({ username: username });
  //     if (!user) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "User not found" });
  //     }

  //     res.send({
  //       success: true,
  //       message: "API Connectedd",
  //       user: user,
  //     });
  //   });

  //   function extractDeviceInfo(req) {
  //     const userAgent = req.headers["user-agent"] || "";
  //     const parser = new UAParser(userAgent);
  //     const result = parser.getResult();

  //     return {
  //       browser: result.browser.name + " " + result.browser.version,
  //       os: result.os.name + " " + result.os.version,
  //       device: result.device.type || "desktop",
  //       userAgent: userAgent,
  //     };
  //   }
};

module.exports = route;
