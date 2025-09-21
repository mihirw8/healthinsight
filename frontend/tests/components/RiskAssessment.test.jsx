import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RiskAssessment from '../../src/components/RiskAssessment';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock recharts to avoid rendering issues in test environment
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    RadarChart: () => <div data-testid="radar-chart" />,
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
    Radar: () => <div data-testid="radar" />,
    Legend: () => <div data-testid="legend" />
  };
});

// Mock data
const mockRiskData = {
  overallRiskLevel: 'moderate',
  riskCategories: {
    cardiovascular: {
      riskLevel: 'moderate',
      score: 0.5,
      factors: [
        'Elevated LDL cholesterol (130 mg/dL)',
        'Family history of heart disease',
        'Moderate physical activity level'
      ]
    },
    diabetes: {
      riskLevel: 'low',
      score: 0.2,
      factors: [
        'Normal glucose levels (92 mg/dL)',
        'Normal HbA1c (5.4%)',
        'Healthy BMI (23.5)'
      ]
    },
    nutritional: [
      {
        nutrient: 'Vitamin D',
        riskLevel: 'high',
        currentValue: 18,
        unit: 'ng/mL',
        referenceRange: { min: 30, max: 100 },
        recommendations: [
          'Consider vitamin D supplementation',
          'Increase sun exposure when possible',
          'Include more vitamin D rich foods in diet'
        ]
      },
      {
        nutrient: 'Iron',
        riskLevel: 'low',
        currentValue: 85,
        unit: 'μg/dL',
        referenceRange: { min: 60, max: 170 },
        recommendations: [
          'Maintain current iron intake'
        ]
      }
    ]
  },
  summary: 'Your overall health risk is moderate, primarily due to cardiovascular factors and vitamin D deficiency.',
  recommendations: [
    'Consider discussing cholesterol management with your healthcare provider',
    'Vitamin D supplementation may be beneficial',
    'Continue maintaining healthy glucose levels and BMI'
  ],
  urgentAction: false
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

describe('RiskAssessment Component', () => {
  test('renders loading state correctly', () => {
    renderWithTheme(<RiskAssessment loading={true} riskData={null} />);
    
    expect(screen.getByTestId('risk-assessment-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading risk assessment data/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    renderWithTheme(<RiskAssessment error="Failed to load risk assessment" riskData={null} />);
    
    expect(screen.getByTestId('risk-assessment-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load risk assessment/i)).toBeInTheDocument();
  });

  test('renders risk assessment data correctly', () => {
    renderWithTheme(<RiskAssessment riskData={mockRiskData} />);
    
    // Check for title
    expect(screen.getByText(/Risk Assessment/i)).toBeInTheDocument();
    
    // Check for overall risk level
    expect(screen.getByText(/Overall Risk: Moderate/i)).toBeInTheDocument();
    
    // Check for risk summary
    expect(screen.getByText(mockRiskData.summary)).toBeInTheDocument();
    
    // Check for radar chart container
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    
    // Check for risk categories
    expect(screen.getByText(/Cardiovascular/i)).toBeInTheDocument();
    expect(screen.getByText(/Diabetes/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutritional/i)).toBeInTheDocument();
  });

  test('displays risk factors correctly', () => {
    renderWithTheme(<RiskAssessment riskData={mockRiskData} />);
    
    // Check for cardiovascular risk factors
    expect(screen.getByText(/Elevated LDL cholesterol/i)).toBeInTheDocument();
    expect(screen.getByText(/Family history of heart disease/i)).toBeInTheDocument();
    
    // Check for diabetes risk factors
    expect(screen.getByText(/Normal glucose levels/i)).toBeInTheDocument();
    expect(screen.getByText(/Normal HbA1c/i)).toBeInTheDocument();
    
    // Check for nutritional risk factors
    expect(screen.getByText(/Vitamin D/i)).toBeInTheDocument();
  });

  test('shows risk details on click', async () => {
    renderWithTheme(<RiskAssessment riskData={mockRiskData} />);
    
    // Click on a risk category to show details
    const cardiovascularRisk = screen.getByText(/Cardiovascular/i).closest('[data-testid="risk-category-item"]');
    userEvent.click(cardiovascularRisk);
    
    // Wait for details dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('risk-details-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Cardiovascular Risk Details/i)).toBeInTheDocument();
    });
    
    // Check for risk factors in the dialog
    expect(screen.getByText(/Elevated LDL cholesterol/i)).toBeInTheDocument();
    expect(screen.getByText(/Family history of heart disease/i)).toBeInTheDocument();
    expect(screen.getByText(/Moderate physical activity level/i)).toBeInTheDocument();
  });

  test('handles empty risk data', () => {
    renderWithTheme(<RiskAssessment riskData={null} />);
    
    expect(screen.getByText(/No risk assessment data available/i)).toBeInTheDocument();
  });

  test('displays medical disclaimer', () => {
    renderWithTheme(<RiskAssessment riskData={mockRiskData} />);
    
    expect(screen.getByTestId('medical-disclaimer')).toBeInTheDocument();
    expect(screen.getByText(/This risk assessment is not a medical diagnosis/i)).toBeInTheDocument();
  });

  test('displays urgent action notice when applicable', () => {
    const urgentRiskData = {
      ...mockRiskData,
      urgentAction: true,
      overallRiskLevel: 'high'
    };
    
    renderWithTheme(<RiskAssessment riskData={urgentRiskData} />);
    
    expect(screen.getByTestId('urgent-action-notice')).toBeInTheDocument();
    expect(screen.getByText(/Please consult with a healthcare professional/i)).toBeInTheDocument();
  });

  test('does not display urgent action notice when not applicable', () => {
    renderWithTheme(<RiskAssessment riskData={mockRiskData} />);
    
    expect(screen.queryByTestId('urgent-action-notice')).not.toBeInTheDocument();
  });
});