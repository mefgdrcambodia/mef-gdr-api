const baseRoute = "about-gs/management-structure";
const multer = require("multer");
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./management_structure.model");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  // POST: Create or update
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([
      { name: "image_kh", maxCount: 1 },
      { name: "image_en", maxCount: 1 },
    ]),
    async (req, res) => {
      let { existing_image_kh, existing_image_en, article_kh, article_en } =
        req.body;

      try {
        const { user_id: userId } = req.session;

        // Get existing document (there should be only one)
        const existingDoc = await Model.findOne({});

        // Initialize image URLs with existing values
        let imageKhUrl = existing_image_kh;
        let imageEnUrl = existing_image_en;

        // ---------- Handle Khmer image ----------
        if (req.files?.image_kh?.[0]) {
          try {
            if (existingDoc?.url_image?.kh) {
              await deleteFromCloudinary(existingDoc.url_image.kh);
            }
            const result = await uploadToCloudinary(
              req.files.image_kh[0].buffer,
              "about_gs/management_structure",
              {
                transformation: [{ width: 1200, height: 800, crop: "limit" }],
              },
            );
            imageKhUrl = result.secure_url;
          } catch (err) {
            console.error("Khmer image upload error:", err);
            return res.status(400).send({
              success: false,
              message: `Khmer image upload failed: ${err.message}`,
            });
          }
        }

        // ---------- Handle English image ----------
        if (req.files?.image_en?.[0]) {
          try {
            if (existingDoc?.url_image?.en) {
              await deleteFromCloudinary(existingDoc.url_image.en);
            }
            const result = await uploadToCloudinary(
              req.files.image_en[0].buffer,
              "about_gs/management_structure",
              {
                transformation: [{ width: 1200, height: 800, crop: "limit" }],
              },
            );
            imageEnUrl = result.secure_url;
          } catch (err) {
            console.error("English image upload error:", err);
            return res.status(400).send({
              success: false,
              message: `English image upload failed: ${err.message}`,
            });
          }
        }

        // Validate images
        if (!imageKhUrl || !imageEnUrl) {
          return res.status(400).send({
            success: false,
            message: "Both Khmer and English images are required!",
          });
        }

        // Prepare update data - now including article
        const updateData = {
          article: {
            kh: article_kh,
            en: article_en,
          },
          url_image: {
            kh: imageKhUrl,
            en: imageEnUrl,
          },
          updated_by: userId,
        };

        // If creating new document, add created_by
        if (!existingDoc) {
          updateData.created_by = userId;
        }

        // Upsert
        const saved = await Model.findOneAndUpdate({}, updateData, {
          new: true,
          upsert: true,
        });

        res.send({
          success: true,
          data: saved,
          message: "Management structure saved successfully",
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET: fetch the single document
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

  //  ==========Fronted==========
  const urlAPI_Fronted = `/${prop.main_route_fronted}/${baseRoute}`;
  prop.app.get(
    `${urlAPI_Fronted}`,
    prop.api_auth,

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
};

module.exports = route;
