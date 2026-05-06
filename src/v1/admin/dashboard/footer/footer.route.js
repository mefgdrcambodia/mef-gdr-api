const baseRoute = "footer";
const Model = require("./footer.model");
const checkValidtion = require("../../../../util/checkValidation");

const route = (prop) => {
  const urlAPI_create_update_delete = `/${prop.main_route}/${baseRoute}/${prop.add_update_api}`;
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  prop.app.post(
    `${urlAPI_create_update_delete}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const {
        title,
        title_en,
        full_address,
        full_address_en,
        contact,
        email,
        copy_right,
        copy_right_en,
        copy_right_below,
        copy_right_below_en,
        url_mef,
      } = req.body;

      // Validation
      const requiredFields = [
        { key: "title", label: "title" },
        { key: "title_en", label: "title_en" },
        { key: "full_address", label: "full_address" },
        { key: "full_address_en", label: "full_address_en" },
        { key: "copy_right", label: "copy_right" },
        { key: "copy_right_en", label: "copy_right_en" },
        { key: "copy_right_below", label: "copy_right_below" },
        { key: "copy_right_below_en", label: "copy_right_below_en" },
        { key: "url_mef", label: "url_mef" },
      ];

      if (checkValidtion(res, req, requiredFields)) return;

      try {
        const { user_id: userId } = req.session;

        const saveData = await Model.findOneAndUpdate(
          {}, // ❗ no condition → only 1 record
          {
            title,
            title_en,
            full_address,
            full_address_en,
            contact,
            email,
            copy_right,
            copy_right_en,
            copy_right_below,
            copy_right_below_en,
            url_mef,
            updated_by: userId,
          },
          {
            new: true, // return updated data
            upsert: true, // create if not exist
          },
        );

        res.send({ success: true, data: saveData });
      } catch (e) {
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
        const data = await Model.find({});
        res.status(200).send({
          success: true,
          data: data[0],
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
      const data = await Model.find({});
      res.status(200).send({
        success: true,
        data: data[0],
      });
    } catch (e) {
      res.status(400).send({ success: false, message: e.message });
    }
  });
};

module.exports = route;
