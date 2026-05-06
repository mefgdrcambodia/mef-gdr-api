const baseRoute = "about-gs/role-and-responsibility/depament-general";
const Model = require("./department_general.model");
const checkValidtion = require("../../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  // Helper to parse JSON array (job_to_do)
  const parseJobToDoArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // CREATE or UPDATE (singleton – upsert)
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      let {
        // Main fields
        title_kh,
        title_en,
        description_kh,
        description_en,
        job_to_do, // JSON string or array
        status,

        // Office one
        office_one_title_kh,
        office_one_title_en,
        office_one_job_to_do,

        // Office two
        office_two_title_kh,
        office_two_title_en,
        office_two_job_to_do,

        // Office three
        office_three_title_kh,
        office_three_title_en,
        office_three_job_to_do,
      } = req.body;

      // Validation: required main fields
      const requiredFields = [
        { key: "title_kh", label: "title_kh" },
        { key: "title_en", label: "title_en" },
        { key: "description_kh", label: "description_kh" },
        { key: "description_en", label: "description_en" },
      ];
      if (checkValidtion(res, req, requiredFields)) return;

      // Build the main document object
      const updateData = {
        title: { kh: title_kh, en: title_en },
        description: { kh: description_kh, en: description_en },

        job_to_do: parseJobToDoArray(job_to_do),
        status: status === "true" || status === true || status === "1",
        updated_by: req.session.user_id,
        updated_date: new Date(),
      };

      // Office one (only title and job_to_do)
      if (office_one_title_kh || office_one_title_en || office_one_job_to_do) {
        updateData.office_one = {
          title: {
            kh: office_one_title_kh || "",
            en: office_one_title_en || "",
          },
          job_to_do: parseJobToDoArray(office_one_job_to_do),
        };
      }

      // Office two
      if (office_two_title_kh || office_two_title_en || office_two_job_to_do) {
        updateData.office_two = {
          title: {
            kh: office_two_title_kh || "",
            en: office_two_title_en || "",
          },
          job_to_do: parseJobToDoArray(office_two_job_to_do),
        };
      }

      // Office three
      if (
        office_three_title_kh ||
        office_three_title_en ||
        office_three_job_to_do
      ) {
        updateData.office_three = {
          title: {
            kh: office_three_title_kh || "",
            en: office_three_title_en || "",
          },
          job_to_do: parseJobToDoArray(office_three_job_to_do),
        };
      }

      try {
        const { user_id: userId } = req.session;

        const existingDoc = await Model.findOne();
        if (!existingDoc) {
          updateData.created_by = userId;
        } else {
          updateData.created_by = existingDoc.created_by;
        }

        const saveData = await Model.findOneAndUpdate({}, updateData, {
          new: true,
          upsert: true,
        });

        res.send({
          success: true,
          data: saveData,
          message: existingDoc
            ? "Department General updated successfully"
            : "Department General created successfully",
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

  // GET single document
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
          data: data || null,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );

  // GET single document
  const urlAPI_Fronted = `/${prop.main_route_fronted}/${baseRoute}`;
  prop.app.get(`${urlAPI_Fronted}`, prop.api_auth, async (req, res) => {
    try {
      const data = await Model.findOne()
        .populate("created_by", "name email")
        .populate("updated_by", "name email");

      res.status(200).send({
        success: true,
        data: data || null,
      });
    } catch (e) {
      res.status(400).send({ success: false, message: e.message });
    }
  });
};

module.exports = route;
