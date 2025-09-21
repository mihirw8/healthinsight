import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Avatar, 
  Chip, 
  Grid,
  Button
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Warning,
  CalendarToday
} from '@mui/icons-material';

const WelcomeSummary = ({ user, latestReport }) => {
  if (!user) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Welcome to Health Insights</Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Please log in to view your personalized health dashboard.
        </Typography>
      </Paper>
    );
  }

  // Calculate days since last report
  const daysSinceLastReport = latestReport ? 
    Math.floor((new Date() - new Date(latestReport.date)) / (1000 * 60 * 60 * 24)) : 
    null;

  // Determine overall health status based on critical biomarkers
  const getHealthStatus = () => {
    if (!latestReport) return { text: 'Unknown', color: 'default', icon: null };
    
    const criticalBiomarkers = latestReport.biomarkerValues.filter(bv => 
      bv.status === 'critical_high' || bv.status === 'critical_low'
    );
    
    const abnormalBiomarkers = latestReport.biomarkerValues.filter(bv => 
      bv.status === 'high' || bv.status === 'low'
    );
    
    if (criticalBiomarkers.length > 0) {
      return { 
        text: 'Needs Attention', 
        color: 'error', 
        icon: <Warning fontSize="small" />
      };
    } else if (abnormalBiomarkers.length > 0) {
      return { 
        text: 'Monitor', 
        color: 'warning', 
        icon: <TrendingDown fontSize="small" />
      };
    } else {
      return { 
        text: 'Good', 
        color: 'success', 
        icon: <CheckCircle fontSize="small" />
      };
    }
  };

  const healthStatus = getHealthStatus();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar 
            src={user.profileImage} 
            alt={user.name}
            sx={{ width: 64, height: 64 }}
          />
        </Grid>
        
        <Grid item xs>
          <Typography variant="h5">
            Welcome back, {user.firstName || user.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
            {latestReport && (
              <>
                <Chip 
                  icon={healthStatus.icon}
                  label={`Health Status: ${healthStatus.text}`}
                  color={healthStatus.color}
                  size="small"
                />
                
                <Chip
                  icon={<CalendarToday fontSize="small" />}
                  label={`Last Report: ${new Date(latestReport.date).toLocaleDateString()}`}
                  variant="outlined"
                  size="small"
                />
                
                {latestReport.insights && latestReport.insights.trend && (
                  <Chip
                    icon={latestReport.insights.trend === 'improving' ? 
                      <TrendingUp fontSize="small" /> : 
                      <TrendingDown fontSize="small" />
                    }
                    label={`Overall Trend: ${latestReport.insights.trend.charAt(0).toUpperCase() + latestReport.insights.trend.slice(1)}`}
                    color={latestReport.insights.trend === 'improving' ? 'success' : 'warning'}
                    size="small"
                  />
                )}
              </>
            )}
          </Box>
        </Grid>
        
        <Grid item>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => {
              // In a real app, this would navigate to the user profile
              console.log('Navigate to profile');
            }}
          >
            View Profile
          </Button>
        </Grid>
      </Grid>
      
      {latestReport ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1">
            {latestReport.insights?.summary || 
              "Here's a summary of your latest health report. Review your biomarkers, trends, and recommendations for a comprehensive understanding of your health status."}
          </Typography>
          
          {daysSinceLastReport !== null && daysSinceLastReport > 180 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Your last health report was {daysSinceLastReport} days ago. Consider uploading a more recent report for up-to-date insights.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 3, textAlign: 'center', py: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No health reports found. Upload your first report to get personalized insights.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => {
              // In a real app, this would scroll to the upload section
              document.getElementById('report-upload-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Upload Report
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WelcomeSummary;