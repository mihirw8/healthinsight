import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Favorite, 
  LocalHospital,
  Warning,
  Info
} from '@mui/icons-material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { fetchUserRiskAssessment } from '../services/apiService';

const RiskAssessment = ({ userId, latestReportId }) => {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadRiskAssessment = async () => {
      if (!userId || !latestReportId) return;
      
      try {
        setLoading(true);
        const response = await fetchUserRiskAssessment(userId, latestReportId);
        
        // Transform data for radar chart
        const formattedData = response.data.risks.map(risk => ({
          subject: risk.name,
          risk: risk.score * 100, // Convert to percentage
          fullMark: 100,
          details: risk.details,
          contributingFactors: risk.contributingFactors,
          recommendations: risk.recommendations
        }));
        
        setRiskData(formattedData);
      } catch (err) {
        console.error('Error loading risk assessment:', err);
        setError('Failed to load your risk assessment. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadRiskAssessment();
  }, [userId, latestReportId]);

  const handleRiskClick = (risk) => {
    setSelectedRisk(risk);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const getRiskLevel = (score) => {
    if (score <= 25) return { text: 'Low', color: '#4caf50' };
    if (score <= 50) return { text: 'Moderate', color: '#ff9800' };
    if (score <= 75) return { text: 'High', color: '#f44336' };
    return { text: 'Very High', color: '#d32f2f' };
  };

  const getRiskIcon = (score) => {
    if (score <= 25) return <Favorite color="success" />;
    if (score <= 50) return <Info color="warning" />;
    if (score <= 75) return <Warning color="error" />;
    return <LocalHospital sx={{ color: '#d32f2f' }} />;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Health Risk Assessment
      </Typography>
      
      {riskData.length > 0 ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Box sx={{ height: 400, width: '100%' }}>
              <ResponsiveContainer>
                <RadarChart outerRadius={90} data={riskData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Risk Score"
                    dataKey="risk"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    onClick={(data) => handleRiskClick(data)}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Summary
            </Typography>
            
            <List>
              {riskData.map((risk, index) => {
                const riskLevel = getRiskLevel(risk.risk);
                
                return (
                  <React.Fragment key={risk.subject}>
                    <ListItem 
                      button 
                      onClick={() => handleRiskClick(risk)}
                      sx={{ 
                        borderLeft: `4px solid ${riskLevel.color}`,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <Box sx={{ mr: 2 }}>
                        {getRiskIcon(risk.risk)}
                      </Box>
                      <ListItemText
                        primary={risk.subject}
                        secondary={
                          <Typography variant="body2" component="span">
                            Risk Level: <strong>{riskLevel.text}</strong> ({Math.round(risk.risk)}%)
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < riskData.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Click on any risk for detailed information
              </Typography>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No risk assessment data available. Please upload more comprehensive health reports.
          </Typography>
        </Box>
      )}
      
      {/* Risk detail dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRisk && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getRiskIcon(selectedRisk.risk)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedRisk.subject} Risk Assessment
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Risk Level: {getRiskLevel(selectedRisk.risk).text} ({Math.round(selectedRisk.risk)}%)
                </Typography>
                <Typography variant="body1">
                  {selectedRisk.details || 'No detailed information available for this risk assessment.'}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Contributing Factors
              </Typography>
              {selectedRisk.contributingFactors ? (
                <List dense>
                  {selectedRisk.contributingFactors.map((factor, idx) => (
                    <ListItem key={idx}>
                      <ListItemText 
                        primary={factor.name} 
                        secondary={factor.description} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific contributing factors identified.
                </Typography>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recommended Actions
                </Typography>
                {selectedRisk.recommendations ? (
                  <List dense>
                    {selectedRisk.recommendations.map((rec, idx) => (
                      <ListItem key={idx}>
                        <ListItemText 
                          primary={rec.title} 
                          secondary={rec.description} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific recommendations available.
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  MEDICAL DISCLAIMER
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This risk assessment is based on your health data and statistical models. It is not a 
                  diagnosis and should not replace professional medical advice. Always consult with your 
                  healthcare provider to interpret these results and determine appropriate actions.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  // In a real app, this would schedule a consultation
                  console.log('Scheduling consultation for:', selectedRisk.subject);
                  handleCloseDialog();
                }}
              >
                Schedule Consultation
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default RiskAssessment;