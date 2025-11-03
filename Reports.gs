/**
 * Business logic for building Classroom report payloads.
 */
const Reports = (() => {
  /**
   * Builds a student summary report containing assignment status counts and
   * detailed activity information.
   *
   * @param {Object} payload Report request payload.
   * @param {string} payload.courseId Course identifier.
   * @param {string} payload.userId Student identifier or email.
   * @param {string} [payload.startDate] Optional ISO date filter (inclusive).
   * @param {string} [payload.endDate] Optional ISO date filter (inclusive).
   * @return {Object} Summary report payload.
   */
  function buildStudentSummary(payload) {
    validatePayload(payload, ['courseId', 'userId']);
    const { courseId, userId, startDate, endDate } = payload;

    const course = Classroom.Courses.get(courseId, {
      fields: 'id,name,section,alternateLink',
    });
    const student = ClassroomService.getStudent(courseId, userId);

    const coursework = ClassroomService.listCoursework(courseId, startDate, endDate);
    const submissions = ClassroomService.listSubmissions(
      courseId,
      coursework.map((item) => item.id)
    ).filter((submission) => submission.userId === student.userId);

    const submissionMap = new Map();
    submissions.forEach((submission) => submissionMap.set(submission.courseWorkId, submission));

    const effectiveEnd = endDate ? endOfDay(endDate) : new Date();
    const metrics = {
      totalAssigned: coursework.length,
      turnedIn: 0,
      returned: 0,
      graded: 0,
      missing: 0,
      late: 0,
    };

    const activities = coursework.map((item) => {
      const submission = submissionMap.get(item.id);
      const status = deriveStatus(item, submission, effectiveEnd);
      accumulateMetrics(metrics, status, submission);

      const dueDate = item.dueDate ? toDateTime(item.dueDate, item.dueTime) : null;
      const submittedAt = submission && submission.updateTime ? new Date(submission.updateTime) : null;

      return {
        id: item.id,
        title: item.title,
        workType: item.workType,
        link: item.alternateLink,
        dueDate: dueDate ? formatDate(dueDate) : null,
        dueDateLabel: dueDate ? formatDisplayDate(dueDate) : 'No due date',
        submittedAt: submittedAt ? formatDisplayDate(submittedAt) : null,
        status,
        grade: deriveGrade(submission),
      };
    });

    return {
      course,
      student,
      filters: { startDate: startDate || null, endDate: endDate || null },
      summary: metrics,
      activities,
    };
  }

  /**
   * Builds a missing work report using the student summary as a base.
   *
   * @param {Object} payload Report request payload.
   * @return {Object} Missing work summary and assignments list.
   */
  function buildMissingWorkReport(payload) {
    const summary = buildStudentSummary(payload);
    const missing = summary.activities.filter((item) => item.status.code === 'MISSING');
    return {
      course: summary.course,
      student: summary.student,
      filters: summary.filters,
      totalMissing: missing.length,
      assignments: missing,
    };
  }

  /**
   * Validates that required payload properties are present.
   *
   * @param {Object} payload Request payload.
   * @param {Array<string>} required Fields to validate.
   */
  function validatePayload(payload, required) {
    if (!payload) {
      throw new Error('Request payload is required');
    }
    required.forEach((field) => {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }

  /**
   * Determines the status for the provided coursework/submission pair.
   *
   * @param {Object} coursework Coursework metadata.
   * @param {Object} submission Submission record (may be undefined).
   * @param {Date} effectiveEnd Date to use when deciding if an item is missing.
   * @return {Object} Status descriptor.
   */
  function deriveStatus(coursework, submission, effectiveEnd) {
    const dueDate = coursework.dueDate ? toDateTime(coursework.dueDate, coursework.dueTime) : null;
    const dueHasPassed = !!dueDate && dueDate.getTime() <= effectiveEnd.getTime();

    if (!submission) {
      return {
        code: dueHasPassed ? 'MISSING' : 'ASSIGNED',
        label: dueHasPassed ? 'Missing' : 'Assigned',
        late: false,
      };
    }

    const base = {
      code: submission.state,
      label: prettifyState(submission.state),
      late: submission.late === true,
    };

    if (submission.state === 'RETURNED') {
      base.code = 'RETURNED';
      base.label = submission.late ? 'Returned (late)' : 'Returned';
    } else if (submission.state === 'TURNED_IN') {
      base.code = 'TURNED_IN';
      base.label = submission.late ? 'Turned in (late)' : 'Turned in';
    } else if (
      submission.state === 'RECLAIMED_BY_STUDENT' ||
      submission.state === 'CREATED' ||
      submission.state === 'NEW' ||
      submission.state === 'DRAFT'
    ) {
      base.code = dueHasPassed ? 'MISSING' : 'ASSIGNED';
      base.label = dueHasPassed ? 'Missing' : 'Assigned';
    }

    return base;
  }

  /**
   * Accumulates summary metrics from the derived status and submission.
   *
   * @param {Object} metrics Metrics accumulator.
   * @param {Object} status Status descriptor.
   * @param {Object} submission Submission record (may be undefined).
   */
  function accumulateMetrics(metrics, status, submission) {
    if (status.code === 'TURNED_IN') {
      metrics.turnedIn += 1;
    }
    if (status.code === 'RETURNED') {
      metrics.returned += 1;
    }
    if (status.code === 'MISSING') {
      metrics.missing += 1;
    }
    if (status.late) {
      metrics.late += 1;
    }
    if (submission && typeof submission.assignedGrade === 'number') {
      metrics.graded += 1;
    }
  }

  /**
   * Derives the best available grade value for display.
   *
   * @param {Object} submission Submission record.
   * @return {string|null}
   */
  function deriveGrade(submission) {
    if (!submission) {
      return null;
    }
    if (typeof submission.assignedGrade === 'number') {
      return submission.assignedGrade.toString();
    }
    if (typeof submission.draftGrade === 'number') {
      return `${submission.draftGrade} (draft)`;
    }
    return null;
  }

  /**
   * Converts submission state strings into human-friendly labels.
   *
   * @param {string} state Submission state.
   * @return {string}
   */
  function prettifyState(state) {
    if (!state) {
      return 'Unknown';
    }
    return state
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return {
    buildStudentSummary,
    buildMissingWorkReport,
  };
})();
