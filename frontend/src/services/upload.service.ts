import axios from "axios";

const API = "http://localhost:3000";

export const uploadService = {
  async uploadImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("imagen", file);

    const { data } = await axios.post(
      `${API}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },
};