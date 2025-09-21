const { test, expect } = require('@playwright/test');

test.describe('Biomarker Analysis Flow', () => {
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

  test('should display biomarker summary with detailed information', async ({ page }) => {
    // Navigate to biomarker summary section
    await page.getByText('Biomarker Summary').click();
    
    // Wait for biomarker summary component to load
    await page.waitForSelector('[data-testid="biomarker-summary-component"]');
    
    // Verify biomarker summary title is displayed
    await expect(page.getByText('Biomarker Summary')).toBeVisible();
    
    // Check for biomarker list
    await expect(page.getByTestId('biomarker-list')).toBeVisible();
    
    // Verify critical biomarkers are highlighted
    const criticalBiomarkers = await page.getByTestId('critical-biomarker').count();
    expect(criticalBiomarkers).toBeGreaterThanOrEqual(0);
    
    // Click on a biomarker to view details
    await page.getByTestId('biomarker-item').first().click();
    
    // Verify biomarker detail dialog opens
    await expect(page.getByTestId('biomarker-detail-dialog')).toBeVisible();
    await expect(page.getByText('Reference Range')).toBeVisible();
    await expect(page.getByText('Historical Values')).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should filter biomarkers by category and status', async ({ page }) => {
    // Navigate to biomarker summary section
    await page.getByText('Biomarker Summary').click();
    
    // Wait for biomarker summary component to load
    await page.waitForSelector('[data-testid="biomarker-summary-component"]');
    
    // Count initial number of biomarkers
    const initialCount = await page.getByTestId('biomarker-item').count();
    
    // Filter by category
    await page.getByTestId('category-filter').click();
    await page.getByText('Lipids').click();
    
    // Verify filtered biomarkers
    const categoryFilteredCount = await page.getByTestId('biomarker-item').count();
    expect(categoryFilteredCount).toBeLessThanOrEqual(initialCount);
    
    // Clear category filter
    await page.getByTestId('clear-category-filter').click();
    
    // Filter by status
    await page.getByTestId('status-filter').click();
    await page.getByText('Critical').click();
    
    // Verify filtered biomarkers
    const statusFilteredCount = await page.getByTestId('biomarker-item').count();
    expect(statusFilteredCount).toBeLessThanOrEqual(initialCount);
    
    // Check that all visible biomarkers have critical status
    const statusLabels = await page.getByTestId('status-label').allTextContents();
    for (const label of statusLabels) {
      expect(label).toBe('Critical');
    }
    
    // Clear all filters
    await page.getByTestId('clear-all-filters').click();
    
    // Verify all biomarkers are shown again
    const resetCount = await page.getByTestId('biomarker-item').count();
    expect(resetCount).toBe(initialCount);
  });

  test('should search for specific biomarkers', async ({ page }) => {
    // Navigate to biomarker summary section
    await page.getByText('Biomarker Summary').click();
    
    // Wait for biomarker summary component to load
    await page.waitForSelector('[data-testid="biomarker-summary-component"]');
    
    // Count initial number of biomarkers
    const initialCount = await page.getByTestId('biomarker-item').count();
    
    // Search for a specific biomarker
    await page.getByTestId('biomarker-search').fill('Glucose');
    await page.keyboard.press('Enter');
    
    // Verify search results
    const searchResultsCount = await page.getByTestId('biomarker-item').count();
    expect(searchResultsCount).toBeLessThanOrEqual(initialCount);
    
    // Check that search results contain the search term
    const biomarkerNames = await page.getByTestId('biomarker-name').allTextContents();
    for (const name of biomarkerNames) {
      expect(name.toLowerCase()).toContain('glucose');
    }
    
    // Clear search
    await page.getByTestId('clear-search').click();
    
    // Verify all biomarkers are shown again
    const resetCount = await page.getByTestId('biomarker-item').count();
    expect(resetCount).toBe(initialCount);
  });

  test('should display biomarker explanations and educational content', async ({ page }) => {
    // Navigate to biomarker summary section
    await page.getByText('Biomarker Summary').click();
    
    // Wait for biomarker summary component to load
    await page.waitForSelector('[data-testid="biomarker-summary-component"]');
    
    // Click on a biomarker to view details
    await page.getByTestId('biomarker-item').first().click();
    
    // Verify biomarker detail dialog opens
    await expect(page.getByTestId('biomarker-detail-dialog')).toBeVisible();
    
    // Check for educational content
    await page.getByRole('tab', { name: 'Learn More' }).click();
    await expect(page.getByTestId('biomarker-education')).toBeVisible();
    await expect(page.getByText('What is this biomarker?')).toBeVisible();
    await expect(page.getByText('Why is it important?')).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });
});