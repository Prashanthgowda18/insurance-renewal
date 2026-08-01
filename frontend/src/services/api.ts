import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fallback Mock Data for demo mode (when Express API backend is not reachable)
const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Vishnu Kumar', mobile: '9876543210', altMobile: '9876543211', email: 'vishnu@example.com', address: 'Indiranagar, Bangalore', notes: 'VIP Customer', preferredNotificationChannel: 'whatsapp', preferredLanguage: 'en', customerStatus: 'active', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Yashwanth R', mobile: '9123456789', altMobile: '9123456780', email: 'yashwanth@example.com', address: 'JP Nagar, Mysore', notes: 'Prefers Morning Reminders', preferredNotificationChannel: 'whatsapp', preferredLanguage: 'en', customerStatus: 'active', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Ananya Sharma', mobile: '9988776655', altMobile: '', email: 'ananya@example.com', address: 'Koramangala, Bangalore', notes: '', preferredNotificationChannel: 'email', preferredLanguage: 'en', customerStatus: 'active', createdAt: new Date().toISOString() },
];

const MOCK_POLICIES = [
  { id: 'p1', vehicleId: 'v1', insuranceCompany: 'HDFC ERGO', policyNumber: 'POL-HDFC-9921', insuranceType: 'comprehensive', startDate: '2025-08-15', expiryDate: '2026-08-15', status: 'active', renewalStatus: 'pending', renewalAmount: 4850, vehicle: { id: 'v1', vehicleNumber: 'KA-01-MJ-2024', vehicleType: 'four_wheeler', make: 'Hyundai', model: 'Creta', customer: MOCK_CUSTOMERS[0] } },
  { id: 'p2', vehicleId: 'v2', insuranceCompany: 'ICICI Lombard', policyNumber: 'POL-ICICI-4412', insuranceType: 'third_party', startDate: '2025-07-01', expiryDate: '2026-08-10', status: 'active', renewalStatus: 'reminder_sent', renewalAmount: 2100, vehicle: { id: 'v2', vehicleNumber: 'KA-05-EV-8899', vehicleType: 'two_wheeler', make: 'Ather', model: '450X', customer: MOCK_CUSTOMERS[1] } },
  { id: 'p3', vehicleId: 'v3', insuranceCompany: 'Bajaj Allianz', policyNumber: 'POL-BAJAJ-7731', insuranceType: 'comprehensive', startDate: '2024-08-01', expiryDate: '2025-08-01', status: 'expired', renewalStatus: 'expired', renewalAmount: 8500, vehicle: { id: 'v3', vehicleNumber: 'KA-53-MC-1100', vehicleType: 'four_wheeler', make: 'Tata', model: 'Nexon', customer: MOCK_CUSTOMERS[2] } }
];

const MOCK_VEHICLES = MOCK_POLICIES.map(p => p.vehicle);

// Intercept unauthorized responses & handle offline network fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Network Error (No backend server connected or offline)
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
    if (isNetworkError && error.config) {
      const url = error.config.url || '';
      const method = (error.config.method || 'get').toLowerCase();

      // Return mock data for GET endpoints in demo mode
      if (method === 'get') {
        if (url.includes('/customers')) {
          if (url.match(/\/customers\/[a-zA-Z0-9-]+/)) {
            const customer = MOCK_CUSTOMERS[0];
            return Promise.resolve({ data: { ...customer, vehicles: [MOCK_VEHICLES[0]] } });
          }
          return Promise.resolve({ data: { customers: MOCK_CUSTOMERS, pagination: { total: MOCK_CUSTOMERS.length, page: 1, totalPages: 1 } } });
        }
        if (url.includes('/policies')) {
          return Promise.resolve({ data: { policies: MOCK_POLICIES, pagination: { total: MOCK_POLICIES.length, page: 1, totalPages: 1 } } });
        }
        if (url.includes('/vehicles')) {
          return Promise.resolve({ data: { vehicles: MOCK_VEHICLES, pagination: { total: MOCK_VEHICLES.length, page: 1, totalPages: 1 } } });
        }
        if (url.includes('/logs')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/settings')) {
          return Promise.resolve({ data: { whatsappApiKey: '', reminderDays: '30,15,7,3,1' } });
        }
      }

      // Return mock success for POST/PUT/DELETE mutations
      if (['post', 'put', 'delete', 'patch'].includes(method)) {
        if (url.includes('/auth/login') || url.includes('/auth/register')) {
          return Promise.resolve({
            data: {
              token: 'demo-jwt-token-vaibhav-insurance',
              admin: { id: 'demo-admin-1', name: 'Admin User', email: 'admin@vaibhavinsurance.com', role: 'admin' }
            }
          });
        }
        return Promise.resolve({ data: { success: true, message: 'Action completed in demo mode' } });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
