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

// Fallback Mock Data for live static demo mode (when Express API backend is offline)
const MOCK_CUSTOMERS = [
  {
    id: 'c1',
    name: 'Vishnu Kumar',
    mobile: '9876543210',
    altMobile: '9876543211',
    email: 'vishnu@example.com',
    address: 'Indiranagar, Bangalore',
    notes: 'VIP Customer',
    preferredNotificationChannel: 'whatsapp',
    preferredLanguage: 'en',
    customerStatus: 'active',
    vehicleCount: 2,
    activePolicies: 2,
    worstRenewalStatus: 'pending',
    primaryVehicleNumber: 'KA-01-MJ-2024',
    primaryInsuranceCompany: 'HDFC ERGO',
    primaryPolicyExpiry: '2026-08-15',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Yashwanth R',
    mobile: '9123456789',
    altMobile: '9123456780',
    email: 'yashwanth@example.com',
    address: 'JP Nagar, Mysore',
    notes: 'Prefers Morning Reminders',
    preferredNotificationChannel: 'whatsapp',
    preferredLanguage: 'en',
    customerStatus: 'active',
    vehicleCount: 1,
    activePolicies: 1,
    worstRenewalStatus: 'reminder_sent',
    primaryVehicleNumber: 'KA-05-EV-8899',
    primaryInsuranceCompany: 'ICICI Lombard',
    primaryPolicyExpiry: '2026-08-10',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'Ananya Sharma',
    mobile: '9988776655',
    altMobile: '',
    email: 'ananya@example.com',
    address: 'Koramangala, Bangalore',
    notes: '',
    preferredNotificationChannel: 'email',
    preferredLanguage: 'en',
    customerStatus: 'active',
    vehicleCount: 1,
    activePolicies: 0,
    worstRenewalStatus: 'expired',
    primaryVehicleNumber: 'KA-53-MC-1100',
    primaryInsuranceCompany: 'Bajaj Allianz',
    primaryPolicyExpiry: '2025-08-01',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_POLICIES = [
  {
    id: 'p1',
    vehicleId: 'v1',
    customerId: 'c1',
    customerName: 'Vishnu Kumar',
    customerMobile: '9876543210',
    vehicleNumber: 'KA-01-MJ-2024',
    vehicleType: 'four_wheeler',
    insuranceCompany: 'HDFC ERGO',
    policyNumber: 'POL-HDFC-9921',
    insuranceType: 'comprehensive',
    startDate: '2025-08-15',
    expiryDate: '2026-08-15',
    daysRemaining: 14,
    status: 'active',
    renewalStatus: 'pending',
    renewalAmount: 4850,
    vehicle: {
      id: 'v1',
      vehicleNumber: 'KA-01-MJ-2024',
      vehicleType: 'four_wheeler',
      make: 'Hyundai',
      model: 'Creta',
      customer: MOCK_CUSTOMERS[0],
    },
  },
  {
    id: 'p2',
    vehicleId: 'v2',
    customerId: 'c2',
    customerName: 'Yashwanth R',
    customerMobile: '9123456789',
    vehicleNumber: 'KA-05-EV-8899',
    vehicleType: 'two_wheeler',
    insuranceCompany: 'ICICI Lombard',
    policyNumber: 'POL-ICICI-4412',
    insuranceType: 'third_party',
    startDate: '2025-07-01',
    expiryDate: '2026-08-10',
    daysRemaining: 9,
    status: 'active',
    renewalStatus: 'reminder_sent',
    renewalAmount: 2100,
    vehicle: {
      id: 'v2',
      vehicleNumber: 'KA-05-EV-8899',
      vehicleType: 'two_wheeler',
      make: 'Ather',
      model: '450X',
      customer: MOCK_CUSTOMERS[1],
    },
  },
  {
    id: 'p3',
    vehicleId: 'v3',
    customerId: 'c3',
    customerName: 'Ananya Sharma',
    customerMobile: '9988776655',
    vehicleNumber: 'KA-53-MC-1100',
    vehicleType: 'four_wheeler',
    insuranceCompany: 'Bajaj Allianz',
    policyNumber: 'POL-BAJAJ-7731',
    insuranceType: 'comprehensive',
    startDate: '2024-08-01',
    expiryDate: '2025-08-01',
    daysRemaining: -365,
    status: 'expired',
    renewalStatus: 'expired',
    renewalAmount: 8500,
    vehicle: {
      id: 'v3',
      vehicleNumber: 'KA-53-MC-1100',
      vehicleType: 'four_wheeler',
      make: 'Tata',
      model: 'Nexon',
      customer: MOCK_CUSTOMERS[2],
    },
  },
];

const MOCK_VEHICLES = [
  {
    id: 'v1',
    customerId: 'c1',
    customerName: 'Vishnu Kumar',
    customerMobile: '9876543210',
    vehicleNumber: 'KA-01-MJ-2024',
    vehicleType: 'four_wheeler',
    make: 'Hyundai',
    model: 'Creta',
    manufacturingYear: 2022,
    fuelType: 'petrol',
    policies: [MOCK_POLICIES[0]],
    customer: MOCK_CUSTOMERS[0],
  },
  {
    id: 'v2',
    customerId: 'c2',
    customerName: 'Yashwanth R',
    customerMobile: '9123456789',
    vehicleNumber: 'KA-05-EV-8899',
    vehicleType: 'two_wheeler',
    make: 'Ather',
    model: '450X',
    manufacturingYear: 2023,
    fuelType: 'electric',
    policies: [MOCK_POLICIES[1]],
    customer: MOCK_CUSTOMERS[1],
  },
  {
    id: 'v3',
    customerId: 'c3',
    customerName: 'Ananya Sharma',
    customerMobile: '9988776655',
    vehicleNumber: 'KA-53-MC-1100',
    vehicleType: 'four_wheeler',
    make: 'Tata',
    model: 'Nexon',
    manufacturingYear: 2021,
    fuelType: 'diesel',
    policies: [MOCK_POLICIES[2]],
    customer: MOCK_CUSTOMERS[2],
  },
];

const MOCK_LOGS = [
  { id: 'l1', action: 'create', module: 'customers', description: 'Created customer Vishnu Kumar', createdAt: new Date().toISOString() },
  { id: 'l2', action: 'policy_added', module: 'policies', description: 'Added policy POL-HDFC-9921 for KA-01-MJ-2024', createdAt: new Date().toISOString() },
  { id: 'l3', action: 'reminder_sent', module: 'reminders', description: 'Sent WhatsApp reminder to Yashwanth R', createdAt: new Date().toISOString() },
];

const MOCK_TIMELINE = [
  { id: 't1', type: 'customer_created', title: 'Customer Profile Created', description: 'Customer record initialized in system.', timestamp: new Date().toISOString() },
  { id: 't2', type: 'policy_added', title: 'Policy Enrolled', description: 'HDFC ERGO policy POL-HDFC-9921 attached.', timestamp: new Date().toISOString() },
];

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

      // Return direct mock arrays/objects for GET endpoints
      if (method === 'get') {
        if (url.includes('/customers')) {
          if (url.includes('/timeline')) {
            return Promise.resolve({ data: MOCK_TIMELINE });
          }
          if (url.match(/\/customers\/[a-zA-Z0-9-]+/)) {
            const customer = MOCK_CUSTOMERS[0];
            return Promise.resolve({ data: { ...customer, vehicles: [MOCK_VEHICLES[0]] } });
          }
          return Promise.resolve({ data: MOCK_CUSTOMERS });
        }
        if (url.includes('/policies')) {
          return Promise.resolve({ data: MOCK_POLICIES });
        }
        if (url.includes('/vehicles')) {
          return Promise.resolve({ data: MOCK_VEHICLES });
        }
        if (url.includes('/logs')) {
          return Promise.resolve({ data: MOCK_LOGS });
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
