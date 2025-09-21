import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../src/components/Dashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as apiService from '../../src/services/apiService';

// Mock the child components
jest.mock('../../src/components/WelcomeSummary', () => {
  return function MockWelcomeSummary(props) {
    return <div data-testid="welcome-summary-component">WelcomeSummary Component</div>;
  };
});

jest.mock('../../src/components/ReportUpload', () => {
  return function MockReportUpload(props) {
    return <div data-testid="report-upload-component">ReportUpload Component</div>;
  };
});

jest.mock('../../src/components/BiomarkerSummary', () => {
  return function MockBiomarkerSummary(props) {
    return <div data-testid="biomarker-summary-component">BiomarkerSummary Component</div>;
  };
});

jest.mock('../../src/components/HealthTrends', () => {
  return function MockHealthTrends(props) {
    return <div data-testid="health-trends-component">HealthTrends Component</div>;
  };
});

jest.mock('../../src/components/Recommendations', () => {
  return function MockRecommendations(props) {
    return <div data-testid="recommendations-component">Recommendations Component</div>;
  };
});

jest.mock('../../src/components/RiskAssessment', () => {
  return function MockRiskAssessment(props) {
    return <div data-testid="risk-assessment-component">RiskAssessment Component</div>;
  };
});

// Mock the API service
jest.mock('../../src/services/apiService', () => ({
  getUserProfile: jest.fn(),
  getLatestHealthReport: jest.fn(),
  getBiomarkers: jest.fn(),
  getTrendData: jest.fn(),
  getRecommendations: jest.fn(),
  getRiskAssessment: jest.fn()
}));

// Create a theme for testing
const theme = createTheme();

// Mock component wrapper with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    apiService.getUserProfile.mockResolvedValue({
      id: '123',
      name: 'John Doe',
      email: 'john.doe@example.com'
    });
    
    apiService.getLatestHealthReport.mockResolvedValue({
      id: '456',
      date: '2023-06-01T08:00:00Z',
      overallHealth: 'good'
    });
    
    apiService.getBiomarkers.mockResolvedValue([
      { id: '1', name: 'Glucose', value: 95 }
    ]);
    
    apiService.getTrendData.mockResolvedValue([
      { date: '2023-06-01', biomarkers: [{ name: 'Glucose', value: 95 }] }
    ]);
    
    apiService.getRecommendations.mockResolvedValue([
      { id: '1', title: 'Increase physical activity' }
    ]);
    
    apiService.getRiskAssessment.mockResolvedValue({
      overallRiskLevel: 'low'
    });
  });

  test('renders dashboard layout correctly', async () => {
    renderWithTheme(<Dashboard />);
    
    // Check for dashboard title
    expect(screen.getByText(/Health Dashboard/i)).toBeInTheDocument();
    
    // Wait for data loading to complete
    await waitFor(() => {
      // Check that all child components are rendered
      expect(screen.getByTestId('welcome-summary-component')).toBeInTheDocument();
      expect(screen.getByTestId('report-upload-component')).toBeInTheDocument();
      expect(screen.getByTestId('biomarker-summary-component')).toBeInTheDocument();
      expect(screen.getByTestId('health-trends-component')).toBeInTheDocument();
      expect(screen.getByTestId('recommendations-component')).toBeInTheDocument();
      expect(screen.getByTestId('risk-assessment-component')).toBeInTheDocument();
    });
  });

  test('handles loading state correctly', () => {
    // Make API calls return promises that don't resolve immediately
    apiService.getUserProfile.mockReturnValue(new Promise(() => {}));
    apiService.getLatestHealthReport.mockReturnValue(new Promise(() => {}));
    
    renderWithTheme(<Dashboard />);
    
    // Check for loading indicators
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading your health dashboard/i)).toBeInTheDocument();
  });

  test('handles API errors correctly', async () => {
    // Mock API error
    apiService.getUserProfile.mockRejectedValue(new Error('Failed to load user profile'));
    
    renderWithTheme(<Dashboard />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
      expect(screen.getByText(/Error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  test('fetches all required data on mount', async () => {
    renderWithTheme(<Dashboard />);
    
    // Wait for data loading to complete
    await waitFor(() => {
      // Verify all API calls were made
      expect(apiService.getUserProfile).toHaveBeenCalled();
      expect(apiService.getLatestHealthReport).toHaveBeenCalled();
      expect(apiService.getBiomarkers).toHaveBeenCalled();
      expect(apiService.getTrendData).toHaveBeenCalled();
      expect(apiService.getRecommendations).toHaveBeenCalled();
      expect(apiService.getRiskAssessment).toHaveBeenCalled();
    });
  });

  test('passes correct props to child components', async () => {
    const { container } = renderWithTheme(<Dashboard />);
    
    // Wait for data loading to complete
    await waitFor(() => {
      // Check that the dashboard grid container is rendered
      expect(container.querySelector('.dashboard-grid')).toBeInTheDocument();
      
      // Check that all child components are rendered
      expect(screen.getByTestId('welcome-summary-component')).toBeInTheDocument();
      expect(screen.getByTestId('report-upload-component')).toBeInTheDocument();
      expect(screen.getByTestId('biomarker-summary-component')).toBeInTheDocument();
      expect(screen.getByTestId('health-trends-component')).toBeInTheDocument();
      expect(screen.getByTestId('recommendations-component')).toBeInTheDocument();
      expect(screen.getByTestId('risk-assessment-component')).toBeInTheDocument();
    });
  });

  test('handles refresh data functionality', async () => {
    renderWithTheme(<Dashboard />);
    
    // Wait for initial data loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('welcome-summary-component')).toBeInTheDocument();
    });
    
    // Clear mock calls count
    jest.clearAllMocks();
    
    // Find and click refresh button
    const refreshButton = screen.getByTestId('refresh-dashboard');
    refreshButton.click();
    
    // Verify all API calls were made again
    await waitFor(() => {
      expect(apiService.getUserProfile).toHaveBeenCalled();
      expect(apiService.getLatestHealthReport).toHaveBeenCalled();
      expect(apiService.getBiomarkers).toHaveBeenCalled();
      expect(apiService.getTrendData).toHaveBeenCalled();
      expect(apiService.getRecommendations).toHaveBeenCalled();
      expect(apiService.getRiskAssessment).toHaveBeenCalled();
    });
  });
});