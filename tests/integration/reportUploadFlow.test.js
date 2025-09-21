const { test, expect } = require('@playwright/test');

test.describe('Health Report Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Login if needed (assuming we have a login mechanism)
    await page.getByTestId('profile-button').click();
    await page.getByText('Login').click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-component"]');
  });

  test('should upload a health report and display results', async ({ page }) => {
    // Navigate to report upload section
    await page.getByText('Upload New Report').click();
    
    // Step 1: Select file
    const filePath = './test-data/sample-health-report.pdf';
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Step 2: Confirm file details
    await expect(page.getByText('File selected:')).toBeVisible();
    await expect(page.getByText('sample-health-report.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Step 3: Add additional information
    await page.getByLabel('Report Date').fill('2023-06-01');
    await page.getByLabel('Laboratory').fill('Test Lab');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Wait for processing to complete
    await page.waitForSelector('[data-testid="upload-success"]');
    await expect(page.getByText('Report uploaded successfully')).toBeVisible();
    
    // Verify that biomarker data is displayed
    await page.waitForSelector('[data-testid="biomarker-summary-component"]');
    await expect(page.getByText('Biomarker Summary')).toBeVisible();
    
    // Verify that recommendations are generated
    await page.waitForSelector('[data-testid="recommendations-component"]');
    await expect(page.getByText('Personalized Recommendations')).toBeVisible();
    
    // Verify that risk assessment is displayed
    await page.waitForSelector('[data-testid="risk-assessment-component"]');
    await expect(page.getByText('Health Risk Assessment')).toBeVisible();
  });

  test('should handle invalid file upload', async ({ page }) => {
    // Navigate to report upload section
    await page.getByText('Upload New Report').click();
    
    // Try to upload an invalid file
    const invalidFilePath = './test-data/invalid-file.txt';
    await page.setInputFiles('input[type="file"]', invalidFilePath);
    
    // Verify error message is displayed
    await expect(page.getByText('Invalid file format')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  test('should handle server errors during upload', async ({ page }) => {
    // Navigate to report upload section
    await page.getByText('Upload New Report').click();
    
    // Mock a server error response
    await page.route('**/api/reports/upload', route => {
      return route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Select file and try to upload
    const filePath = './test-data/sample-health-report.pdf';
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Complete form and submit
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Report Date').fill('2023-06-01');
    await page.getByLabel('Laboratory').fill('Test Lab');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Verify error message is displayed
    await expect(page.getByText('Error uploading report')).toBeVisible();
    await expect(page.getByText('Please try again later')).toBeVisible();
  });
});