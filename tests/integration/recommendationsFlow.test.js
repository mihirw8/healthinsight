const { test, expect } = require('@playwright/test');

test.describe('Recommendations Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Login
    await page.getByTestId('profile-button').click();
    await page.getByText('Login').click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-component"]');
  });

  test('should display personalized recommendations based on health data', async ({ page }) => {
    // Navigate to recommendations section
    await page.getByText('Recommendations').click();
    
    // Wait for recommendations component to load
    await page.waitForSelector('[data-testid="recommendations-component"]');
    
    // Verify recommendations are displayed
    await expect(page.getByText('Personalized Recommendations')).toBeVisible();
    
    // Check for recommendation categories
    await expect(page.getByText('Lifestyle')).toBeVisible();
    await expect(page.getByText('Nutrition')).toBeVisible();
    await expect(page.getByText('Medical')).toBeVisible();
    
    // Verify priority indicators are shown
    await expect(page.getByTestId('high-priority-indicator')).toBeVisible();
    
    // Click on a recommendation to view details
    await page.getByText('Increase vitamin D intake').first().click();
    
    // Verify recommendation details dialog opens
    await expect(page.getByTestId('recommendation-detail-dialog')).toBeVisible();
    await expect(page.getByText('Scientific Rationale')).toBeVisible();
    await expect(page.getByText('Suggested Actions')).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should filter recommendations by category', async ({ page }) => {
    // Navigate to recommendations section
    await page.getByText('Recommendations').click();
    
    // Wait for recommendations component to load
    await page.waitForSelector('[data-testid="recommendations-component"]');
    
    // Count initial number of recommendations
    const initialCount = await page.getByTestId('recommendation-item').count();
    
    // Filter by Lifestyle category
    await page.getByTestId('category-filter').click();
    await page.getByText('Lifestyle').click();
    
    // Verify filtered recommendations
    const filteredCount = await page.getByTestId('recommendation-item').count();
    expect(filteredCount).toBeLessThan(initialCount);
    
    // Check that all visible recommendations are from Lifestyle category
    const categoryLabels = await page.getByTestId('category-label').allTextContents();
    for (const label of categoryLabels) {
      expect(label).toBe('Lifestyle');
    }
    
    // Clear filter
    await page.getByTestId('clear-filters').click();
    
    // Verify all recommendations are shown again
    const resetCount = await page.getByTestId('recommendation-item').count();
    expect(resetCount).toBe(initialCount);
  });

  test('should sort recommendations by priority', async ({ page }) => {
    // Navigate to recommendations section
    await page.getByText('Recommendations').click();
    
    // Wait for recommendations component to load
    await page.waitForSelector('[data-testid="recommendations-component"]');
    
    // Sort by priority (high to low)
    await page.getByTestId('sort-select').click();
    await page.getByText('Priority (High to Low)').click();
    
    // Verify high priority recommendations appear first
    const priorityIndicators = await page.getByTestId('priority-indicator').allTextContents();
    expect(priorityIndicators[0]).toBe('High');
    
    // Sort by priority (low to high)
    await page.getByTestId('sort-select').click();
    await page.getByText('Priority (Low to High)').click();
    
    // Verify low priority recommendations appear first
    const reversedPriorityIndicators = await page.getByTestId('priority-indicator').allTextContents();
    expect(reversedPriorityIndicators[0]).toBe('Low');
  });

  test('should mark recommendations as completed', async ({ page }) => {
    // Navigate to recommendations section
    await page.getByText('Recommendations').click();
    
    // Wait for recommendations component to load
    await page.waitForSelector('[data-testid="recommendations-component"]');
    
    // Get first recommendation
    const firstRecommendation = page.getByTestId('recommendation-item').first();
    
    // Click the complete button
    await firstRecommendation.getByTestId('complete-recommendation').click();
    
    // Verify completion dialog appears
    await expect(page.getByText('Mark as Completed?')).toBeVisible();
    
    // Confirm completion
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify recommendation is marked as completed
    await expect(firstRecommendation.getByTestId('completed-indicator')).toBeVisible();
    
    // Verify completion date is shown
    await expect(firstRecommendation.getByText(/Completed on/)).toBeVisible();
  });
});