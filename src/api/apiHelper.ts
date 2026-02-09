import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// Custom error interface for consistent error handling
export interface CustomError {
  message: string;
  code?: string;
  status?: number;
}

// Get base URL from environment or use default
const getBaseURL = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

// Create axios instance
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  responseType: 'json',
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(getCustomError(error));
  }
);

/**
 * Extract custom error from axios error
 */
export const getCustomError = (err: any): CustomError => {
  const error: CustomError = {
    message: 'An unknown error occurred',
  };

  if (err?.response?.data) {
    const data = err.response.data;
    if (data.error && data.message) {
      error.code = data.error;
      error.message = data.message;
    } else if (data.message) {
      error.message = data.message;
    }
  } else if (err?.message) {
    error.message = err.message;
  }

  error.status = err?.response?.status;

  return error;
};

/**
 * GET request
 */
export const get = async <T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.get<T>(url, {
    ...config,
    params,
  });
  return response.data;
};

/**
 * POST request
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT request
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * DELETE request
 */
export const deleteResource = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

export const deletePatch = deleteResource;
export const deleteApi = deleteResource;

export default apiClient;
