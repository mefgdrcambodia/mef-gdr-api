const baseRoute = "about-gs/role-and-responsibility";
const Model = require("./role_and_responsibilty.model.js");
const checkValidtion = require("../../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  // CREATE or UPDATE (singleton – upsert)
  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      let { title_kh, title_en, article_kh, article_en, status } = req.body;

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

        // Prepare data
        const updateData = {
          title: { kh: title_kh, en: title_en },
          article: { kh: article_kh, en: article_en },
          status: status === "true" || status === true || status === "1",
          updated_by: userId,
          updated_date: new Date(),
        };

        // Fetch existing document to preserve created_by
        const existingDoc = await Model.findOne();
        if (!existingDoc) {
          updateData.created_by = userId;
        } else {
          updateData.created_by = existingDoc.created_by;
        }

        // Upsert (update or insert)
        const saveData = await Model.findOneAndUpdate(
          {}, // empty filter → matches the single document
          updateData,
          { new: true, upsert: true },
        );

        res.send({
          success: true,
          data: saveData,
          message: existingDoc
            ? "Role & Responsibility updated successfully"
            : "Role & Responsibility created successfully",
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
          data: data || null,
        });
      } catch (e) {
        res.status(400).send({ success: false, message: e.message });
      }
    },
  );
};

module.exports = route;
