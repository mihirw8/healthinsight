const { test, expect } = require('@playwright/test');

test.describe('Health Trends Analysis Flow', () => {
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

  test('should display health trends and allow filtering by biomarker', async ({ page }) => {
    // Navigate to health trends section
    await page.getByText('Health Trends').click();
    
    // Wait for trends component to load
    await page.waitForSelector('[data-testid="health-trends-component"]');
    
    // Verify default view shows trends
    await expect(page.getByText('Your Health Trends')).toBeVisible();
    await expect(page.getByTestId('trends-chart')).toBeVisible();
    
    // Select a specific biomarker
    await page.getByTestId('biomarker-select').click();
    await page.getByText('Glucose').click();
    
    // Verify chart updates to show selected biomarker
    await expect(page.getByText('Glucose Trend')).toBeVisible();
    
    // Change time range
    await page.getByTestId('time-range-select').click();
    await page.getByText('Last 6 Months').click();
    
    // Verify chart updates with new time range
    await expect(page.getByText('Last 6 Months')).toBeVisible();
    
    // Check for reference range indicators
    await expect(page.getByText('Normal Range')).toBeVisible();
    
    // Verify trend information is displayed
    await expect(page.getByTestId('trend-info')).toBeVisible();
  });

  test('should handle empty trend data gracefully', async ({ page }) => {
    // Mock empty trend data response
    await page.route('**/api/trends', route => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [] })
      });
    });
    
    // Navigate to health trends section
    await page.getByText('Health Trends').click();
    
    // Wait for trends component to load
    await page.waitForSelector('[data-testid="health-trends-component"]');
    
    // Verify empty state is displayed
    await expect(page.getByText('No trend data available')).toBeVisible();
    await expect(page.getByText('Upload health reports to see your trends over time')).toBeVisible();
  });

  test('should allow comparison between multiple biomarkers', async ({ page }) => {
    // Navigate to health trends section
    await page.getByText('Health Trends').click();
    
    // Wait for trends component to load
    await page.waitForSelector('[data-testid="health-trends-component"]');
    
    // Enable comparison mode
    await page.getByText('Compare Biomarkers').click();
    
    // Select multiple biomarkers
    await page.getByTestId('biomarker-multi-select').click();
    await page.getByText('Glucose').click();
    await page.getByText('Cholesterol').click();
    await page.getByText('Vitamin D').click();
    await page.keyboard.press('Escape');
    
    // Verify comparison chart is displayed
    await expect(page.getByTestId('comparison-chart')).toBeVisible();
    
    // Verify legend shows all selected biomarkers
    await expect(page.getByText('Glucose')).toBeVisible();
    await expect(page.getByText('Cholesterol')).toBeVisible();
    await expect(page.getByText('Vitamin D')).toBeVisible();
    
    // Check correlation information is displayed
    await expect(page.getByText('Correlation Analysis')).toBeVisible();
  });

  test('should export trend data to PDF', async ({ page }) => {
    // Navigate to health trends section
    await page.getByText('Health Trends').click();
    
    // Wait for trends component to load
    await page.waitForSelector('[data-testid="health-trends-component"]');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.getByText('Export Report').click();
    await page.getByText('PDF').click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('health-trends');
  });
});