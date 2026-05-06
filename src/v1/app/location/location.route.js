const baseRoute = "location";
const { model } = require("mongoose");
const LocationModel = require("./location.model");

const route = (prop) => {
  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  prop.app.post(urlAPI, async (req, res) => {
    try {
      const { name, longitude, latitude } = req.body;

      if (!name || !longitude || !latitude) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      const location = await LocationModel.create({
        name,
        longitude,
        latitude,
      });

      res.status(201).json({
        message: "Location created successfully",
        data: location,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  });

  prop.app.get(urlAPI + "-all", async (req, res) => {
    const data = await LocationModel.find({});
    res.send({
      data: data,
    });
  });

  prop.app.get(urlAPI + "/:id", async (req, res) => {
    const { id } = req.params;
    const data = await LocationModel.findOne({ _id: id });
    res.send({
      data: data,
    });
  });
};

module.exports = route;
