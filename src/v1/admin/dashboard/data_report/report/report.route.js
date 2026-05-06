const baseRoute = "report";
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../../../../util/cloudinaryConfig/cloudinaryConfig");
const Model = require("./report.model");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;
  const urlAPI_read_by_id = `/${prop.main_route}/${baseRoute}/:id`;

  // Category list for frontend
  const category = [
    {
      ssmr: {
        kh: "ស.ស.ម.ស",
        en: "SSMR",
      },
    },
    {
      drp: {
        kh: "គ.រ.ស",
        en: "DRP",
      },
    },
  ];

  // POST: Create or Update report
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

        // ---------- Handle cover image ----------
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
              "mef/report/covers",
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

        // ---------- Handle Khmer PDF file ----------
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
              "mef/report/pdf/kh",
              {
                resource_type: "raw",
                format: "pdf",
              },
            );
            pdfFileUrlKh = pdfResult.secure_url;
          } catch (uploadError) {
            console.error("Khmer PDF upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `Khmer PDF upload failed: ${uploadError.message}`,
            });
          }
        }

        // ---------- Handle English PDF file ----------
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
              "mef/report/pdf/en",
              {
                resource_type: "raw",
                format: "pdf",
              },
            );
            pdfFileUrlEn = pdfResult.secure_url;
          } catch (uploadError) {
            console.error("English PDF upload error:", uploadError);
            return res.status(400).send({
              success: false,
              message: `English PDF upload failed: ${uploadError.message}`,
            });
          }
        }

        // Prepare data
        const reportData = {
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

        let savedDoc;

        // Update existing document
        if (id && id !== "undefined" && id !== "null") {
          const existing = await Model.findById(id);
          if (!existing) {
            return res.status(404).send({
              success: false,
              message: "Report not found",
            });
          }

          reportData.created_by = existing.created_by;

          // Delete old cover image if replaced or removed
          if (existing.cover_image) {
            const shouldDeleteCover =
              (coverImageUrl && existing.cover_image !== coverImageUrl) ||
              (!coverImageUrl && shouldRemoveCoverImage);
            if (shouldDeleteCover) {
              await deleteFromCloudinary(existing.cover_image);
            }
          }

          // Delete old Khmer PDF if replaced or removed
          if (existing.pdf_file?.kh) {
            const shouldDeleteKh =
              (pdfFileUrlKh && existing.pdf_file.kh !== pdfFileUrlKh) ||
              (!pdfFileUrlKh && shouldRemovePdfFileKh);
            if (shouldDeleteKh) {
              await deleteFromCloudinary(existing.pdf_file.kh);
            }
          }

          // Delete old English PDF if replaced or removed
          if (existing.pdf_file?.en) {
            const shouldDeleteEn =
              (pdfFileUrlEn && existing.pdf_file.en !== pdfFileUrlEn) ||
              (!pdfFileUrlEn && shouldRemovePdfFileEn);
            if (shouldDeleteEn) {
              await deleteFromCloudinary(existing.pdf_file.en);
            }
          }

          savedDoc = await Model.findByIdAndUpdate(id, reportData, {
            new: true,
          });
        } else {
          // Create new
          reportData.created_by = userId;
          savedDoc = await Model.create(reportData);
        }

        res.send({
          success: true,
          data: savedDoc,
          message: id
            ? "Report updated successfully"
            : "Report created successfully",
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET all reports with pagination and filtering
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
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
          category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET single report by ID
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
            message: "Report not found",
          });
        }

        res.status(200).send({
          success: true,
          data,
          category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // DELETE report by ID (removes all associated files from Cloudinary)
  prop.app.delete(
    `${urlAPI_create_update_delete}/delete/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;
        const doc = await Model.findById(id);
        if (!doc) {
          return res.status(404).send({
            success: false,
            message: "Report not found",
          });
        }

        // Delete cover image (image resource)
        if (doc.cover_image) {
          try {
            await deleteFromCloudinary(doc.cover_image);
          } catch (err) {
            console.error("Error deleting cover image:", err);
          }
        }

        // Delete Khmer PDF (raw resource)
        if (doc.pdf_file?.kh) {
          try {
            await deleteFromCloudinary(doc.pdf_file.kh);
          } catch (err) {
            console.error("Error deleting Khmer PDF:", err);
          }
        }

        // Delete English PDF (raw resource)
        if (doc.pdf_file?.en) {
          try {
            await deleteFromCloudinary(doc.pdf_file.en);
          } catch (err) {
            console.error("Error deleting English PDF:", err);
          }
        }

        await Model.findByIdAndDelete(id);
        res.status(200).send({
          success: true,
          message: "Report deleted successfully",
        });
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
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
          category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );
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
            message: "Report not found",
          });
        }

        res.status(200).send({
          success: true,
          data,
          category,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );
};

module.exports = route;
