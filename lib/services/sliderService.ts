import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config';

const SLIDER_API_URL = `${BASE_API_URL}/admin/sliders`;

const getAuthHeader = () => {
  const dfTokens = localStorage.getItem("df_tokens");
  const dfAuth = localStorage.getItem("df_auth");
  
  let token = null;

  if (dfTokens) {
    try {
      const parsed = JSON.parse(dfTokens);
      token = parsed.accessToken || parsed.token;
    } catch (e) { token = dfTokens; }
  }

  // Əgər df_tokens-də yoxdursa, df_auth-ın içindəki 'state' obyektinə bax
  if (!token && dfAuth) {
    try {
      const parsed = JSON.parse(dfAuth);
      token = parsed.state?.accessToken || parsed.state?.user?.token;
    } catch (e) { }
  }

  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const sliderService = {
  getAll: () => axios.get(SLIDER_API_URL, { headers: getAuthHeader() }).then(res => res.data),
  
  create: (formData: FormData) => {
    return axios.post(SLIDER_API_URL, formData, {
      headers: { 
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data' 
      }
    });
  },
  
  update: (id: string, formData: FormData) => {
    return axios.put(`${SLIDER_API_URL}/${id}`, formData, {
      headers: { 
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data' 
      }
    });
  },

  delete: (id: string) => axios.delete(`${SLIDER_API_URL}/${id}`, {
    headers: getAuthHeader()
  }),
};
