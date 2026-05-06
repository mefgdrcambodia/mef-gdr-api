const baseRoute = "about-gs/speech";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./speech.model");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;
  const urlAPI_read_by_id = `/${prop.main_route}/${baseRoute}/:id`;

  // POST: Create or Update (supports title image)
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([{ name: "title_image", maxCount: 1 }]),
    async (req, res) => {
      let {
        title_kh,
        title_en,
        article_kh,
        article_en,
        status,
        existing_title_image,
        remove_title_image,
        id,
      } = req.body;

      // Validation
      const requiredFields = [
        { key: "title_kh", label: "title_kh" },
        { key: "title_en", label: "title_en" },
        { key: "article_kh", label: "article_kh" },
        { key: "article_en", label: "article_en" },
      ];
      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        // Handle title image
        let titleImageUrl = null;
        const shouldRemoveTitleImage =
          remove_title_image === "true" || remove_title_image === true;

        if (shouldRemoveTitleImage) {
          titleImageUrl = null;
        } else if (
          existing_title_image &&
          existing_title_image !== "null" &&
          existing_title_image !== ""
        ) {
          titleImageUrl = existing_title_image;
        } else if (req.files?.title_image?.[0]) {
          const result = await uploadToCloudinary(
            req.files.title_image[0].buffer,
            "about-gs/speech/titles",
            { transformation: [{ width: 800, height: 600, crop: "limit" }] },
          );
          titleImageUrl = result.secure_url;
        }

        // Prepare data
        const speechData = {
          title: { kh: title_kh, en: title_en },
          article: { kh: article_kh, en: article_en },
          title_image: titleImageUrl,
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        let savedDoc;

        if (id && id !== "undefined" && id !== "null") {
          // Update existing
          const existing = await Model.findById(id);
          if (!existing) {
            return res
              .status(404)
              .send({ success: false, message: "Speech not found" });
          }

          // Delete old title image if replaced or removed
          if (existing.title_image) {
            const shouldDelete =
              (titleImageUrl && existing.title_image !== titleImageUrl) ||
              (!titleImageUrl && shouldRemoveTitleImage);
            if (shouldDelete) {
              await deleteFromCloudinary(existing.title_image);
            }
          }

          speechData.created_by = existing.created_by;
          savedDoc = await Model.findByIdAndUpdate(id, speechData, {
            new: true,
          });
        } else {
          // Create new
          speechData.created_by = userId;
          savedDoc = await Model.create(speechData);
        }

        res.send({
          success: true,
          data: savedDoc,
          message: id ? "Updated successfully" : "Created successfully",
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET all with pagination, search, status filter
  prop.app.get(
    `${urlAPI_read}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const {
          page = 1,
          limit = 10,
          status: statusFilter,
          search,
        } = req.query;
        let query = {};
        if (statusFilter) query.status = statusFilter === "true";
        if (search) {
          query.$or = [
            { "title.kh": { $regex: search, $options: "i" } },
            { "title.en": { $regex: search, $options: "i" } },
          ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
          Model.find(query)
            .sort({ created_date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("created_by", "name email")
            .populate("updated_by", "name email"),
          Model.countDocuments(query),
        ]);
        res.status(200).send({
          success: true,
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET single by ID
  prop.app.get(
    `${urlAPI_read_by_id}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;
        const data = await Model.findById(id)
          .populate("created_by", "name email")
          .populate("updated_by", "name email");
        if (!data)
          return res.status(404).send({ success: false, message: "Not found" });
        res.status(200).send({ success: true, data });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // DELETE by ID (removes title image from Cloudinary)
  prop.app.delete(
    `${urlAPI_create_update_delete}delete/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;
        const doc = await Model.findById(id);
        if (!doc)
          return res.status(404).send({ success: false, message: "Not found" });

        if (doc.title_image) await deleteFromCloudinary(doc.title_image);
        await Model.findByIdAndDelete(id);
        res
          .status(200)
          .send({ success: true, message: "Deleted successfully" });
      } catch (e) {
        console.error(e);
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
        const {
          page = 1,
          limit = 10,
          status: statusFilter,
          search,
        } = req.query;
        let query = {};
        if (statusFilter) query.status = statusFilter === "true";
        if (search) {
          query.$or = [
            { "title.kh": { $regex: search, $options: "i" } },
            { "title.en": { $regex: search, $options: "i" } },
          ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
          Model.find(query)
            .sort({ created_date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("created_by", "name email")
            .populate("updated_by", "name email"),
          Model.countDocuments(query),
        ]);
        res.status(200).send({
          success: true,
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  prop.app.get(`${urlAPI_Fronted}/:id`, prop.api_auth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = await Model.findById(id)
        .populate("created_by", "name email")
        .populate("updated_by", "name email");
      if (!data)
        return res.status(404).send({ success: false, message: "Not found" });
      res.status(200).send({ success: true, data });
    } catch (e) {
      res.status(400).send({ success: false, message: e.message });
    }
  });
};

module.exports = route;
