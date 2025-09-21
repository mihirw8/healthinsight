import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Recommendations from '../../src/components/Recommendations';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock data
const mockRecommendations = [
  {
    id: '1',
    title: 'Reduce saturated fat intake',
    description: 'Limit consumption of saturated fats to help lower cholesterol levels.',
    category: 'diet',
    priority: 'high',
    biomarkers: ['LDL Cholesterol', 'Total Cholesterol'],
    scientificBasis: 'Research shows that reducing saturated fat intake can help lower LDL cholesterol levels.',
    actionSteps: [
      'Choose lean meats and low-fat dairy products',
      'Use olive oil instead of butter when cooking',
      'Limit processed foods high in trans fats'
    ]
  },
  {
    id: '2',
    title: 'Increase physical activity',
    description: 'Aim for at least 150 minutes of moderate exercise per week.',
    category: 'lifestyle',
    priority: 'medium',
    biomarkers: ['HDL Cholesterol', 'Blood Pressure'],
    scientificBasis: 'Regular physical activity has been shown to increase HDL cholesterol and reduce blood pressure.',
    actionSteps: [
      'Start with 30 minutes of walking 5 days a week',
      'Gradually increase intensity as fitness improves',
      'Include both cardio and strength training exercises'
    ]
  },
  {
    id: '3',
    title: 'Consider vitamin D supplementation',
    description: 'Your vitamin D levels are below the recommended range.',
    category: 'supplement',
    priority: 'low',
    biomarkers: ['Vitamin D'],
    scientificBasis: 'Vitamin D is essential for calcium absorption and bone health.',
    actionSteps: [
      'Consult with your healthcare provider about appropriate dosage',
      'Spend 15-30 minutes in sunlight several times a week',
      'Include vitamin D rich foods like fatty fish and fortified dairy'
    ]
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

describe('Recommendations Component', () => {
  test('renders loading state correctly', () => {
    renderWithTheme(<Recommendations loading={true} recommendations={[]} />);
    
    expect(screen.getByTestId('recommendations-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading recommendations/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    renderWithTheme(<Recommendations error="Failed to load recommendations" recommendations={[]} />);
    
    expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load recommendations/i)).toBeInTheDocument();
  });

  test('renders recommendations correctly', () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    // Check for title
    expect(screen.getByText(/Personalized Recommendations/i)).toBeInTheDocument();
    
    // Check for recommendation titles
    expect(screen.getByText(/Reduce saturated fat intake/i)).toBeInTheDocument();
    expect(screen.getByText(/Increase physical activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Consider vitamin D supplementation/i)).toBeInTheDocument();
    
    // Check for recommendation descriptions
    expect(screen.getByText(/Limit consumption of saturated fats/i)).toBeInTheDocument();
    expect(screen.getByText(/Aim for at least 150 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Your vitamin D levels are below/i)).toBeInTheDocument();
  });

  test('displays priority indicators correctly', () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    // Check for priority indicators
    const highPriorityElements = screen.getAllByTestId('priority-high');
    const mediumPriorityElements = screen.getAllByTestId('priority-medium');
    const lowPriorityElements = screen.getAllByTestId('priority-low');
    
    expect(highPriorityElements.length).toBe(1);
    expect(mediumPriorityElements.length).toBe(1);
    expect(lowPriorityElements.length).toBe(1);
  });

  test('displays category icons correctly', () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    // Check for category icons
    const dietCategoryElements = screen.getAllByTestId('category-diet');
    const lifestyleCategoryElements = screen.getAllByTestId('category-lifestyle');
    const supplementCategoryElements = screen.getAllByTestId('category-supplement');
    
    expect(dietCategoryElements.length).toBe(1);
    expect(lifestyleCategoryElements.length).toBe(1);
    expect(supplementCategoryElements.length).toBe(1);
  });

  test('shows recommendation details on click', async () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    // Click on a recommendation card to show details
    const dietRecommendation = screen.getByText(/Reduce saturated fat intake/i).closest('[data-testid="recommendation-card"]');
    userEvent.click(dietRecommendation);
    
    // Wait for details dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-details-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Scientific Basis/i)).toBeInTheDocument();
      expect(screen.getByText(/Research shows that reducing saturated fat/i)).toBeInTheDocument();
    });
    
    // Check for action steps
    expect(screen.getByText(/Action Steps/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose lean meats and low-fat dairy products/i)).toBeInTheDocument();
    
    // Check for related biomarkers
    expect(screen.getByText(/Related Biomarkers/i)).toBeInTheDocument();
    expect(screen.getByText(/LDL Cholesterol/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Cholesterol/i)).toBeInTheDocument();
  });

  test('handles empty recommendations array', () => {
    renderWithTheme(<Recommendations recommendations={[]} />);
    
    expect(screen.getByText(/No recommendations available/i)).toBeInTheDocument();
  });

  test('displays medical disclaimer', () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    expect(screen.getByTestId('medical-disclaimer')).toBeInTheDocument();
    expect(screen.getByText(/These recommendations are not medical advice/i)).toBeInTheDocument();
  });

  test('sorts recommendations by priority', () => {
    renderWithTheme(<Recommendations recommendations={mockRecommendations} />);
    
    const recommendationCards = screen.getAllByTestId('recommendation-card');
    
    // First card should be high priority
    expect(recommendationCards[0]).toHaveTextContent(/Reduce saturated fat intake/i);
    
    // Second card should be medium priority
    expect(recommendationCards[1]).toHaveTextContent(/Increase physical activity/i);
    
    // Third card should be low priority
    expect(recommendationCards[2]).toHaveTextContent(/Consider vitamin D supplementation/i);
  });
});