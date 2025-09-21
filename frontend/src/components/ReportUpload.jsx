import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import { uploadHealthReport } from '../services/apiService';

const ReportUpload = ({ userId, onReportUploaded }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [reportDate, setReportDate] = useState('');
  const [reportType, setReportType] = useState('comprehensive');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const steps = ['Select File', 'Add Details', 'Upload'];

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      validateFile(event.dataTransfer.files[0]);
    }
  };

  const validateFile = (selectedFile) => {
    // Reset states
    setError(null);
    
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, JPEG, PNG, CSV, or Excel file.');
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate form
      if (!reportDate) {
        setError('Please select a report date');
        return;
      }
      
      setError(null);
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('reportDate', reportDate);
      formData.append('reportType', reportType);
      formData.append('provider', provider);
      
      const response = await uploadHealthReport(formData);
      
      setSuccess(true);
      setActiveStep(3);
      
      // Notify parent component
      if (onReportUploaded) {
        onReportUploaded(response.data);
      }
    } catch (err) {
      console.error('Error uploading report:', err);
      setError(err.response?.data?.message || 'Failed to upload report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReportDate('');
    setReportType('comprehensive');
    setProvider('');
    setActiveStep(0);
    setError(null);
    setSuccess(false);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box 
            sx={{ 
              border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="report-file-input"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx"
            />
            <label htmlFor="report-file-input">
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop or Click to Upload
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Supported formats: PDF, JPEG, PNG, CSV, Excel
              </Typography>
              <Button 
                variant="contained" 
                component="span"
                sx={{ mt: 2 }}
              >
                Select File
              </Button>
            </label>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Report Date"
                  type="date"
                  fullWidth
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="comprehensive">Comprehensive Panel</MenuItem>
                    <MenuItem value="basic">Basic Panel</MenuItem>
                    <MenuItem value="lipid">Lipid Panel</MenuItem>
                    <MenuItem value="metabolic">Metabolic Panel</MenuItem>
                    <MenuItem value="thyroid">Thyroid Panel</MenuItem>
                    <MenuItem value="vitamin">Vitamin Panel</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Healthcare Provider"
                  fullWidth
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g., Quest Diagnostics, LabCorp, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>Selected File:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {file?.name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Ready to Upload
            </Typography>
            <Typography variant="body1" paragraph>
              Please review your information before uploading:
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="body2">
                <strong>File:</strong> {file?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(reportDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Panel
              </Typography>
              {provider && (
                <Typography variant="body2">
                  <strong>Provider:</strong> {provider}
                </Typography>
              )}
            </Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                Upload Report
              </Button>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload Successful!
            </Typography>
            <Typography variant="body1" paragraph>
              Your health report has been uploaded and is being processed. 
              The analysis will be available shortly.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReset}
            >
              Upload Another Report
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Health Report
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          icon={<Error />}
        >
          {error}
        </Alert>
      )}
      
      {renderStepContent(activeStep)}
      
      {activeStep > 0 && activeStep < 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          {activeStep < 2 && (
            <Button 
              variant="contained" 
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
        <Typography variant="caption" color="text.secondary">
          Your health data is encrypted and securely stored. We comply with HIPAA and other 
          healthcare privacy regulations. See our Privacy Policy for more information.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ReportUpload;