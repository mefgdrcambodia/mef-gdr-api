const baseRoute = "event/news";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./news.model.js");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;
  const urlAPI_read_by_id = `/${prop.main_route}/${baseRoute}/:id`;

  const category = [
    {
      event: {
        kh: "ព្រឹត្តិការណ៍",
        en: "event",
      },
    },
    {
      news: {
        kh: "ព័ត៌មាន",
        en: "news",
      },
    },
    {
      announcement: {
        kh: "សេចក្តីជូនដំណឹង",
        en: "announcement",
      },
    },
    {
      other: {
        kh: "ផេ្សងៗ",
        en: "other",
      },
    },
  ];

  // CREATE or UPDATE news - NO :id parameter here
  prop.app.post(
    `${urlAPI_create_update_delete}`, // Remove /:id from POST route
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([
      { name: "title_image", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
    async (req, res) => {
      let {
        title_kh,
        title_en,
        article_kh,
        article_en,
        category,
        status,
        existing_images,
        existing_title_image,
        removed_images,
        remove_title_image,
        id, // Get ID from body for update
      } = req.body;

      // Validation
      const requiredFields = [
        { key: "title_kh", label: "title_kh" },
        { key: "title_en", label: "title_en" },
        { key: "article_kh", label: "article_kh" },
        { key: "article_en", label: "article_en" },
        { key: "category", label: "category" },
      ];

      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        // Parse existing gallery images if provided
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

        // Parse removed images if provided
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
        } else if (
          existing_title_image &&
          existing_title_image !== "null" &&
          existing_title_image !== ""
        ) {
          titleImageUrl = existing_title_image;
        } else if (
          req.files &&
          req.files["title_image"] &&
          req.files["title_image"][0]
        ) {
          const titleImageFile = req.files["title_image"][0];
          try {
            const imageResult = await uploadToCloudinary(
              titleImageFile.buffer,
              "mef/news/titles",
              {
                transformation: [{ width: 800, height: 600, crop: "limit" }],
              },
            );
            titleImageUrl = imageResult.secure_url;
          } catch (uploadError) {
            console.error("Title image upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Title image upload failed: ${uploadError.message}`,
            });
          }
        }

        // Handle new gallery images
        let newImageUrls = [];
        if (
          req.files &&
          req.files["images"] &&
          req.files["images"].length > 0
        ) {
          for (const file of req.files["images"]) {
            try {
              const imageResult = await uploadToCloudinary(
                file.buffer,
                "mef/news/gallery",
                {
                  transformation: [{ width: 1200, height: 800, crop: "limit" }],
                },
              );
              newImageUrls.push(imageResult.secure_url);
            } catch (uploadError) {
              console.error("Gallery image upload error:", uploadError);
              return res.status(400).send({
                success: false,
                message: `Gallery image upload failed: ${uploadError.message}`,
              });
            }
          }
        }

        // Filter out removed images from existing ones
        const filteredExistingImages = existingImagesArray.filter(
          (img) => !removedImagesArray.includes(img),
        );

        // Combine existing (filtered) and new gallery images
        const allGalleryImages = [...filteredExistingImages, ...newImageUrls];

        // Prepare data for saving
        const newsData = {
          title: {
            kh: title_kh,
            en: title_en,
          },
          article: {
            kh: article_kh,
            en: article_en,
          },
          category: category,
          title_image: titleImageUrl,
          images: allGalleryImages,
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        let saveData;

        // Check if this is an update (if ID is provided)
        if (id && id !== "undefined" && id !== "null") {
          // Update existing news
          const existingNews = await Model.findById(id);
          if (!existingNews) {
            return res.status(404).send({
              success: false,
              message: "News not found",
            });
          }

          // Keep created_by for existing document
          newsData.created_by = existingNews.created_by;

          // Handle title image deletion if replaced or removed
          if (existingNews.title_image) {
            const shouldDeleteOldTitleImage =
              (titleImageUrl && existingNews.title_image !== titleImageUrl) ||
              (!titleImageUrl && shouldRemoveTitleImage);

            if (shouldDeleteOldTitleImage) {
              await deleteFromCloudinary(existingNews.title_image);
            }
          }

          // Handle gallery images deletion for removed images
          const imagesToDelete = existingNews.images.filter(
            (img) => !allGalleryImages.includes(img),
          );

          for (const imageToDelete of imagesToDelete) {
            await deleteFromCloudinary(imageToDelete);
          }

          saveData = await Model.findByIdAndUpdate(id, newsData, {
            new: true,
          });
        } else {
          // Create new news
          newsData.created_by = userId;
          saveData = await Model.create(newsData);
        }

        res.send({
          success: true,
          data: saveData,
          message: id
            ? "News updated successfully"
            : "News created successfully",
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

  // GET all news with pagination and filtering
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
          category: categoryFilter,
          status: statusFilter,
          search,
        } = req.query;

        let query = {};
        if (categoryFilter) query.category = categoryFilter;
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
          data: data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
          category: category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET single news by ID
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

        if (!data) {
          return res.status(404).send({
            success: false,
            message: "News not found",
          });
        }

        res.status(200).send({
          success: true,
          data: data,
          category: category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // DELETE news by ID
  prop.app.delete(
    `${urlAPI_create_update_delete}delete/:id`, // Keep :id for DELETE
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).send({
            success: false,
            message: "News ID is required",
          });
        }

        // Find the news
        const news = await Model.findById(id);
        if (!news) {
          return res.status(404).send({
            success: false,
            message: "News not found",
          });
        }

        // Delete title image from Cloudinary if exists
        if (news.title_image) {
          await deleteFromCloudinary(news.title_image);
        }

        // Delete all gallery images from Cloudinary
        for (const imageUrl of news.images) {
          await deleteFromCloudinary(imageUrl);
        }

        // Delete the news document
        await Model.findByIdAndDelete(id);

        res.status(200).send({
          success: true,
          message: "News deleted successfully",
        });
      } catch (e) {
        console.error("Delete error:", e);
        res.status(400).send({
          success: false,
          message: e.message,
        });
      }
    },
  );

  //  ==========Fronted==========
  const urlAPI_Fronted = `/${prop.main_route_fronted}/${baseRoute}`;
  prop.app.get(`${urlAPI_Fronted}`, prop.api_auth, async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category: categoryFilter,
        status: statusFilter,
        search,
      } = req.query;

      let query = {};
      if (categoryFilter) query.category = categoryFilter;
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
        data: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        category: category,
      });
    } catch (e) {
      res.status(400).send({ success: false, message: e.message });
    }
  });
  prop.app.get(
    `${urlAPI_Fronted}/:id`,
    prop.api_auth,

    async (req, res) => {
      try {
        const { id } = req.params;
        const data = await Model.findById(id)
          .populate("created_by", "name email")
          .populate("updated_by", "name email");

        if (!data) {
          return res.status(404).send({
            success: false,
            message: "News not found",
          });
        }

        res.status(200).send({
          success: true,
          data: data,
          category: category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );
};

module.exports = route;
