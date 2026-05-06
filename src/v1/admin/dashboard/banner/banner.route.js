const baseRoute = "banner";
const multer = require("multer");
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./banner.model");
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
      { name: "image_about", maxCount: 1 },
      { name: "image_news", maxCount: 1 },
      { name: "image_document", maxCount: 1 },
      { name: "image_report", maxCount: 1 },
    ]),
    async (req, res) => {
      let {
        existing_about,
        existing_news,
        existing_document,
        existing_report,
        remove_about,
        remove_news,
        remove_document,
        remove_report,
        status,
      } = req.body;

      // Validation – all four images are required (at least existing or new upload)
      // But we'll check after processing.
      try {
        const { user_id: userId } = req.session;

        // Helper to process a single image field
        const processImage = async (fieldName, existingUrl, removeFlag) => {
          const shouldRemove = removeFlag === "true" || removeFlag === true;
          if (shouldRemove) return null;
          if (existingUrl && existingUrl !== "null" && existingUrl !== "") {
            return existingUrl;
          }
          if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            const result = await uploadToCloudinary(
              req.files[fieldName][0].buffer,
              "website/banners",
              { transformation: [{ width: 1920, height: 600, crop: "limit" }] },
            );
            return result.secure_url;
          }
          return null;
        };

        // Process each banner image
        const aboutUrl = await processImage(
          "image_about",
          existing_about,
          remove_about,
        );
        const newsUrl = await processImage(
          "image_news",
          existing_news,
          remove_news,
        );
        const documentUrl = await processImage(
          "image_document",
          existing_document,
          remove_document,
        );
        const reportUrl = await processImage(
          "image_report",
          existing_report,
          remove_report,
        );

        // Validate that all four URLs exist after processing
        if (!aboutUrl) {
          return res.status(400).send({
            success: false,
            message: "About banner image is required",
          });
        }
        if (!newsUrl) {
          return res.status(400).send({
            success: false,
            message: "News & Event banner image is required",
          });
        }
        if (!documentUrl) {
          return res.status(400).send({
            success: false,
            message: "Document Collection banner image is required",
          });
        }
        if (!reportUrl) {
          return res.status(400).send({
            success: false,
            message: "Report banner image is required",
          });
        }

        // Prepare update data
        const updateData = {
          url_about_general_department: aboutUrl,
          url_new_and_event: newsUrl,
          url_document_collection: documentUrl,
          url_report: reportUrl,
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        // Get existing document to delete old images if replaced
        const existing = await Model.findOne({});
        if (existing) {
          // Delete old images if they have been replaced
          if (
            existing.url_about_general_department &&
            existing.url_about_general_department !== aboutUrl
          ) {
            await deleteFromCloudinary(existing.url_about_general_department);
          }
          if (
            existing.url_new_and_event &&
            existing.url_new_and_event !== newsUrl
          ) {
            await deleteFromCloudinary(existing.url_new_and_event);
          }
          if (
            existing.url_document_collection &&
            existing.url_document_collection !== documentUrl
          ) {
            await deleteFromCloudinary(existing.url_document_collection);
          }
          if (existing.url_report && existing.url_report !== reportUrl) {
            await deleteFromCloudinary(existing.url_report);
          }
          updateData.created_by = existing.created_by;
        } else {
          updateData.created_by = userId;
        }

        const saved = await Model.findOneAndUpdate({}, updateData, {
          new: true,
          upsert: true,
        });

        res.send({
          success: true,
          data: saved,
          message: "Banner settings saved successfully",
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ success: false, message: e.message });
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

  //  ==========Fronted==========
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
