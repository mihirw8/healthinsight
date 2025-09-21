import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HealthTrends from '../../src/components/HealthTrends';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock recharts to avoid rendering issues in test environment
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: () => <div data-testid="line-chart" />,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ReferenceLine: () => <div data-testid="reference-line" />
  };
});

// Mock data
const mockTrendData = [
  {
    date: '2023-01-15',
    biomarkers: [
      { name: 'Glucose', value: 95, unit: 'mg/dL' },
      { name: 'HbA1c', value: 5.5, unit: '%' }
    ]
  },
  {
    date: '2023-03-15',
    biomarkers: [
      { name: 'Glucose', value: 100, unit: 'mg/dL' },
      { name: 'HbA1c', value: 5.7, unit: '%' }
    ]
  },
  {
    date: '2023-06-15',
    biomarkers: [
      { name: 'Glucose', value: 105, unit: 'mg/dL' },
      { name: 'HbA1c', value: 5.9, unit: '%' }
    ]
  }
];

const mockBiomarkerReferenceRanges = {
  'Glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'HbA1c': { min: 4.0, max: 5.7, unit: '%' }
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

describe('HealthTrends Component', () => {
  test('renders loading state correctly', () => {
    renderWithTheme(<HealthTrends loading={true} trendData={[]} />);
    
    expect(screen.getByTestId('health-trends-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading health trend data/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    renderWithTheme(<HealthTrends error="Failed to load trend data" trendData={[]} />);
    
    expect(screen.getByTestId('health-trends-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load trend data/i)).toBeInTheDocument();
  });

  test('renders with trend data correctly', () => {
    renderWithTheme(
      <HealthTrends 
        trendData={mockTrendData} 
        referenceRanges={mockBiomarkerReferenceRanges} 
      />
    );
    
    // Check for title
    expect(screen.getByText(/Health Trends/i)).toBeInTheDocument();
    
    // Check for biomarker selector
    expect(screen.getByTestId('biomarker-selector')).toBeInTheDocument();
    
    // Check for time range selector
    expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
    
    // Check for chart container
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  test('handles biomarker selection', async () => {
    renderWithTheme(
      <HealthTrends 
        trendData={mockTrendData} 
        referenceRanges={mockBiomarkerReferenceRanges} 
      />
    );
    
    // Find and click the biomarker selector
    const biomarkerSelector = screen.getByTestId('biomarker-selector');
    userEvent.click(biomarkerSelector);
    
    // Wait for dropdown options to appear and select HbA1c
    await waitFor(() => {
      const hba1cOption = screen.getByText('HbA1c');
      userEvent.click(hba1cOption);
    });
    
    // Check that the selected biomarker is now HbA1c
    expect(screen.getByTestId('selected-biomarker')).toHaveTextContent('HbA1c');
  });

  test('handles time range selection', async () => {
    renderWithTheme(
      <HealthTrends 
        trendData={mockTrendData} 
        referenceRanges={mockBiomarkerReferenceRanges} 
      />
    );
    
    // Find and click the time range selector
    const timeRangeSelector = screen.getByTestId('time-range-selector');
    userEvent.click(timeRangeSelector);
    
    // Wait for dropdown options to appear and select 1 year
    await waitFor(() => {
      const yearOption = screen.getByText('1 Year');
      userEvent.click(yearOption);
    });
    
    // Check that the selected time range is now 1 Year
    expect(screen.getByTestId('selected-time-range')).toHaveTextContent('1 Year');
  });

  test('displays no data message when trend data is empty', () => {
    renderWithTheme(<HealthTrends trendData={[]} />);
    
    expect(screen.getByText(/No trend data available/i)).toBeInTheDocument();
  });

  test('displays trend information and insights', () => {
    renderWithTheme(
      <HealthTrends 
        trendData={mockTrendData} 
        referenceRanges={mockBiomarkerReferenceRanges} 
      />
    );
    
    // Check for trend information section
    expect(screen.getByTestId('trend-information')).toBeInTheDocument();
    
    // Check for insights section
    expect(screen.getByTestId('trend-insights')).toBeInTheDocument();
  });

  test('shows reference range information', () => {
    renderWithTheme(
      <HealthTrends 
        trendData={mockTrendData} 
        referenceRanges={mockBiomarkerReferenceRanges} 
      />
    );
    
    // Default selected biomarker is usually the first one (Glucose)
    expect(screen.getByText(/Reference Range: 70-100 mg\/dL/i)).toBeInTheDocument();
  });
});