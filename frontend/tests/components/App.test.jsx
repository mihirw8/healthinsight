import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';
import { ThemeProvider } from '@mui/material/styles';

// Mock the Dashboard component
jest.mock('../../src/components/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard-component">Dashboard Component</div>;
  };
});

// Mock useMediaQuery hook
jest.mock('@mui/material/useMediaQuery', () => {
  return jest.fn().mockReturnValue(false); // Default to desktop view
});

describe('App Component', () => {
  test('renders app with correct layout', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Check for app title
    expect(screen.getByText(/Health Report Analysis & Insight Engine/i)).toBeInTheDocument();
    
    // Check for main navigation items
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    
    // Check for theme toggle
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  test('toggles theme when theme button is clicked', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Get theme toggle button
    const themeToggle = screen.getByTestId('theme-toggle');
    
    // Initial theme should be light (default)
    expect(document.body.className).not.toContain('dark-mode');
    
    // Click theme toggle
    fireEvent.click(themeToggle);
    
    // Theme should now be dark
    expect(document.body.className).toContain('dark-mode');
    
    // Click theme toggle again
    fireEvent.click(themeToggle);
    
    // Theme should be back to light
    expect(document.body.className).not.toContain('dark-mode');
  });

  test('toggles drawer when menu button is clicked on mobile', () => {
    // Mock useMediaQuery to return true (mobile view)
    require('@mui/material/useMediaQuery').mockReturnValue(true);
    
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Drawer should be closed initially on mobile
    expect(screen.queryByTestId('drawer-open')).not.toBeInTheDocument();
    
    // Find and click menu button
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);
    
    // Drawer should now be open
    expect(screen.getByTestId('drawer-open')).toBeInTheDocument();
    
    // Click outside drawer to close it
    fireEvent.click(document.body);
    
    // Drawer should be closed again
    expect(screen.queryByTestId('drawer-open')).not.toBeInTheDocument();
  });

  test('navigates to correct route when nav item is clicked', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Initially on dashboard route
    expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    
    // Click Reports nav item
    const reportsNavItem = screen.getByText(/Reports/i);
    fireEvent.click(reportsNavItem);
    
    // Should navigate to reports route
    expect(window.location.pathname).toBe('/reports');
    
    // Click Insights nav item
    const insightsNavItem = screen.getByText(/Insights/i);
    fireEvent.click(insightsNavItem);
    
    // Should navigate to insights route
    expect(window.location.pathname).toBe('/insights');
    
    // Click Settings nav item
    const settingsNavItem = screen.getByText(/Settings/i);
    fireEvent.click(settingsNavItem);
    
    // Should navigate to settings route
    expect(window.location.pathname).toBe('/settings');
    
    // Click Dashboard nav item to go back
    const dashboardNavItem = screen.getByText(/Dashboard/i);
    fireEvent.click(dashboardNavItem);
    
    // Should navigate back to dashboard route
    expect(window.location.pathname).toBe('/');
  });

  test('renders user profile section correctly', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Check for user profile button
    const profileButton = screen.getByTestId('profile-button');
    expect(profileButton).toBeInTheDocument();
    
    // Click profile button to open menu
    fireEvent.click(profileButton);
    
    // Check for profile menu items
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test('renders footer with correct information', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Check for footer content
    const footer = screen.getByTestId('app-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(/Health Report Analysis & Insight Engine/i);
    expect(footer).toHaveTextContent(/© 2023/i);
  });
});