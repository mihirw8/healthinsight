import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box, CircularProgress } from '@mui/material';
import BiomarkerSummary from './BiomarkerSummary';
import HealthTrends from './HealthTrends';
import RecommendationList from './RecommendationList';
import RiskAssessment from './RiskAssessment';
import UploadReport from './UploadReport';
import { fetchUserData, fetchLatestReport } from '../services/apiService';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, we would get the userId from authentication context
        const userId = '1'; // Placeholder
        const userResponse = await fetchUserData(userId);
        const reportResponse = await fetchLatestReport(userId);
        
        setUserData(userResponse.data);
        setLatestReport(reportResponse.data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load your health data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading your health insights...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome and Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {userData?.firstName || 'User'}
            </Typography>
            <Typography variant="body1">
              {latestReport 
                ? `Your latest health report was analyzed on ${new Date(latestReport.date).toLocaleDateString()}.` 
                : 'Upload your first health report to get personalized insights.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Upload Report Section */}
        <Grid item xs={12} md={6}>
          <UploadReport onUploadSuccess={() => window.location.reload()} />
        </Grid>

        {/* Biomarker Summary */}
        <Grid item xs={12} md={6}>
          <BiomarkerSummary 
            biomarkers={latestReport?.biomarkerValues || []} 
            loading={!latestReport}
          />
        </Grid>

        {/* Health Trends */}
        <Grid item xs={12}>
          <HealthTrends userId={userData?.id} />
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={8}>
          <RecommendationList userId={userData?.id} />
        </Grid>

        {/* Risk Assessment */}
        <Grid item xs={12} md={4}>
          <RiskAssessment userId={userData?.id} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;