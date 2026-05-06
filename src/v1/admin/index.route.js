const index = (prop) => {
  // Declaration
  prop.main_route = "api/v1/admin";
  prop.main_route_fronted = "api/v1/website-fronted";

  // All Route ==========================
  const authRoute = require("./auth/auth.route");
  const sessionRoute = require("./session/session.route");
  const userRoute = require("./user/user.route");
  const userGroupRoute = require("./user/group/group_user.route");
  const activityLogRoute = require("./activity_log/activity_log.route");
  const activityLogCategoryRoute = require("./activity_log_category/activity_log_category.route");
  const footer = require("./dashboard/footer/footer.route");
  const header = require("./dashboard/header/header.route");
  const banner = require("./dashboard/banner/banner.route");
  const eventNews = require("./dashboard/event/news/news.routes");
  const eventLegal = require("./dashboard/event/legal/legal.route");
  const gsMessage = require("./dashboard/about_gs/message.route");
  const gsRoleAndResponsibility = require("./dashboard/about_gs/role_and_responsibility/role_and_responsibilty.route");
  const gsManagemenStructure = require("./dashboard/about_gs/management_structure/management_structure.route");
  const gsSpeech = require("./dashboard/about_gs/speech/speech.route");
  const eventPhotoAlbum = require("./dashboard/event/photo_album/photo_album.route");
  const eventVideoAlbum = require("./dashboard/event/video_album/video_album.route");
  const dataReport = require("./dashboard/data_report/report/report.route");
  const summaryRoute = require("./dashboard/summary/summary.route");

  // Implement ==========================
  authRoute(prop); // Auth
  sessionRoute(prop); // Auth
  userRoute(prop); // User
  userGroupRoute(prop); // Group Permission
  activityLogRoute(prop); // Log
  activityLogCategoryRoute(prop); // Log
  footer(prop);
  header(prop);
  banner(prop);
  eventNews(prop);
  eventLegal(prop);
  gsMessage(prop);
  gsRoleAndResponsibility(prop);
  gsManagemenStructure(prop);
  gsSpeech(prop);
  eventPhotoAlbum(prop);
  eventVideoAlbum(prop);
  dataReport(prop);
  summaryRoute(prop);

  const depGeneral = require("./dashboard/about_gs/role_and_responsibility/department_general/department_general.route");
  depGeneral(prop);

  const depManageData = require("./dashboard/about_gs/role_and_responsibility/department_manage_data/department_manage_data.route");
  depManageData(prop);

  const depResttleMent_One = require("./dashboard/about_gs/role_and_responsibility/department_resttlement_one/department_resttlement_one.route");
  depResttleMent_One(prop);

  const depResttleMent_Two = require("./dashboard/about_gs/role_and_responsibility/department_resttlement_two/department_resttlement_two.route");
  depResttleMent_Two(prop);

  const depResttleMent_Three = require("./dashboard/about_gs/role_and_responsibility/department_resttlement_three/department_resttlement_three.route");
  depResttleMent_Three(prop);

  // Anthorized || V1 Testing
  const location = require("../app/location/location.route");
  location(prop);
};

module.exports = index;
