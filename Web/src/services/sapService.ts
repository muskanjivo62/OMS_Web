import api from "./api";

export interface Product  {
  id: number;
  item_code: string;
  item_name: string;
  brand?: string;
  category?: string;
  sal_pack_unit?: string;
  variety?: string;
};

export interface Address {
  id: number;
  card_code: string;
  address_name: string;
  address_type: string;
  full_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  gst_number?: string;
}

export interface Party  {
  id: number;
  card_code: string;
  card_name: string;
  category?: string;
  state?: string;
  main_group?: string;
};

export interface Branch {
  id: number;
  bpl_id: number;
  bpl_name: string;
  is_active: boolean;
  updated_at?: string;
}

export interface Log {
  id: number;
  sync_type: string;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  triggered_by: string;
}

export const sapService = {

  getProducts: async () => {
    const response = await api.get("/sap/products/");
    return response.data;
  },

  getAddresses: async () => {
    const response = await api.get("/sap/addresses/");
    return response.data;
  },

  getParties: async () => {
    const response = await api.get("/sap/parties/");
    return response.data;
  },

  getBranches: async () => {
    const response = await api.get("/sap/branches/");
    return response.data;
  },

  getLogs: async () => {
    const response = await api.get("/sap/logs/");
    return response.data;
  },

   syncData: async (endpoint: string) => {

    const response = await api.post(`/sap/sync/${endpoint}/`);

    return response.data;
  }

};