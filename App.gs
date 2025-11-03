/**
 * Entry point for the Classroom Reporter web app.
 * Renders the HTML template and injects initial data required for the UI.
 *
 * @param {GoogleAppsScript.Events.DoGet} e Request context from the web app.
 * @return {GoogleAppsScript.HTML.HtmlOutput} Rendered web UI.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.startup = getStartupData();
  return template
    .evaluate()
    .setTitle('Classroom Reporter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utility function used by the front-end to include additional HTML partials.
 * Apps Script exposes this globally when deployed as a web app.
 *
 * @param {string} filename The partial name without extension.
 * @return {string} The evaluated HTML.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Preloads data that the UI needs on first render (such as teacher profile
 * details and list of active courses).
 *
 * @return {Object} Data payload used to bootstrap the client UI.
 */
function getStartupData() {
  const profile = Classroom.UserProfiles.get('me');
  return {
    teacherName: profile.name.fullName,
    teacherEmail: profile.emailAddress,
    courses: ClassroomService.listActiveCourses(),
  };
}

/**
 * Proxy to fetch a teacher's roster for the requested course.
 * Exposed to the HTML front-end via google.script.run.
 *
 * @param {string} courseId Classroom course identifier.
 * @return {Object} Course roster metadata and student list.
 */
function getCourseRoster(courseId) {
  return ClassroomService.getCourseRoster(courseId);
}

/**
 * Builds a student summary report for the provided inputs.
 *
 * @param {Object} payload Form payload from the front-end.
 * @param {string} payload.courseId Course ID.
 * @param {string} payload.userId Student user ID or email.
 * @param {string} payload.startDate ISO date (inclusive).
 * @param {string} payload.endDate ISO date (inclusive).
 * @return {Object} Student report.
 */
function getStudentSummaryReport(payload) {
  return Reports.buildStudentSummary(payload);
}

/**
 * Returns a list of assignments that are missing for the specified student.
 *
 * @param {Object} payload Report request payload.
 * @param {string} payload.courseId Course ID.
 * @param {string} payload.userId Student user ID or email.
 * @return {Object} Missing work report.
 */
function getMissingWorkReport(payload) {
  return Reports.buildMissingWorkReport(payload);
}
