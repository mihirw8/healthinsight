import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login page if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const getCurrentUser = () => {
  return api.get('/users/me');
};

// Health report services
export const uploadHealthReport = (formData) => {
  return api.post('/reports/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getUserReports = (userId) => {
  return api.get(`/users/${userId}/reports`);
};

export const getReportById = (reportId) => {
  return api.get(`/reports/${reportId}`);
};

export const getLatestReport = (userId) => {
  return api.get(`/users/${userId}/reports/latest`);
};

// Biomarker services
export const getUserBiomarkerHistory = (userId) => {
  return api.get(`/users/${userId}/biomarkers/history`);
};

export const getBiomarkerDetails = (biomarkerId) => {
  return api.get(`/biomarkers/${biomarkerId}`);
};

export const getBiomarkersByCategory = (category) => {
  return api.get(`/biomarkers/category/${category}`);
};

// Recommendation services
export const getUserRecommendations = (userId, reportId) => {
  return api.get(`/users/${userId}/recommendations`, {
    params: { reportId }
  });
};

export const markRecommendationAsRead = (recommendationId) => {
  return api.put(`/recommendations/${recommendationId}/read`);
};

export const saveRecommendationToActionPlan = (recommendationId) => {
  return api.post(`/recommendations/${recommendationId}/save`);
};

// Risk assessment services
export const getUserRiskAssessment = (userId, reportId) => {
  return api.get(`/users/${userId}/risks`, {
    params: { reportId }
  });
};

export const getRiskDetails = (riskId) => {
  return api.get(`/risks/${riskId}`);
};

// Correlation and trend analysis
export const getCorrelationAnalysis = (userId, params) => {
  return api.get(`/users/${userId}/correlations`, { params });
};

export const getTrendAnalysis = (userId, biomarkerId, timeRange) => {
  return api.get(`/users/${userId}/trends/${biomarkerId}`, {
    params: { timeRange }
  });
};

// Predictive insights
export const getPredictiveInsights = (userId) => {
  return api.get(`/users/${userId}/predictions`);
};

// User profile and settings
export const updateUserProfile = (userId, profileData) => {
  return api.put(`/users/${userId}/profile`, profileData);
};

export const updateUserSettings = (userId, settings) => {
  return api.put(`/users/${userId}/settings`, settings);
};

// Mock data for development
export const getMockData = (endpoint) => {
  // This function can be used during development before the backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock data for different endpoints
      const mockData = {
        user: {
          id: 'user123',
          name: 'John Doe',
          firstName: 'John',
          email: 'john.doe@example.com',
          profileImage: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        latestReport: {
          id: 'report123',
          date: '2023-06-15',
          type: 'comprehensive',
          provider: 'LabCorp',
          biomarkerValues: [
            {
              biomarker: { id: 'b1', name: 'Glucose', unit: 'mg/dL' },
              value: 95,
              referenceMin: 70,
              referenceMax: 99,
              status: 'normal'
            },
            {
              biomarker: { id: 'b2', name: 'Total Cholesterol', unit: 'mg/dL' },
              value: 210,
              referenceMin: 125,
              referenceMax: 200,
              status: 'high'
            },
            {
              biomarker: { id: 'b3', name: 'HDL Cholesterol', unit: 'mg/dL' },
              value: 45,
              referenceMin: 40,
              referenceMax: 60,
              status: 'normal'
            }
          ],
          insights: {
            summary: 'Your overall health is good with some areas to monitor. Your cholesterol is slightly elevated, but other biomarkers are within normal ranges.',
            trend: 'improving'
          }
        },
        biomarkerHistory: {
          data: [
            {
              date: '2023-01-15',
              biomarkerValues: [
                {
                  biomarker: { name: 'Glucose', unit: 'mg/dL' },
                  value: 100,
                  referenceMin: 70,
                  referenceMax: 99
                },
                {
                  biomarker: { name: 'Total Cholesterol', unit: 'mg/dL' },
                  value: 220,
                  referenceMin: 125,
                  referenceMax: 200
                }
              ]
            },
            {
              date: '2023-03-20',
              biomarkerValues: [
                {
                  biomarker: { name: 'Glucose', unit: 'mg/dL' },
                  value: 98,
                  referenceMin: 70,
                  referenceMax: 99
                },
                {
                  biomarker: { name: 'Total Cholesterol', unit: 'mg/dL' },
                  value: 215,
                  referenceMin: 125,
                  referenceMax: 200
                }
              ]
            },
            {
              date: '2023-06-15',
              biomarkerValues: [
                {
                  biomarker: { name: 'Glucose', unit: 'mg/dL' },
                  value: 95,
                  referenceMin: 70,
                  referenceMax: 99
                },
                {
                  biomarker: { name: 'Total Cholesterol', unit: 'mg/dL' },
                  value: 210,
                  referenceMin: 125,
                  referenceMax: 200
                }
              ]
            }
          ]
        },
        recommendations: {
          data: [
            {
              id: 'rec1',
              title: 'Reduce Saturated Fat Intake',
              summary: 'Your cholesterol levels are elevated. Consider reducing saturated fat in your diet.',
              explanation: 'High cholesterol levels increase your risk of heart disease. Reducing saturated fat intake can help lower your total cholesterol and LDL (bad) cholesterol levels.',
              category: 'nutrition',
              priority: 'high',
              scientificBasis: 'Multiple clinical studies have shown that reducing saturated fat intake can lower total cholesterol by 5-10% within 3 months.',
              references: [
                'American Heart Association Guidelines (2022)',
                'Journal of Lipid Research, Vol 45, Issue 3'
              ],
              relatedBiomarkers: ['Total Cholesterol', 'LDL Cholesterol']
            },
            {
              id: 'rec2',
              title: 'Regular Aerobic Exercise',
              summary: 'Incorporate at least 150 minutes of moderate aerobic activity weekly.',
              explanation: 'Regular aerobic exercise can help improve your cholesterol levels by increasing HDL (good) cholesterol and may help lower LDL (bad) cholesterol.',
              category: 'exercise',
              priority: 'medium',
              scientificBasis: 'Research shows that regular physical activity can increase HDL cholesterol by up to 5% and help manage overall cholesterol levels.',
              references: [
                'CDC Physical Activity Guidelines',
                'American College of Sports Medicine Position Stand'
              ],
              relatedBiomarkers: ['HDL Cholesterol', 'Total Cholesterol']
            }
          ]
        },
        riskAssessment: {
          data: {
            risks: [
              {
                name: 'Cardiovascular',
                score: 0.35,
                details: 'Your cardiovascular risk is moderate based on your cholesterol levels and other factors.',
                contributingFactors: [
                  { name: 'Elevated Cholesterol', description: 'Your total cholesterol is above the recommended range.' },
                  { name: 'Family History', description: 'You reported a family history of heart disease.' }
                ],
                recommendations: [
                  { title: 'Reduce Saturated Fat', description: 'Limit intake of saturated fats from animal products and processed foods.' },
                  { title: 'Regular Exercise', description: 'Aim for at least 150 minutes of moderate aerobic activity weekly.' }
                ]
              },
              {
                name: 'Diabetes',
                score: 0.15,
                details: 'Your diabetes risk is low based on your current glucose levels.',
                contributingFactors: [
                  { name: 'Normal Glucose', description: 'Your fasting glucose is within the normal range.' }
                ],
                recommendations: [
                  { title: 'Maintain Healthy Diet', description: 'Continue to limit refined carbohydrates and added sugars.' }
                ]
              },
              {
                name: 'Liver',
                score: 0.20,
                details: 'Your liver health indicators are generally good with some minor elevations.',
                contributingFactors: [
                  { name: 'Slightly Elevated ALT', description: 'Your ALT enzyme is at the upper end of the normal range.' }
                ],
                recommendations: [
                  { title: 'Limit Alcohol', description: 'Keep alcohol consumption moderate to support liver health.' }
                ]
              },
              {
                name: 'Kidney',
                score: 0.10,
                details: 'Your kidney function appears normal based on current biomarkers.',
                contributingFactors: [],
                recommendations: [
                  { title: 'Stay Hydrated', description: 'Maintain adequate hydration to support kidney function.' }
                ]
              },
              {
                name: 'Thyroid',
                score: 0.25,
                details: 'Your thyroid function shows minor variations that should be monitored.',
                contributingFactors: [
                  { name: 'Borderline TSH', description: 'Your TSH level is at the upper end of the normal range.' }
                ],
                recommendations: [
                  { title: 'Follow-up Testing', description: 'Consider a follow-up thyroid panel in 3-6 months.' }
                ]
              }
            ]
          }
        }
      };
      
      resolve({ data: mockData[endpoint] });
    }, 500);
  });
};

export default api;