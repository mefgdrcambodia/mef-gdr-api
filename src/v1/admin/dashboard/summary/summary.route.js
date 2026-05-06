const baseRoute = "summary/data";
const ModelNews = require("../event/news/news.model");
const ModelLegal = require("../event/legal/legal.model");
const ModelSpeech = require("../about_gs/speech/speech.model");
const ModelReport = require("../data_report/report/report.model");
const ModelHeader = require("../header/header.model");
const { default: axios } = require("axios");

const route = (prop) => {
  const urlAPI_read = `/${prop.main_route}/${baseRoute}`;

  prop.app.get(
    `${urlAPI_read}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { url } = req.query;
        const [newsCount, legalCount, speechCount, reportCount] =
          await Promise.all([
            ModelNews.countDocuments(),
            ModelLegal.countDocuments(),
            ModelSpeech.countDocuments(),
            ModelReport.countDocuments(),
          ]);

        const header = await ModelHeader.find({});
        const headerURL = header[0].url_logo;
        const resultAPI = await checkUrlStatus(headerURL);
        const resultFronted = await checkUrlStatus(url);
        res.status(200).send({
          success: true,
          data: {
            news: newsCount,
            legal: legalCount,
            speech: speechCount,
            report: reportCount,
            check_api_url: resultAPI,
            check_fronted_url: resultFronted,
          },
        });
      } catch (error) {
        console.error("Error fetching summary counts:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch summary data",
        });
      }
    },
  );
};

const checkUrlStatus = async (url) => {
  const start = Date.now();
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - start;
    return {
      status: "up",
      httpStatus: response.status,
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: "down",
      error: error.message,
    };
  }
};

module.exports = route;
