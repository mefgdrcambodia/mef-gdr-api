const baseRoute = "header";
const multer = require("multer");
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./header.model");
const checkValidtion = require("../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "banner", maxCount: 10 }, // Accept up to 10 banner files
    ]),
    async (req, res) => {
      let {
        mef_name_full,
        mef_name_full_en,
        mef_name_short,
        mef_name_short_en,
        running_text,
        running_text_en,
        existing_logo_url,
        existing_banners, // New: JSON string array of existing banner objects
      } = req.body;

      // Validation
      const requiredFields = [
        { key: "mef_name_full", label: "mef_name_full" },
        { key: "mef_name_full_en", label: "mef_name_full_en" },
        { key: "mef_name_short", label: "mef_name_short" },
        { key: "mef_name_short_en", label: "mef_name_short_en" },
        { key: "running_text", label: "running_text" },
        { key: "running_text_en", label: "running_text_en" },
      ];

      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        // Parse running_text if it's a JSON string
        let parsedRunningText = [];
        let parsedRunningTextEn = [];

        if (running_text) {
          try {
            parsedRunningText =
              typeof running_text === "string"
                ? JSON.parse(running_text)
                : running_text;
          } catch (e) {
            console.error("Error parsing running_text:", e);
            parsedRunningText = [];
          }
        }

        if (running_text_en) {
          try {
            parsedRunningTextEn =
              typeof running_text_en === "string"
                ? JSON.parse(running_text_en)
                : running_text_en;
          } catch (e) {
            console.error("Error parsing running_text_en:", e);
            parsedRunningTextEn = [];
          }
        }

        // Parse existing_banners if provided (JSON string array of { url: string })
        let parsedExistingBanners = [];
        if (existing_banners) {
          try {
            parsedExistingBanners =
              typeof existing_banners === "string"
                ? JSON.parse(existing_banners)
                : existing_banners;
          } catch (e) {
            console.error("Error parsing existing_banners:", e);
            parsedExistingBanners = [];
          }
        }

        // Get existing data for deleting old images
        const existingData = await Model.findOne({});

        // ----- Logo Handling (unchanged) -----
        let logoUrl = existing_logo_url;
        if (req.files?.logo?.[0]) {
          try {
            if (existingData?.url_logo) {
              await deleteFromCloudinary(existingData.url_logo);
            }
            const logoResult = await uploadToCloudinary(
              req.files.logo[0].buffer,
              "mef/logos",
              {
                transformation: [{ width: 500, height: 500, crop: "limit" }],
              },
            );
            logoUrl = logoResult.secure_url;
          } catch (uploadError) {
            console.error("Logo upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Logo upload failed: ${uploadError.message}`,
            });
          }
        }

        // ----- Multiple Banners Handling -----
        let bannersArray = [];

        if (req.files?.banner && req.files.banner.length > 0) {
          // New banner files uploaded → replace all old banners
          try {
            // Delete all existing banner images from Cloudinary
            if (existingData?.banners && existingData.banners.length) {
              for (const banner of existingData.banners) {
                if (banner.url) {
                  await deleteFromCloudinary(banner.url).catch((err) =>
                    console.error("Error deleting banner:", err),
                  );
                }
              }
            }

            // Upload each new banner file
            const uploadPromises = req.files.banner.map((file) =>
              uploadToCloudinary(file.buffer, "mef/banners", {
                transformation: [{ width: 1920, height: 1080, crop: "limit" }],
              }).then((result) => ({ url: result.secure_url })),
            );
            bannersArray = await Promise.all(uploadPromises);
          } catch (uploadError) {
            console.error("Banner upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Banner upload failed: ${uploadError.message}`,
            });
          }
        } else {
          // No new banner files → use existing banners (either from request or DB)
          bannersArray =
            parsedExistingBanners.length > 0
              ? parsedExistingBanners
              : existingData?.banners || [];
        }

        // Prepare update data
        const updateData = {
          mef_name_full,
          mef_name_full_en,
          mef_name_short,
          mef_name_short_en,
          running_text: parsedRunningText,
          running_text_en: parsedRunningTextEn,
          url_logo: logoUrl,
          banners: bannersArray, // Store array of banner objects
          updated_by: userId,
          updated_at: new Date(),
        };

        // If creating new document, add created_by
        if (!existingData) {
          updateData.created_by = userId;
        }

        // Save to database
        const saveData = await Model.findOneAndUpdate({}, updateData, {
          new: true,
          upsert: true,
        });

        res.send({
          success: true,
          data: saveData,
          message: "Data saved successfully",
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

  prop.app.get(
    `${urlAPI_read}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const data = await Model.findOne({});
        res.status(200).send({
          success: true,
          data: data || {},
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  const urlAPI_Fronted = `/${prop.main_route_fronted}/${baseRoute}`;
  prop.app.get(`${urlAPI_Fronted}`, prop.api_auth, async (req, res) => {
    try {
      const data = await Model.findOne({});
      res.status(200).send({
        success: true,
        data: data || {},
      });
    } catch (e) {
      res.status(400).send({ success: false, message: e.message });
    }
  });
};

module.exports = route;
