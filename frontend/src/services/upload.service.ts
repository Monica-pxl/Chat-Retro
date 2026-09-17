import api from './api';

export const uploadService = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("imagen", file);

    const { data } = await api.post(`/upload`, formData);

    return data;
  },
};