import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BiomarkerSummary from '../../src/components/BiomarkerSummary';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock data
const mockBiomarkers = [
  {
    id: '1',
    name: 'Glucose',
    value: 120,
    unit: 'mg/dL',
    referenceRange: { min: 70, max: 100 },
    status: 'high',
    significance: 'high',
    interpretation: 'Above normal range'
  },
  {
    id: '2',
    name: 'HDL Cholesterol',
    value: 45,
    unit: 'mg/dL',
    referenceRange: { min: 40, max: 60 },
    status: 'normal',
    significance: 'medium',
    interpretation: 'Within normal range'
  },
  {
    id: '3',
    name: 'Vitamin D',
    value: 20,
    unit: 'ng/mL',
    referenceRange: { min: 30, max: 100 },
    status: 'low',
    significance: 'medium',
    interpretation: 'Below normal range'
  }
];

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

describe('BiomarkerSummary Component', () => {
  test('renders loading state correctly', () => {
    renderWithTheme(<BiomarkerSummary loading={true} biomarkers={[]} />);
    
    expect(screen.getByTestId('biomarker-summary-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading biomarker data/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    renderWithTheme(<BiomarkerSummary error="Failed to load biomarkers" biomarkers={[]} />);
    
    expect(screen.getByTestId('biomarker-summary-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load biomarkers/i)).toBeInTheDocument();
  });

  test('renders biomarker data correctly', () => {
    renderWithTheme(<BiomarkerSummary biomarkers={mockBiomarkers} />);
    
    // Check for title
    expect(screen.getByText(/Biomarker Summary/i)).toBeInTheDocument();
    
    // Check for biomarker names
    expect(screen.getByText(/Glucose/i)).toBeInTheDocument();
    expect(screen.getByText(/HDL Cholesterol/i)).toBeInTheDocument();
    expect(screen.getByText(/Vitamin D/i)).toBeInTheDocument();
    
    // Check for values and units
    expect(screen.getByText(/120 mg\/dL/i)).toBeInTheDocument();
    expect(screen.getByText(/45 mg\/dL/i)).toBeInTheDocument();
    expect(screen.getByText(/20 ng\/mL/i)).toBeInTheDocument();
  });

  test('displays status indicators correctly', () => {
    renderWithTheme(<BiomarkerSummary biomarkers={mockBiomarkers} />);
    
    // Check for status indicators (this depends on your implementation)
    const statusIndicators = screen.getAllByTestId('biomarker-status-indicator');
    expect(statusIndicators.length).toBe(mockBiomarkers.length);
    
    // Assuming your implementation uses specific classes or attributes for different statuses
    const highStatusElements = screen.getAllByTestId('status-high');
    const normalStatusElements = screen.getAllByTestId('status-normal');
    const lowStatusElements = screen.getAllByTestId('status-low');
    
    expect(highStatusElements.length).toBe(1);
    expect(normalStatusElements.length).toBe(1);
    expect(lowStatusElements.length).toBe(1);
  });

  test('shows critical biomarkers first', () => {
    renderWithTheme(<BiomarkerSummary biomarkers={mockBiomarkers} />);
    
    const biomarkerRows = screen.getAllByTestId('biomarker-row');
    
    // Assuming the first row contains the critical biomarker (Glucose)
    expect(biomarkerRows[0]).toHaveTextContent(/Glucose/i);
  });

  test('displays reference ranges', () => {
    renderWithTheme(<BiomarkerSummary biomarkers={mockBiomarkers} />);
    
    expect(screen.getByText(/70-100 mg\/dL/i)).toBeInTheDocument();
    expect(screen.getByText(/40-60 mg\/dL/i)).toBeInTheDocument();
    expect(screen.getByText(/30-100 ng\/mL/i)).toBeInTheDocument();
  });

  test('handles empty biomarkers array', () => {
    renderWithTheme(<BiomarkerSummary biomarkers={[]} />);
    
    expect(screen.getByText(/No biomarker data available/i)).toBeInTheDocument();
  });

  test('displays biomarker details on click', async () => {
    renderWithTheme(<BiomarkerSummary biomarkers={mockBiomarkers} />);
    
    // Click on a biomarker row to show details
    const glucoseRow = screen.getByText(/Glucose/i).closest('[data-testid="biomarker-row"]');
    userEvent.click(glucoseRow);
    
    // Wait for details dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('biomarker-details-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Glucose Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Above normal range/i)).toBeInTheDocument();
    });
  });
});