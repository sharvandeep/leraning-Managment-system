import apiClient from "./apiClient";

export const attendanceService = {
  async submitAttendance({ courseId, date, records }) {
    const response = await apiClient.post("/attendance", {
      course_id: Number(courseId),
      date: date, // YYYY-MM-DD string
      records: records.map(r => ({
        student_id: Number(r.studentId),
        status: r.status // 'Present' or 'Absent'
      }))
    });
    return response.data;
  },

  async getCourseAttendance(courseId) {
    const response = await apiClient.get(`/attendance/course/${courseId}`);
    return response.data;
  }
};
