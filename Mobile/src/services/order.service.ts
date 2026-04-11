import { storage } from '../utils/storage';
import {api} from './api';

export interface Party {
  value: string;
  label: string;
}

export interface DispatchLocation {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
}

export interface PartyAddress {
  id: number;
  address_id: string | null;
  address_name: string | null;
  gst_number: string | null;
}

export interface AddressResponse {
  bill_to: PartyAddress[];
  ship_to: PartyAddress[];
  is_fallback: boolean;
}

export const orderService = {
  getParties: async (): Promise<Party[]> => {
    return await api.get('/orders/parties/');
  },
  
  getAddresses: async (cardCode: string): Promise<AddressResponse> => {
    return await api.get(`/orders/addresses/?card_code=${cardCode}`);
  },
    
  createOrder: async (payload: CreateOrderPayload) => {
    const token = await storage.getAccessToken();
    return await api.post('/orders/create/', payload, token || undefined);
  },

  updateOrder: async (orderId: number, payload: CreateOrderPayload) => {
    const token = await storage.getAccessToken();
    return await api.post('/orders/create/', { ...payload, order_id: orderId }, token || undefined);
  },

  getPartyProducts: async (cardCode: string) => {
    return await api.get(`/orders/party-products/${cardCode}`);
  },

  getorderstatus: async (cardCode: string) => {
    return await api.get(`/orders/party-products/${cardCode}`);
  },

  getbranch: async (company: string) => {
    return await api.get(`/orders/branch/`);
  },

  getOrderLogs: async(orderId:number):Promise<any>=>{
    return await api.get(`/orders/${orderId}/orderlogs/`);
  },

  getorderdetailsbyid: async(orderId:number):Promise<any>=>{
    return await api.get(`/orders/orderdetailsbyid/${orderId}`);
  },
  
  getOrderbyuserid: async (): Promise<any> => {
  const userdata = await storage.getUser();

  if (!userdata?.id) {
    console.log("Invalid user data:", userdata);
    return null;
  }

  console.log("User data retrieved in service:", userdata.id);
  return await api.get(`/orders/ordersbyuser/${userdata.id}/`);
  // return await api.get(`/orders/list/?user_id=${userdata.id}`);
},
  
};

export const dispatchService = {
  getDispatch: async (): Promise<DispatchLocation[]> => {
    return await api.get('/orders/dispatches/');
  },
};

export const schemeService = {
  getSchemes: async (stateId?: number | null): Promise<{ scheme_id: number; scheme_name: string }[]> => {
    const endpoint = stateId ? `/orders/schemes/?state_id=${stateId}` : '/orders/schemes/';
    const res = await api.get(endpoint);

    if (Array.isArray(res) && res.length) {
      return res;
    }

    if (stateId) {
      const fallbackRes = await api.get('/orders/schemes/');
      return Array.isArray(fallbackRes) ? fallbackRes : [];
    }

    return Array.isArray(res) ? res : [];
  },
  getSchemeProductsByName: async (schemeName: string, stateId: number): Promise<{ scheme_name: string; sal_factor2: number; sal_pack_unit: string }[]> => {
    const res = await api.get(`/orders/scheme-products/?scheme_name=${encodeURIComponent(schemeName)}&state_id=${stateId}`);
    return res?.data || [];
  },
  // Fetches ALL combo items for a scheme_id by first resolving the scheme_name
  getComboBySchemeId: async (schemeId: string, stateId: number): Promise<{ scheme_name: string; sal_factor2: number; sal_pack_unit: string }[]> => {
    const res1 = await api.get(`/orders/scheme-products/?scheme_id=${schemeId}&state_id=${stateId}`);
    const seed: { scheme_name?: string } = res1?.data?.[0] ?? {};
    if (!seed.scheme_name) return [];
    const res2 = await api.get(`/orders/scheme-products/?scheme_name=${encodeURIComponent(seed.scheme_name)}&state_id=${stateId}`);
    return res2?.data || [];
  },
  getComboByItemCode: async (itemCode: string, stateId: number): Promise<{ scheme_name: string; sal_factor2: number; sal_pack_unit: string }[]> => {
    // Step 1: find which combo scheme this item belongs to
    const res1 = await api.get(`/orders/scheme-products/?item_code=${encodeURIComponent(itemCode)}&state_id=${stateId}`);
    const records: { scheme_name: string }[] = res1?.data || [];
    if (!records.length) return [];
    const schemeName = records[0].scheme_name;
    // Step 2: fetch ALL items in that combo by scheme_name
    const res2 = await api.get(`/orders/scheme-products/?scheme_name=${encodeURIComponent(schemeName)}&state_id=${stateId}`);
    return res2?.data || [];
  },
};

export interface ProductFilters {
  categories: { label: string; value: string }[];
  brands: { label: string; value: string }[];
  varieties: { label: string; value: string }[];
  types: { label: string; value: string }[];  // ADD THIS
}

export interface Product {
  id: number;
  item_code: string;
  item_name: string;
  category: string | null;
  brand: string | null;
  variety: string | null;
  sal_factor2: number | null;
  tax_rate: number | null;
  sal_pack_unit: string | null;
}

export interface CreateOrderPayload {
  user_id: number;
  card_code: string;
  card_name: string;
  bill_to_id: number;
  bill_to_address: string;
  ship_to_id: number;
  ship_to_address: string;
  dispatch_from_id: number;
  dispatch_from_name: string;
  company: string;
  po_number: string;
  delivery_date:string;
  remarks:string;
  items: {
    item_code: string;
    item_name: string;
    category: string;
    brand: string;
    variety: string;
    item_type: string;
    qty: number;
    scheme_id?: number | null;
    scheme_name?: string | null;
    is_scheme_visible?: boolean;
    scheme_qty?: number;
    pcs: number;
    boxes: number;
    ltrs: number;
    market_price: number;
    total: number;
    tax_rate: number;
  }[];
}

export interface ApproveOr {
  order_id: number;
  card_code: string;
  created_at: string;
  bill_to_address: string;
  ship_to_address: string;
  dispatch_from_id: number;
  po_number: string;
  items: {
    id?: number | string;
    item_code: string;
    item_name: string;
    qty?: string | number;
    pcs?: string | number;
    boxes?: string | number;
    ltrs?: string | number;
    basic_price?: string | number;
    market_price?: string | number;
    total?: string | number;
    tax_rate?: string | number;
    scheme_id?: number | string | null;
    scheme_name?: string | null;
    scheme_item_code?: string | null;
    qty_scheme?: string | number;
    is_scheme_visible?: boolean;
    is_scheme_line?: boolean;
    parent_item_code?: string;
    category?: string;
    brand?: string;
    variety?: string;
    item_type?: string;
    order?: number;
    scheme?: number | string | null;
  }[];
}

export interface UpdateStatusPayload {
  card_code: string;
  bill_to_address: string;
  ship_to_address: string;
  dispatch_from_id: number;
  po_number: string;
  delivery_date:string;
  items: {
    item_code: string;
    item_name: string;
    category: string;
    brand: string;
    variety: string;
    item_type: string;
    qty: number;
    pcs: number;
    boxes: number;
    ltrs: number; 
    market_price: number;
    total: number;
    tax_rate: number;
  }[];
}

export interface Approve {
  card_code: string;
  card_name: string;
  bill_to_id: number;
  bill_to_address: string;
  ship_to_id: number;
  ship_to_address: string;
  dispatch_from_id: number;
  dispatch_from_name: string;
  company: string;
  po_number: string;
  delivery_date:string;
  items: {
    item_code: string;
    item_name: string;
    category: string;
    brand: string;
    variety: string;
    item_type: string;
    qty: number;
    pcs: number;
    boxes: number;
    ltrs: number;
    market_price: number;
    total: number;
    tax_rate: number;
  }[];
}
  
export interface OrderItemList{
  id:number;
  order_number :string;
  card_code :string;
  card_name:string;
  total_amount :string;
  status:string | number;
  status_name?: string;
  status_display?: string;
  items_count :number;
  created_by :number;
  created_at:string;
  delivery_date?: string;
  po_number:string;
  categories?: string[];
  bill_to_address:string;
  ship_to_address:string;
  dispatch_from_id:number;
  items: {
    item_code: string;
    item_name: string;    
    basic_price: number;
  }
}
  
export const productService = {

  getFilters: async (category?: string, brand?: string, variety?: string): Promise<ProductFilters> => {
    let url = '/orders/product-filters/?';
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (brand) url += `brand=${encodeURIComponent(brand)}&`;
    if (variety) url += `variety=${encodeURIComponent(variety)}&`;
    return await api.get(url);
  },
  
  getProducts: async (category?: string, brand?: string, variety?: string, type?: string): Promise<Product[]> => {
    let url = '/orders/products/?';
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (brand) url += `brand=${encodeURIComponent(brand)}&`;
    if (variety) url += `variety=${encodeURIComponent(variety)}&`;
    if (type) url += `type=${encodeURIComponent(type)}&`;
    return await api.get(url);
  },

  getOrders:async(userId:number,statusFilter?:string):Promise<OrderItemList[]>=>{
    console.log('userId,status'+userId+statusFilter);
    let url = '/orders/list/?';
    if (userId)
      url+=`user_id=${userId}&`;
    if (statusFilter)
      url+=`status=${statusFilter}&`;
    return await api.get(url);

  },

  updatestatus:async(orderId:number,status:string,reason:string):Promise<OrderItemList[]>=>{
    return await api.post(`/orders/${orderId}/update-status/`,{
      status,
      reason
    });
  },

  approveOrder:async(orderId:number):Promise<OrderItemList[]>=>{
    return await api.post(`/orders/${orderId}/approve/`,{});
  },

  rejectOrder:async(orderId:number,reason:string):Promise<OrderItemList[]>=>{
    return await api.post(`/orders/${orderId}/reject/`,{reason});
  },

  sapApproveOrder:async(order:ApproveOr):Promise<any>=>{
    return await api.post(`/sap/approve-order/`, order);
  },
    
};
