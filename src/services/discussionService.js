import apiClient from "./apiClient";

export const discussionService = {
  async getDiscussions(courseId) {
    const response = await apiClient.get(`/discussions/course/${courseId}`);
    return response.data.map(post => ({
      ...post,
      id: String(post.post_id),
      replies: (post.replies || []).map(r => ({
        ...r,
        id: String(r.reply_id)
      }))
    }));
  },

  async createPost(courseId, { title, content, isAnnouncement = false }) {
    const response = await apiClient.post(`/discussions/course/${courseId}`, {
      title,
      content,
      is_announcement: isAnnouncement
    });
    return {
      ...response.data,
      id: String(response.data.post_id),
      replies: []
    };
  },

  async createReply(postId, { content }) {
    const response = await apiClient.post(`/discussions/posts/${postId}/replies`, {
      content
    });
    return {
      ...response.data,
      id: String(response.data.reply_id)
    };
  }
};
