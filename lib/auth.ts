import axios, { AxiosRequestConfig } from 'axios';


export interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
}

export interface EmailLoginPayload {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  token: string;
}


export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};


export const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};


export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};


const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


const aiApiClient = axios.create({
  baseURL: 'https://ai-greenmind.khoav4.com',
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


aiApiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


aiApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authenticatedRequest = async (config: AxiosRequestConfig) => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
};


export const authenticatedAiRequest = async (config: AxiosRequestConfig) => {
  try {
    const response = await aiApiClient(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
};


export const apiGet = async (url: string, config?: AxiosRequestConfig) => {
  return authenticatedRequest({ method: 'GET', url, ...config });
};

export const apiPost = async (url: string, data?: any, config?: AxiosRequestConfig) => {
  return authenticatedRequest({ method: 'POST', url, data, ...config });
};

export const apiPut = async (url: string, data?: any, config?: AxiosRequestConfig) => {
  return authenticatedRequest({ method: 'PUT', url, data, ...config });
};

export const apiDelete = async (url: string, config?: AxiosRequestConfig) => {
  return authenticatedRequest({ method: 'DELETE', url, ...config });
};

export const apiPatch = async (url: string, data?: any, config?: AxiosRequestConfig) => {
  return authenticatedRequest({ method: 'PATCH', url, data, ...config });
};


export const aiApiGet = async (url: string, config?: AxiosRequestConfig) => {
  return authenticatedAiRequest({ method: 'GET', url, ...config });
};

export const aiApiPost = async (url: string, data?: any, config?: AxiosRequestConfig) => {
  return authenticatedAiRequest({ method: 'POST', url, data, ...config });
};


export const loginWithEmail = async (payload: EmailLoginPayload): Promise<LoginResponse> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await axios.post(`${baseUrl}/auth/login/email`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
};


export const loginWithGoogle = async (payload: GoogleLoginPayload): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
    throw new Error('Google login failed');
  }
};


export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};


export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
};

export const getAllModels = async (filters?: any) => {
  try {
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: '/models/getAll',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    };

    if (filters) {
      config.params = filters;
    }


    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('Error in getAllModels:', error);
    throw error;
  }
};

export const getModelById = async (id: string) => {
  return apiGet(`/models/${id}`);
};

export const createModel = async (modelData: any) => {
  return apiPost('/models/create', modelData);
};

export const updateModel = async (id: string, modelData: any) => {
  return apiPut(`/models/${id}`, modelData);
};

export const deleteModel = async (id: string) => {
  return apiDelete(`/models/${id}`);
};


export const getAllQuestions = async (filters?: any) => {
  try {
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: '/questions',
      headers: headers,
    };

    if (filters) {
      config.params = filters;
    }


    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('❌ Error in getAllQuestions:', error);
    throw error;
  }
};

export const getQuestionById = async (id: string) => {
  return apiGet(`/questions/${id}`);
};

export const createQuestion = async (questionData: any) => {
  return apiPost('/questions/create', questionData);
};


export const createQuestions = async (questionsData: any) => {
  try {
    const token = getAccessToken();


    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/questions/createQuestions',
      headers: headers,
      data: questionsData,
    };


    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('Error in createQuestions:', error);
    throw error;
  }
};

export const updateQuestion = async (id: string, questionData: any) => {
  return apiPut(`/questions/${id}`, questionData);
};

export const deleteQuestion = async (id: string) => {
  return apiDelete(`/questions/${id}`);
};


export const createTemplates = async (templatesData: any) => {
  try {
    const token = getAccessToken();


    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/templates/createTemplates',
      headers: headers,
      data: templatesData,
    };


    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('❌ Error in createTemplates:', error);
    throw error;
  }
};

export const getAllTemplates = async (filters?: any) => {
  return apiGet('/templates', filters ? { params: filters } : {});
};

export const getTemplateById = async (id: string) => {
  return apiGet(`/templates/${id}`);
};

export const updateTemplate = async (id: string, templateData: any) => {
  return apiPut(`/templates/${id}`, templateData);
};

export const deleteTemplate = async (id: string) => {
  return apiDelete(`/templates/${id}`);
};


export const generateKeywords = async (keywordData: any) => {
  return aiApiPost('/gen_keyword_ver2', keywordData);
};

export const generateTemplate = async (templateData: any) => {
  return aiApiPost('/gen_template', templateData);
};

export const combineQuestion = async (questionData: any) => {
  return aiApiPost('/combine_question', questionData);
};


export const getUsers = async () => {
  return apiGet('/auth/get-alls');
}

export { apiClient, aiApiClient };
