import axios from '../utils/axios';

export const getRecords = async (type, page = 0, size = 200) => {
  const params = { page, size };
  if (type) params.type = type;
  const { data } = await axios.get('/api/records', { params });
  return data;
};

export const createRecord = async (payload) => {
  const { data } = await axios.post('/api/records', payload);
  return data;
};

export const deleteRecord = async (id) => {
  const { data } = await axios.delete(`/api/records/${id}`);
  return data;
};

export const updateRecord = async (id, payload) => {
  const { data } = await axios.put(`/api/records/${id}`, payload);
  return data;
};
