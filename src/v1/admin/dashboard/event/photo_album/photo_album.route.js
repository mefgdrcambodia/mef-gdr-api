const baseRoute = "event/photo-album";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./photo_album.model");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;
  const urlAPI_read_by_id = `/${prop.main_route}/${baseRoute}/:id`;

  // POST: Create or Update (supports unlimited gallery images)
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([
      { name: "title_image", maxCount: 1 },
      { name: "images", maxCount: Infinity }, // ← Unlimited gallery images
    ]),
    async (req, res) => {
      let {
        title_kh,
        title_en,
        article_kh,
        article_en,
        status,
        existing_images,
        existing_title_image,
        removed_images,
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

        // Parse existing gallery images
        let existingImagesArray = [];
        if (existing_images) {
          try {
            existingImagesArray =
              typeof existing_images === "string"
                ? JSON.parse(existing_images)
                : existing_images;
          } catch (e) {
            console.error("Error parsing existing_images:", e);
          }
        }

        // Parse removed images
        let removedImagesArray = [];
        if (removed_images) {
          try {
            removedImagesArray =
              typeof removed_images === "string"
                ? JSON.parse(removed_images)
                : removed_images;
          } catch (e) {
            console.error("Error parsing removed_images:", e);
          }
        }

        // Handle title image
        let titleImageUrl = null;
        const shouldRemoveTitleImage =
          remove_title_image === "true" || remove_title_image === true;

        if (shouldRemoveTitleImage) {
          titleImageUrl = null;
        } else if (existing_title_image && existing_title_image !== "null") {
          titleImageUrl = existing_title_image;
        } else if (req.files?.title_image?.[0]) {
          const result = await uploadToCloudinary(
            req.files.title_image[0].buffer,
            "event/photo-album/titles",
            { transformation: [{ width: 800, height: 600, crop: "limit" }] },
          );
          titleImageUrl = result.secure_url;
        }

        // Handle new gallery images (unlimited number)
        let newImageUrls = [];
        if (req.files?.images?.length) {
          for (const file of req.files.images) {
            const result = await uploadToCloudinary(
              file.buffer,
              "event/photo-album/gallery",
              { transformation: [{ width: 1200, height: 800, crop: "limit" }] },
            );
            newImageUrls.push(result.secure_url);
          }
        }

        // Filter out removed images from existing ones
        const filteredExistingImages = existingImagesArray.filter(
          (img) => !removedImagesArray.includes(img),
        );
        const allGalleryImages = [...filteredExistingImages, ...newImageUrls];

        // Prepare data
        const updateData = {
          title: { kh: title_kh, en: title_en },
          article: { kh: article_kh, en: article_en },
          title_image: titleImageUrl,
          images: allGalleryImages,
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
              .send({ success: false, message: "Not found" });
          }
          // Delete old title image if replaced or removed
          if (
            existing.title_image &&
            existing.title_image !== titleImageUrl &&
            !shouldRemoveTitleImage
          ) {
            await deleteFromCloudinary(existing.title_image);
          } else if (shouldRemoveTitleImage && existing.title_image) {
            await deleteFromCloudinary(existing.title_image);
          }
          // Delete gallery images that are no longer present
          const imagesToDelete = existing.images.filter(
            (img) => !allGalleryImages.includes(img),
          );
          for (const img of imagesToDelete) {
            await deleteFromCloudinary(img);
          }
          updateData.created_by = existing.created_by;
          savedDoc = await Model.findByIdAndUpdate(id, updateData, {
            new: true,
          });
        } else {
          // Create new
          updateData.created_by = userId;
          savedDoc = await Model.create(updateData);
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

  // GET all with pagination and search (unchanged)
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

  // GET single by ID (unchanged)
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

  // DELETE by ID (unchanged)
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
        // Delete title image
        if (doc.title_image) await deleteFromCloudinary(doc.title_image);
        // Delete all gallery images
        for (const img of doc.images) {
          await deleteFromCloudinary(img);
        }
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
