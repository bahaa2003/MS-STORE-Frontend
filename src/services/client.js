import mockApi from './mockApi';
import realApi from './realApi';

const provider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();

const apiClient = provider === 'real' ? realApi : mockApi;

export default apiClient;
