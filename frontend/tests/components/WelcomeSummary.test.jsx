import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WelcomeSummary from '../../src/components/WelcomeSummary';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock data
const mockUserData = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  lastLogin: '2023-06-15T10:30:00Z'
};

const mockLatestReport = {
  id: '456',
  date: '2023-06-01T08:00:00Z',
  overallHealth: 'good',
  criticalBiomarkers: 0,
  warningBiomarkers: 2,
  normalBiomarkers: 18
};

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

describe('WelcomeSummary Component', () => {
  test('renders loading state correctly', () => {
    renderWithTheme(<WelcomeSummary loading={true} />);
    
    expect(screen.getByTestId('welcome-summary-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading your summary/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    renderWithTheme(<WelcomeSummary error="Failed to load user data" />);
    
    expect(screen.getByTestId('welcome-summary-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load user data/i)).toBeInTheDocument();
  });

  test('renders logged in user with latest report correctly', () => {
    renderWithTheme(
      <WelcomeSummary 
        userData={mockUserData} 
        latestReport={mockLatestReport} 
      />
    );
    
    // Check for welcome message with user name
    expect(screen.getByText(/Welcome back, John Doe/i)).toBeInTheDocument();
    
    // Check for health status
    expect(screen.getByText(/Your health status: Good/i)).toBeInTheDocument();
    
    // Check for days since last report
    const today = new Date();
    const reportDate = new Date('2023-06-01T08:00:00Z');
    const expectedDays = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
    
    // Use a regex to account for the dynamic day calculation
    const daysSinceRegex = new RegExp(`${expectedDays} days since your last report`, 'i');
    expect(screen.getByText(daysSinceRegex)).toBeInTheDocument();
    
    // Check for biomarker summary
    expect(screen.getByText(/0 critical/i)).toBeInTheDocument();
    expect(screen.getByText(/2 warnings/i)).toBeInTheDocument();
    expect(screen.getByText(/18 normal/i)).toBeInTheDocument();
  });

  test('renders logged in user without latest report correctly', () => {
    renderWithTheme(
      <WelcomeSummary 
        userData={mockUserData} 
        latestReport={null} 
      />
    );
    
    // Check for welcome message with user name
    expect(screen.getByText(/Welcome back, John Doe/i)).toBeInTheDocument();
    
    // Check for no report message
    expect(screen.getByText(/No health reports found/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload your first health report to get started/i)).toBeInTheDocument();
  });

  test('renders not logged in state correctly', () => {
    renderWithTheme(<WelcomeSummary userData={null} latestReport={null} />);
    
    // Check for guest welcome message
    expect(screen.getByText(/Welcome to Health Report Analysis & Insight Engine/i)).toBeInTheDocument();
    
    // Check for login prompt
    expect(screen.getByText(/Log in or sign up to get started/i)).toBeInTheDocument();
    
    // Check for login/signup buttons
    expect(screen.getByText(/Log In/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });

  test('displays health status with appropriate color coding', () => {
    // Test with good health status
    renderWithTheme(
      <WelcomeSummary 
        userData={mockUserData} 
        latestReport={{...mockLatestReport, overallHealth: 'good'}} 
      />
    );
    
    let healthStatus = screen.getByTestId('health-status');
    expect(healthStatus).toHaveClass('status-good');
    
    // Cleanup and re-render with warning health status
    screen.unmount();
    renderWithTheme(
      <WelcomeSummary 
        userData={mockUserData} 
        latestReport={{...mockLatestReport, overallHealth: 'warning'}} 
      />
    );
    
    healthStatus = screen.getByTestId('health-status');
    expect(healthStatus).toHaveClass('status-warning');
    
    // Cleanup and re-render with critical health status
    screen.unmount();
    renderWithTheme(
      <WelcomeSummary 
        userData={mockUserData} 
        latestReport={{...mockLatestReport, overallHealth: 'critical'}} 
      />
    );
    
    healthStatus = screen.getByTestId('health-status');
    expect(healthStatus).toHaveClass('status-critical');
  });
});