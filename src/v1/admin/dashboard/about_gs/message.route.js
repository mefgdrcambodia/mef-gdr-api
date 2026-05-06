const baseRoute = "about-gs/message";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./message.model.js");
const checkValidtion = require("../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  // CREATE or UPDATE (singleton)
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([{ name: "leader_profile", maxCount: 1 }]),
    async (req, res) => {
      let {
        name_kh,
        name_en,
        job_title_kh,
        job_title_en,
        message_kh,
        message_en,
        status,
        existing_leader_profile,
        remove_leader_profile,
      } = req.body;

      // Validation: name is required in both languages
      const requiredFields = [
        { key: "name_kh", label: "name_kh" },
        { key: "name_en", label: "name_en" },
      ];

      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        // 1. Fetch existing document to handle image deletion if needed
        const existingDoc = await Model.findOne();

        // 2. Handle leader profile image
        let leaderProfileUrl = null;
        const shouldRemoveProfile =
          remove_leader_profile === "true" || remove_leader_profile === true;

        if (shouldRemoveProfile) {
          leaderProfileUrl = null;
        } else if (
          existing_leader_profile &&
          existing_leader_profile !== "null" &&
          existing_leader_profile !== ""
        ) {
          leaderProfileUrl = existing_leader_profile;
        } else if (
          req.files &&
          req.files["leader_profile"] &&
          req.files["leader_profile"][0]
        ) {
          const profileFile = req.files["leader_profile"][0];
          try {
            const uploadResult = await uploadToCloudinary(
              profileFile.buffer,
              "mef/message/profiles",
              {
                transformation: [{ width: 400, height: 400, crop: "fill" }],
              },
            );
            leaderProfileUrl = uploadResult.secure_url;
          } catch (uploadError) {
            console.error("Leader profile upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Leader profile image upload failed: ${uploadError.message}`,
            });
          }
        }

        // 3. Delete old image from Cloudinary if replaced or removed
        if (existingDoc && existingDoc.leader_profile) {
          const oldImage = existingDoc.leader_profile;
          const imageChanged =
            (leaderProfileUrl && oldImage !== leaderProfileUrl) ||
            (!leaderProfileUrl && shouldRemoveProfile);

          if (imageChanged) {
            try {
              await deleteFromCloudinary(oldImage, "image");
            } catch (err) {
              console.error("Error deleting old leader profile image:", err);
              // Continue even if deletion fails
            }
          }
        }

        // 4. Prepare data for saving
        const messageData = {
          name: {
            kh: name_kh,
            en: name_en,
          },
          job_title: {
            kh: job_title_kh || "",
            en: job_title_en || "",
          },
          message: {
            kh: message_kh || "",
            en: message_en || "",
          },
          leader_profile: leaderProfileUrl,
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        // 5. If creating for the first time, set created_by
        if (!existingDoc) {
          messageData.created_by = userId;
        } else {
          // Keep existing created_by
          messageData.created_by = existingDoc.created_by;
        }

        // 6. Upsert (update or insert)
        const saveData = await Model.findOneAndUpdate(
          {}, // empty filter -> matches the single document
          messageData,
          {
            new: true, // return updated document
            upsert: true, // create if none exists
          },
        );

        res.send({
          success: true,
          data: saveData,
          message: existingDoc
            ? "Message updated successfully"
            : "Message created successfully",
        });
      } catch (e) {
        console.error("Error:", e);
        res.status(400).send({
          success: false,
          message: e.message,
        });
      }
    },
  );

  // GET single message
  prop.app.get(
    `${urlAPI_read}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const data = await Model.findOne()
          .populate("created_by", "name email")
          .populate("updated_by", "name email");

        res.status(200).send({
          success: true,
          data: data || null, // return null if no document exists yet
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  //  ==========Fronted==========
  const urlAPI_Fronted = `/${prop.main_route_fronted}/${baseRoute}`;
  prop.app.get(
    `${urlAPI_Fronted}`,
    prop.api_auth,

    async (req, res) => {
      try {
        const data = await Model.findOne()
          .populate("created_by", "name email")
          .populate("updated_by", "name email");

        res.status(200).send({
          success: true,
          data: data || null, // return null if no document exists yet
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );
};

module.exports = route;
