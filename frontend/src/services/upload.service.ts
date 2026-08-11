import api from './api';

export const uploadService = {
  async uploadImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("imagen", file);

    const { data } = await api.post(
      `/upload`,
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