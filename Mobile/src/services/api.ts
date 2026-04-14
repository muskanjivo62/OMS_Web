import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';

const DEFAULT_BASE_URL = Platform.select({
  // android: 'http://103.89.45.75:8001/api',
  // ios: 'http://103.89.45.75:8001/api',
  // web: 'http://103.89.45.75:8001/api',
  // default: 'http://103.89.45.75:8001/api',

  android: 'http://10.0.2.2:8000/api',  
  ios: 'http://localhost:8001/api',     
  web: 'http://localhost:8001/api',     
  default: 'http://localhost:8001/api',
}) as string;

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const BASE_URL = ENV_BASE_URL || DEFAULT_BASE_URL;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const SAP_SYNC_REQUEST_TIMEOUT_MS = 0;

const getTimeoutForEndpoint = (endpoint: string): number => {
  if (
    endpoint.startsWith('/sap/sync/') ||
    endpoint.startsWith('/sap/approve-order/') ||
    endpoint.startsWith('/sap/push-quotation/')
  ) {
    return SAP_SYNC_REQUEST_TIMEOUT_MS;
  }
  return DEFAULT_REQUEST_TIMEOUT_MS;
};

const parseResponse = async (response: Response) => {
  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  return { raw, data };
};

const requestWithFallback = async (
  endpoint: string,
  init: RequestInit
): Promise<any> => {
  const url = `${BASE_URL}${endpoint}`;
  const timeoutMs = getTimeoutForEndpoint(endpoint);
  const shouldUseTimeout = timeoutMs > 0;
  try {
    console.log(`${init.method} request to:`, url);
    const controller = shouldUseTimeout ? new AbortController() : null;
    const timeout = shouldUseTimeout
      ? setTimeout(() => controller?.abort(), timeoutMs)
      : null;
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        ...(controller ? { signal: controller.signal } : {}),
      });
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    const { raw, data } = await parseResponse(response);

    if (!response.ok) {
      console.log('API Error:', response.status, data || raw);
      return {
        success: false,
        message: (data && data.message) || `Request failed (${response.status})`,
        status: response.status,
        errors: data?.errors,
        data,
      };
    }

    return data ?? { success: true };
  } catch (error) {
    const isAbortError =
      error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
    const errorMessage = isAbortError
      ? shouldUseTimeout
        ? `Request timed out after ${timeoutMs / 1000}s`
        : 'Request timed out'
      : error instanceof Error
        ? error.message
        : 'Network request failed';
    console.log('Network request failed for URL:', url, errorMessage);

    const isExpoGo = Constants.appOwnership === 'expo';
    const cleartextHint =
      isExpoGo && BASE_URL.startsWith('http://')
        ? ' HTTP URL may be blocked in Expo Go. Use a development build for cleartext HTTP.'
        : '';

    return {
      success: false,
      message: isAbortError
        ? shouldUseTimeout
          ? `Request timed out after ${timeoutMs / 1000}s.${cleartextHint}`
          : `Request timed out.${cleartextHint}`
        : `Network request failed.${cleartextHint}`,
      error: errorMessage,
      baseUrlTried: BASE_URL,
    };
  }
};

export const api = {

  get: async (endpoint: string, token?: string): Promise<any> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!token) {
      try {
        token = (await storage.getAccessToken()) || undefined;
      } catch (error) {
        console.log('Error retrieving token:', error);
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return requestWithFallback(endpoint, {
      method: 'GET',
      headers,
    });

  },


  post: async (endpoint: string, body: object, token?: string): Promise<any> => {

    if (!token) {
      try {
        token = (await storage.getAccessToken()) || undefined;
      } catch (error) {
        console.log('Error retrieving token:', error);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("Headers:", headers);
    console.log(`POST payload for ${endpoint}:`, JSON.stringify(body, null, 2));

    return requestWithFallback(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  },


  put: async (endpoint: string, body: object, token?: string): Promise<any> => {
    if (!token) {
      try {
        token = (await storage.getAccessToken()) || undefined;
      } catch (error) {
        console.log('Error retrieving token:', error);
      }
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return requestWithFallback(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  },

  //   delete: async (endpoint: string, token?: string): Promise<any> => {
  //   const headers: Record<string, string> = {
  //     'Content-Type': 'application/json',
  //   };

  //   if (!token) {
  //     try {
  //       token = await storage.getToken();
  //     } catch (error) {
  //       console.log('Error retrieving token:', error);
  //     }
  //   }

  //   if (token) {
  //     headers['Authorization'] = `Bearer ${token}`;
  //   }

  //   try {
  //     const url = `${BASE_URL}${endpoint}`;
  //     const response = await fetch(url, {
  //       method: 'DELETE',
  //       headers,
  //     });

  //     if (!response.ok) {
  //       return { success: false };
  //     }

  //     return { success: true };
  //   } catch (error) {
  //     console.log('Delete Error:', error);
  //     return { success: false };
  //   }
  // },

};
