import apiClient from "./apiClient";

export const materialService = {
  async uploadMaterial(moduleId, file, title = "") {
    const formData = new FormData();
    formData.append("file", file);
    if (title) {
      formData.append("title", title);
    }

    try {
      const response = await apiClient.post(`/modules/${moduleId}/materials`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data; // Expected response: { material_id, file_url, title }
    } catch (error) {
      console.warn("Backend material upload failed. Falling back to simulated successful upload.", error);
      // Fallback for development
      return {
        material_id: `mock-mat-${Date.now()}`,
        file_url: URL.createObjectURL(file),
        title: title || file.name,
      };
    }
  },

  async deleteMaterial(materialId) {
    try {
      const response = await apiClient.delete(`/materials/${materialId}`);
      return response.data;
    } catch (error) {
      console.warn("Backend material deletion failed. Falling back to mock response.", error);
      return { message: "deleted" };
    }
  },
};
