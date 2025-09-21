import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReportUpload from '../../src/components/ReportUpload';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as apiService from '../../src/services/apiService';

// Mock the API service
jest.mock('../../src/services/apiService', () => ({
  uploadHealthReport: jest.fn(),
  validateReportFormat: jest.fn()
}));

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

describe('ReportUpload Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    apiService.validateReportFormat.mockResolvedValue({ valid: true });
    apiService.uploadHealthReport.mockResolvedValue({ success: true, reportId: '123' });
  });

  test('renders initial upload state correctly', () => {
    renderWithTheme(<ReportUpload />);
    
    expect(screen.getByText(/Upload Health Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your health report file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    renderWithTheme(<ReportUpload />);
    
    const file = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    
    await userEvent.upload(fileInput, file);
    
    expect(screen.getByText(/test-report.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/Next/i)).toBeInTheDocument();
  });

  test('validates file type', async () => {
    renderWithTheme(<ReportUpload />);
    
    const invalidFile = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('file-input');
    
    await userEvent.upload(fileInput, invalidFile);
    
    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });

  test('validates file size', async () => {
    renderWithTheme(<ReportUpload />);
    
    // Create a mock large file (11MB)
    const largeFileContent = new ArrayBuffer(11 * 1024 * 1024);
    const largeFile = new File([largeFileContent], 'large-report.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    
    await userEvent.upload(fileInput, largeFile);
    
    expect(screen.getByText(/File size exceeds the 10MB limit/i)).toBeInTheDocument();
  });

  test('progresses through upload steps', async () => {
    renderWithTheme(<ReportUpload />);
    
    // Step 1: Select file
    const file = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, file);
    
    // Click Next button
    const nextButton = screen.getByText(/Next/i);
    userEvent.click(nextButton);
    
    // Step 2: Confirm details
    await waitFor(() => {
      expect(screen.getByText(/Confirm Report Details/i)).toBeInTheDocument();
    });
    
    // Fill in report details
    const reportDateInput = screen.getByLabelText(/Report Date/i);
    userEvent.clear(reportDateInput);
    userEvent.type(reportDateInput, '2023-06-15');
    
    const labNameInput = screen.getByLabelText(/Lab Name/i);
    userEvent.type(labNameInput, 'Test Lab');
    
    // Click Submit button
    const submitButton = screen.getByText(/Submit/i);
    userEvent.click(submitButton);
    
    // Step 3: Processing
    await waitFor(() => {
      expect(screen.getByText(/Processing Your Report/i)).toBeInTheDocument();
    });
    
    // Verify API was called
    expect(apiService.uploadHealthReport).toHaveBeenCalledWith(
      expect.any(FormData),
      expect.objectContaining({
        reportDate: '2023-06-15',
        labName: 'Test Lab'
      })
    );
    
    // Step 4: Success
    await waitFor(() => {
      expect(screen.getByText(/Upload Successful/i)).toBeInTheDocument();
      expect(screen.getByText(/Your health report has been processed/i)).toBeInTheDocument();
    });
  });

  test('handles upload errors', async () => {
    // Mock API error
    apiService.uploadHealthReport.mockRejectedValue(new Error('Upload failed'));
    
    renderWithTheme(<ReportUpload />);
    
    // Step 1: Select file
    const file = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, file);
    
    // Click Next button
    const nextButton = screen.getByText(/Next/i);
    userEvent.click(nextButton);
    
    // Step 2: Confirm details
    await waitFor(() => {
      expect(screen.getByText(/Confirm Report Details/i)).toBeInTheDocument();
    });
    
    // Click Submit button
    const submitButton = screen.getByText(/Submit/i);
    userEvent.click(submitButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/Error: Upload failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });
  });

  test('allows going back to previous steps', async () => {
    renderWithTheme(<ReportUpload />);
    
    // Step 1: Select file
    const file = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, file);
    
    // Click Next button
    const nextButton = screen.getByText(/Next/i);
    userEvent.click(nextButton);
    
    // Step 2: Confirm details
    await waitFor(() => {
      expect(screen.getByText(/Confirm Report Details/i)).toBeInTheDocument();
    });
    
    // Click Back button
    const backButton = screen.getByText(/Back/i);
    userEvent.click(backButton);
    
    // Should be back at Step 1
    await waitFor(() => {
      expect(screen.getByText(/Drag and drop your health report file here/i)).toBeInTheDocument();
      expect(screen.getByText(/test-report.pdf/i)).toBeInTheDocument();
    });
  });

  test('displays medical disclaimer', () => {
    renderWithTheme(<ReportUpload />);
    
    expect(screen.getByTestId('medical-disclaimer')).toBeInTheDocument();
    expect(screen.getByText(/This tool is not intended to replace professional medical advice/i)).toBeInTheDocument();
  });
});