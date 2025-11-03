/**
 * Lightweight wrapper around the Google Classroom advanced service.
 * Centralizes interactions with courses, rosters, coursework, and submissions.
 */
const ClassroomService = (() => {
  const COURSE_FIELDS = 'id,name,section,descriptionHeading,alternateLink';
  const STUDENT_FIELDS = 'userId,profile(name,emailAddress,photoUrl)';
  const COURSEWORK_FIELDS = 'id,title,workType,dueDate,dueTime,creationTime,updateTime,alternateLink';
  const SUBMISSION_FIELDS = 'id,userId,state,late,updateTime,courseWorkId,assignedGrade,draftGrade';

  /**
   * Lists the teacher's active courses ordered alphabetically.
   *
   * @return {Array<Object>} Course metadata.
   */
  function listActiveCourses() {
    const response = Classroom.Courses.list({
      teacherId: 'me',
      courseStates: ['ACTIVE'],
      pageSize: 100,
    });

    const courses = response.courses || [];
    courses.sort((a, b) => a.name.localeCompare(b.name));
    return courses.map(({ id, name, section, descriptionHeading, alternateLink }) => ({
      id,
      name,
      section,
      descriptionHeading,
      alternateLink,
    }));
  }

  /**
   * Returns roster details for the provided course.
   *
   * @param {string} courseId Course identifier.
   * @return {Object} Roster payload containing course info and students.
   */
  function getCourseRoster(courseId) {
    const course = Classroom.Courses.get(courseId, { fields: COURSE_FIELDS });
    const students = paginate(
      (token) =>
        Classroom.Courses.Students.list(courseId, {
          pageToken: token,
          fields: `students(${STUDENT_FIELDS}),nextPageToken`,
        }),
      'students'
    ).map((student) => ({
      userId: student.userId,
      name: student.profile.name.fullName,
      email: student.profile.emailAddress,
      photoUrl: student.profile.photoUrl,
    }));

    return {
      course: {
        id: course.id,
        name: course.name,
        section: course.section,
        alternateLink: course.alternateLink,
      },
      students,
    };
  }


  /**
   * Retrieves a single student record from a course.
   *
   * @param {string} courseId Course identifier.
   * @param {string} userId Student identifier or email.
   * @return {Object} Student profile metadata.
   */
  function getStudent(courseId, userId) {
    const student = Classroom.Courses.Students.get(courseId, userId, {
      fields: STUDENT_FIELDS,
    });
    return {
      userId: student.userId,
      name: student.profile.name.fullName,
      email: student.profile.emailAddress,
      photoUrl: student.profile.photoUrl,
    };
  }

  /**
   * Fetches coursework for the given course within a date window.
   *
   * @param {string} courseId Course identifier.
   * @param {string} [startDate] ISO string inclusive lower bound.
   * @param {string} [endDate] ISO string inclusive upper bound.
   * @return {Array<Object>} Coursework metadata.
   */
  function listCoursework(courseId, startDate, endDate) {
    const response = paginate(
      (token) =>
        Classroom.Courses.CourseWork.list(courseId, {
          pageToken: token,
          orderBy: 'dueDate desc,updateTime desc',
          fields: `courseWork(${COURSEWORK_FIELDS}),nextPageToken`,
        }),
      'courseWork'
    );

    return response.filter((item) => {
      if (!startDate && !endDate) {
        return true;
      }
      const timestamp = item.dueDate
        ? toDateTime(item.dueDate, item.dueTime).getTime()
        : new Date(item.updateTime).getTime();
      const afterStart = !startDate || timestamp >= new Date(startDate).getTime();
      const beforeEnd = !endDate || timestamp <= endOfDay(endDate).getTime();
      return afterStart && beforeEnd;
    });
  }

  /**
   * Fetches all student submissions for the given course and coursework list.
   *
   * @param {string} courseId Course identifier.
   * @param {Array<string>} courseworkIds List of coursework IDs.
   * @return {Array<Object>} Submission records.
   */
  function listSubmissions(courseId, courseworkIds) {
    const submissions = [];
    courseworkIds.forEach((courseWorkId) => {
      const records = paginate(
        (token) =>
          Classroom.Courses.CourseWork.StudentSubmissions.list(courseId, courseWorkId, {
            pageToken: token,
            fields: `studentSubmissions(${SUBMISSION_FIELDS}),nextPageToken`,
          }),
        'studentSubmissions'
      );
      submissions.push(...records);
    });
    return submissions;
  }

  /**
   * Generic pagination helper for Google APIs.
   *
   * @param {function(string=):Object} requestFn Function that executes the API request.
   * @param {string} itemsKey Name of the collection in the response.
   * @return {Array<Object>} Aggregated list of items.
   */
  function paginate(requestFn, itemsKey) {
    const items = [];
    let token;
    do {
      const response = requestFn(token) || {};
      if (response[itemsKey]) {
        items.push(...response[itemsKey]);
      }
      token = response.nextPageToken;
    } while (token);
    return items;
  }

  return {
    listActiveCourses,
    getCourseRoster,
    getStudent,
    listCoursework,
    listSubmissions,
  };
})();
