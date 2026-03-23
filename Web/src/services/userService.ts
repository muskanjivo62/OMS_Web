import api from "./api";

/* ================= TYPES ================= */

export interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
  is_active: boolean;
}

export interface Option {
  id: number;
  name: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: number;
  company?: number | null;
  mainGroup?: number;
  state?: number;
}

/* ================= SERVICE ================= */

export const userService = {

  getUsers: async () => {
    const response = await api.get("/auth/users/list/");
    return response.data;
  },

  getMainGroup: async () => {
    const response = await api.get("/auth/mainGroup/");
    return response.data;
  },

  getState: async () => {
    const response = await api.get("/auth/states/");
    return response.data;
  },

  getRole: async () => {
    const response = await api.get("/auth/roles/");
    return response.data;
  },

  getCompany: async () => {
    const response = await api.get("/auth/companies/");
    return response.data;
  },

  createUser: async (data: CreateUserData) => {

    const payload = {
      name: data.name,
      username: data.username,
      password: data.password,
      email: data.email,
      phone: data.phone,
      role: data.role,
      company: data.company,
      main_group: data.mainGroup,
      state: data.state
    };

    const response = await api.post("/auth/users/create/", payload);

    return response.data;
  }
};