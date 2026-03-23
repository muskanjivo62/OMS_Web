import api from "./api"

export interface Product {
  category: string;
  brand: string | null;
  variety: string | null;
  item_name: string;
  item_code: string;
  sal_factor2: string | number;
  sal_pack_unit: string | null;
  tax_rate: string | number;
  basic_rate: string | number;
};

export interface PartyProduct {
  item_code: string;
  item_name: string;
  category: string;
  brand: string | null;
  variety: string | null;
  sal_factor2: string | number;
  sal_pack_unit: string | null;
  tax_rate: string | number;
  basic_rate: string | number;
}

export interface RowType {
  category: string;
  brand: string;
  variety: string;
  type: string;
  item: string;
  pcs: string;
  qty: string;
  ltrs: string;
  boxes: string;
  basicPrice: string;
  marketPrice: string;
  tax: string;
  amount: string;
};

export interface OrderItem {
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

  basic_price: number;
  market_price: number;
  tax_rate: number;
  total: number;
}

export interface CreateOrder {
  card_code: string;
  card_name: string;
  bill_to_id: number;
  bill_to_address: string;
  ship_to_id: number;
  ship_to_address: string;
  dispatch_from_id: number;
  dispatch_from_name: string;

  delivery_date: string;
  company: number;
  po_number: string;

  total_amount: number;
  tax_amount: number;
  grand_total: number;

  items: OrderItem[];
}

export interface Order {
  id: number;
  order_number: string;
  card_code: string;
  card_name: string;
  delivery_date: string;
  status_display: string;
  bill_to_address: string;
  ship_to_address: string;
  po_number: string;
  items: OrderItem[];
  created_at: string;
}

export interface OrderStatus {
  id: number;
  name: string;
}


export const ordersService = {

  getPartyName: async () => {
    const response = await api.get("/orders/parties/");
    return response.data;
  },

  getDispatchFrom: async () => {
    const response = await api.get("/orders/dispatches/");
    return response.data;
  },

  getPartyAdd: async (card_code: string) => {
    const response = await api.get(`/orders/party-address/${card_code}/`);
    return response.data;
  },

  getPartyProduct: async (card_code: string) => {
    const response = await api.get(`/orders/party-products/${card_code}/`);
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get("/orders/products/");
    return response.data;
  },

  createOrder: async (formData: CreateOrder) => {
    const payload = {
      ...formData,
      items: formData.items.map((item) => ({
        ...item,
        qty: Number(item.qty),
        pcs: Number(item.pcs),
        boxes: Number(item.boxes),
        ltrs: Number(item.ltrs),
        basic_price: Number(item.basic_price),
        market_price: Number(item.market_price),
        tax_rate: Number(item.tax_rate),
        total: Number(item.total),
      })),
    };
    const response = await api.post("/orders/create/", payload);
    return response.data;
  },

  async getOrders(status?: number) {
    let url = "/orders/list/";
    if (status) {
      url += `?status=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getOrdersStatus: async () => {
    const response = await api.get("/orders/status/");
    return response.data;
  },

  UpdateStatus: async (orderId: number, status: number, reason?: string) => {
    const response = await api.post(`/orders/${orderId}/update-status/`, {
      status,
      ...(reason ? { reason } : {}),
    });
    return response.data;
  },

};
