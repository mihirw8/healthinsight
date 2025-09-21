const { test, expect } = require('@playwright/test');

test.describe('Risk Assessment Flow', () => {
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

  test('should display risk assessment with detailed breakdown', async ({ page }) => {
    // Navigate to risk assessment section
    await page.getByText('Risk Assessment').click();
    
    // Wait for risk assessment component to load
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    
    // Verify risk assessment title is displayed
    await expect(page.getByText('Health Risk Assessment')).toBeVisible();
    
    // Check for overall risk score
    await expect(page.getByTestId('overall-risk-score')).toBeVisible();
    
    // Verify risk categories are displayed
    await expect(page.getByText('Cardiovascular Risk')).toBeVisible();
    await expect(page.getByText('Diabetes Risk')).toBeVisible();
    await expect(page.getByText('Nutritional Deficiency Risk')).toBeVisible();
    
    // Click on a risk category to view details
    await page.getByText('Cardiovascular Risk').click();
    
    // Verify risk detail dialog opens
    await expect(page.getByTestId('risk-detail-dialog')).toBeVisible();
    await expect(page.getByText('Contributing Factors')).toBeVisible();
    await expect(page.getByText('Recommended Actions')).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Verify risk factors are displayed
    await expect(page.getByTestId('risk-factors')).toBeVisible();
  });

  test('should highlight urgent action items', async ({ page }) => {
    // Navigate to risk assessment section
    await page.getByText('Risk Assessment').click();
    
    // Wait for risk assessment component to load
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    
    // Check for urgent action notice
    await expect(page.getByTestId('urgent-action-notice')).toBeVisible();
    
    // Verify urgent action items are highlighted
    const urgentItems = await page.getByTestId('urgent-risk-item').count();
    expect(urgentItems).toBeGreaterThan(0);
    
    // Click on an urgent item
    await page.getByTestId('urgent-risk-item').first().click();
    
    // Verify urgent action dialog opens with appropriate content
    await expect(page.getByTestId('risk-detail-dialog')).toBeVisible();
    await expect(page.getByText('Urgent Action Required')).toBeVisible();
    await expect(page.getByText('Medical Consultation')).toBeVisible();
    
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should allow filtering risks by severity', async ({ page }) => {
    // Navigate to risk assessment section
    await page.getByText('Risk Assessment').click();
    
    // Wait for risk assessment component to load
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    
    // Count initial number of risk items
    const initialCount = await page.getByTestId('risk-item').count();
    
    // Filter by high severity
    await page.getByTestId('severity-filter').click();
    await page.getByText('High').click();
    
    // Verify filtered risks
    const filteredCount = await page.getByTestId('risk-item').count();
    expect(filteredCount).toBeLessThan(initialCount);
    
    // Check that all visible risks are high severity
    const severityLabels = await page.getByTestId('severity-label').allTextContents();
    for (const label of severityLabels) {
      expect(label).toBe('High');
    }
    
    // Clear filter
    await page.getByTestId('clear-filters').click();
    
    // Verify all risks are shown again
    const resetCount = await page.getByTestId('risk-item').count();
    expect(resetCount).toBe(initialCount);
  });

  test('should generate and download risk assessment report', async ({ page }) => {
    // Navigate to risk assessment section
    await page.getByText('Risk Assessment').click();
    
    // Wait for risk assessment component to load
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.getByText('Export Report').click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('risk-assessment');
    
    // Verify PDF generation notification appears
    await expect(page.getByText('Report generated successfully')).toBeVisible();
  });

  test('should handle empty risk data gracefully', async ({ page }) => {
    // Mock empty risk data response
    await page.route('**/api/risk-assessment', route => {
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ data: { overallRiskLevel: 'unknown', riskCategories: [] } })
      });
    });
    
    // Navigate to risk assessment section
    await page.getByText('Risk Assessment').click();
    
    // Wait for risk assessment component to load
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    
    // Verify empty state is displayed
    await expect(page.getByText('No risk assessment data available')).toBeVisible();
    await expect(page.getByText('Upload health reports to generate your risk assessment')).toBeVisible();
  });
});