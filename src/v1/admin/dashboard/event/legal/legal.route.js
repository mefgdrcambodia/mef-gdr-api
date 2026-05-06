const baseRoute = "legal";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./legal.model.js");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;
  const urlAPI_read_by_id = `/${prop.main_route}/${baseRoute}/:id`;

  const category = [
    {
      law: {
        kh: "ច្បាប់",
        en: "Law",
      },
    },
    {
      regulation: {
        kh: "បទប្បញ្ញត្តិ",
        en: "Regulation",
      },
    },
    {
      decree: {
        kh: "អនុក្រឹត្យ",
        en: "Decree",
      },
    },
    {
      proclamation: {
        kh: "សេចក្តីប្រកាស",
        en: "Proclamation",
      },
    },
    {
      directive: {
        kh: "សេចក្តីណែនាំ",
        en: "Directive",
      },
    },
    {
      other: {
        kh: "ផ្សេងៗ",
        en: "Other",
      },
    },
  ];

  // CREATE or UPDATE legal document
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    upload.fields([
      { name: "cover_image", maxCount: 1 },
      { name: "pdf_file_kh", maxCount: 1 },
      { name: "pdf_file_en", maxCount: 1 },
    ]),
    async (req, res) => {
      let {
        title_kh,
        title_en,
        description_kh,
        description_en,
        category,
        status,
        published_date,
        document_number,
        existing_cover_image,
        existing_pdf_file_kh,
        existing_pdf_file_en,
        remove_cover_image,
        remove_pdf_file_kh,
        remove_pdf_file_en,
        id,
      } = req.body;

      // Validation
      const requiredFields = [
        { key: "title_kh", label: "title_kh" },
        { key: "title_en", label: "title_en" },
        { key: "category", label: "category" },
      ];

      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        // Handle cover image
        let coverImageUrl = null;
        const shouldRemoveCoverImage =
          remove_cover_image === "true" || remove_cover_image === true;

        if (shouldRemoveCoverImage) {
          coverImageUrl = null;
        } else if (
          existing_cover_image &&
          existing_cover_image !== "null" &&
          existing_cover_image !== ""
        ) {
          coverImageUrl = existing_cover_image;
        } else if (
          req.files &&
          req.files["cover_image"] &&
          req.files["cover_image"][0]
        ) {
          const coverImageFile = req.files["cover_image"][0];
          try {
            const imageResult = await uploadToCloudinary(
              coverImageFile.buffer,
              "mef/legal/covers",
              {
                transformation: [{ width: 800, height: 600, crop: "limit" }],
              },
            );
            coverImageUrl = imageResult.secure_url;
          } catch (uploadError) {
            console.error("Cover image upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Cover image upload failed: ${uploadError.message}`,
            });
          }
        }

        // Handle Khmer PDF file
        let pdfFileUrlKh = null;
        const shouldRemovePdfFileKh =
          remove_pdf_file_kh === "true" || remove_pdf_file_kh === true;

        if (shouldRemovePdfFileKh) {
          pdfFileUrlKh = null;
        } else if (
          existing_pdf_file_kh &&
          existing_pdf_file_kh !== "null" &&
          existing_pdf_file_kh !== ""
        ) {
          pdfFileUrlKh = existing_pdf_file_kh;
        } else if (
          req.files &&
          req.files["pdf_file_kh"] &&
          req.files["pdf_file_kh"][0]
        ) {
          const pdfFile = req.files["pdf_file_kh"][0];
          try {
            const pdfResult = await uploadToCloudinary(
              pdfFile.buffer,
              "mef/legal/pdf/kh",
              {
                resource_type: "raw",
                format: "pdf",
              },
            );
            pdfFileUrlKh = pdfResult.secure_url;
          } catch (uploadError) {
            console.error("Khmer PDF file upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Khmer PDF file upload failed: ${uploadError.message}`,
            });
          }
        }

        // Handle English PDF file
        let pdfFileUrlEn = null;
        const shouldRemovePdfFileEn =
          remove_pdf_file_en === "true" || remove_pdf_file_en === true;

        if (shouldRemovePdfFileEn) {
          pdfFileUrlEn = null;
        } else if (
          existing_pdf_file_en &&
          existing_pdf_file_en !== "null" &&
          existing_pdf_file_en !== ""
        ) {
          pdfFileUrlEn = existing_pdf_file_en;
        } else if (
          req.files &&
          req.files["pdf_file_en"] &&
          req.files["pdf_file_en"][0]
        ) {
          const pdfFile = req.files["pdf_file_en"][0];
          try {
            const pdfResult = await uploadToCloudinary(
              pdfFile.buffer,
              "mef/legal/pdf/en",
              {
                resource_type: "raw",
                format: "pdf",
              },
            );
            pdfFileUrlEn = pdfResult.secure_url;
          } catch (uploadError) {
            console.error("English PDF file upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `English PDF file upload failed: ${uploadError.message}`,
            });
          }
        }

        // Prepare data for saving
        const legalData = {
          title: {
            kh: title_kh,
            en: title_en,
          },
          description: {
            kh: description_kh || "",
            en: description_en || "",
          },
          category: category,
          cover_image: coverImageUrl,
          pdf_file: {
            kh: pdfFileUrlKh,
            en: pdfFileUrlEn,
          },
          published_date: published_date
            ? new Date(published_date)
            : new Date(),
          document_number: document_number || "",
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        let saveData;

        // Check if this is an update (if ID is provided)
        if (id && id !== "undefined" && id !== "null") {
          // Update existing legal document
          const existingLegal = await Model.findById(id);
          if (!existingLegal) {
            return res.status(404).send({
              success: false,
              message: "Legal document not found",
            });
          }

          // Keep created_by for existing document
          legalData.created_by = existingLegal.created_by;

          // Handle cover image deletion if replaced or removed
          if (existingLegal.cover_image) {
            const shouldDeleteOldCoverImage =
              (coverImageUrl && existingLegal.cover_image !== coverImageUrl) ||
              (!coverImageUrl && shouldRemoveCoverImage);

            if (shouldDeleteOldCoverImage) {
              await deleteFromCloudinary(existingLegal.cover_image);
            }
          }

          // Handle Khmer PDF file deletion if replaced or removed
          if (existingLegal.pdf_file?.kh) {
            const shouldDeleteOldPdfFileKh =
              (pdfFileUrlKh && existingLegal.pdf_file.kh !== pdfFileUrlKh) ||
              (!pdfFileUrlKh && shouldRemovePdfFileKh);

            if (shouldDeleteOldPdfFileKh) {
              await deleteFromCloudinary(existingLegal.pdf_file.kh);
            }
          }

          // Handle English PDF file deletion if replaced or removed
          if (existingLegal.pdf_file?.en) {
            const shouldDeleteOldPdfFileEn =
              (pdfFileUrlEn && existingLegal.pdf_file.en !== pdfFileUrlEn) ||
              (!pdfFileUrlEn && shouldRemovePdfFileEn);

            if (shouldDeleteOldPdfFileEn) {
              await deleteFromCloudinary(existingLegal.pdf_file.en);
            }
          }

          saveData = await Model.findByIdAndUpdate(id, legalData, {
            new: true,
          });
        } else {
          // Create new legal document
          legalData.created_by = userId;
          saveData = await Model.create(legalData);
        }

        res.send({
          success: true,
          data: saveData,
          message: id
            ? "Legal document updated successfully"
            : "Legal document created successfully",
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

  // GET all legal documents with pagination and filtering
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
            { document_number: { $regex: search, $options: "i" } },
          ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [data, total] = await Promise.all([
          Model.find(query)
            .sort({ published_date: -1, created_date: -1 })
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

  // GET single legal document by ID
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
            message: "Legal document not found",
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

  // DELETE legal document by ID
  prop.app.delete(
    `${urlAPI_create_update_delete}:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).send({
            success: false,
            message: "Legal document ID is required",
          });
        }

        // Find the legal document
        const legal = await Model.findById(id);
        if (!legal) {
          return res.status(404).send({
            success: false,
            message: "Legal document not found",
          });
        }

        // Delete cover image from Cloudinary if exists (resource type: image)
        if (legal.cover_image) {
          try {
            await deleteFromCloudinary(legal.cover_image, "image");
          } catch (err) {
            console.error("Error deleting cover image:", err);
          }
        }

        // Delete Khmer PDF file from Cloudinary if exists (resource type: raw)
        if (legal.pdf_file?.kh) {
          try {
            await deleteFromCloudinary(legal.pdf_file.kh, "raw");
          } catch (err) {
            console.error("Error deleting Khmer PDF:", err);
          }
        }

        // Delete English PDF file from Cloudinary if exists (resource type: raw)
        if (legal.pdf_file?.en) {
          try {
            await deleteFromCloudinary(legal.pdf_file.en, "raw");
          } catch (err) {
            console.error("Error deleting English PDF:", err);
          }
        }

        // Delete the legal document
        await Model.findByIdAndDelete(id);

        res.status(200).send({
          success: true,
          message: "Legal document deleted successfully",
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
          { document_number: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [data, total] = await Promise.all([
        Model.find(query)
          .sort({ published_date: -1, created_date: -1 })
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
            message: "Legal document not found",
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
