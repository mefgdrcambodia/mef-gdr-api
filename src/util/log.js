const ActivityLog = require("../v1/admin/activity_log/activity_log.model");
const ActivityLogCategory = require("../v1/admin/activity_log_category/activity_log_category.model");
const helper = require("./helper"); // adjust path if needed

async function logActivity({
  title,
  description,
  categoryTitle,
  createdBy,
  req,
}) {
  try {
    const dateLog = helper.cambodiaDate();
    const categoryLog = await ActivityLogCategory.findOne({
      title: categoryTitle,
    });

    if (!categoryLog) {
    //  console.warn(`Log category '${categoryTitle}' not found.`);
      return;
    }

    const log = new ActivityLog({
      title,
      description,
      activity_log_category_id: categoryLog._id,
      create_by_id: createdBy,
      device: helper.extractDeviceInfo(req),
      time: dateLog,
    });

    await log.save();
  } catch (err) {
   // console.error("Failed to log activity:", err);
    // Don't throw here to avoid crashing the main request flow
  }
}

module.exports = { logActivity };
