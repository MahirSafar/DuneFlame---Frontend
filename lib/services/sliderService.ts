import instance from '../axios';

const SLIDER_API_PATH = '/admin/sliders';

export const sliderService = {
  getAll: () => instance.get(SLIDER_API_PATH).then(res => res.data),

  create: (formData: FormData) =>
    instance.post(SLIDER_API_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    instance.put(`${SLIDER_API_PATH}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) => instance.delete(`${SLIDER_API_PATH}/${id}`),
};
