import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Chip, 
  Divider, 
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  FitnessCenter, 
  Restaurant, 
  LocalHospital, 
  Opacity, 
  Favorite, 
  ExpandMore,
  Info
} from '@mui/icons-material';
import { fetchUserRecommendations } from '../services/apiService';

const Recommendations = ({ userId, latestReportId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!userId || !latestReportId) return;
      
      try {
        setLoading(true);
        const response = await fetchUserRecommendations(userId, latestReportId);
        setRecommendations(response.data);
      } catch (err) {
        console.error('Error loading recommendations:', err);
        setError('Failed to load your personalized recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [userId, latestReportId]);

  const getIconForCategory = (category) => {
    switch (category.toLowerCase()) {
      case 'nutrition':
        return <Restaurant />;
      case 'exercise':
        return <FitnessCenter />;
      case 'medical':
        return <LocalHospital />;
      case 'hydration':
        return <Opacity />;
      case 'lifestyle':
        return <Favorite />;
      default:
        return <Info />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleRecommendationClick = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personalized Recommendations
      </Typography>
      
      {recommendations.length > 0 ? (
        <List>
          {recommendations.map((recommendation, index) => (
            <React.Fragment key={recommendation.id || index}>
              <ListItem 
                alignItems="flex-start" 
                button 
                onClick={() => handleRecommendationClick(recommendation)}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                  },
                  borderLeft: `4px solid ${recommendation.priority === 'high' ? '#f44336' : 
                                          recommendation.priority === 'medium' ? '#ff9800' : 
                                          '#4caf50'}`
                }}
              >
                <ListItemIcon>
                  {getIconForCategory(recommendation.category)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="span">
                        {recommendation.title}
                      </Typography>
                      <Chip 
                        label={recommendation.priority} 
                        size="small" 
                        color={getPriorityColor(recommendation.priority)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {recommendation.summary}
                    </Typography>
                  }
                />
              </ListItem>
              {index < recommendations.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No recommendations available yet. Upload more health reports for personalized insights.
          </Typography>
        </Box>
      )}

      {/* Detailed recommendation dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRecommendation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getIconForCategory(selectedRecommendation.category)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedRecommendation.title}
                </Typography>
                <Chip 
                  label={selectedRecommendation.category} 
                  size="small" 
                  sx={{ ml: 'auto' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRecommendation.summary}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Detailed Explanation
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRecommendation.explanation}
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Scientific Basis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    {selectedRecommendation.scientificBasis || 
                      "This recommendation is based on established medical guidelines and research in the field."}
                  </Typography>
                  {selectedRecommendation.references && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">References:</Typography>
                      <List dense>
                        {selectedRecommendation.references.map((reference, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={reference} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Related Biomarkers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedRecommendation.relatedBiomarkers ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedRecommendation.relatedBiomarkers.map((biomarker, idx) => (
                        <Chip key={idx} label={biomarker} size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2">
                      No specific biomarkers associated with this recommendation.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  MEDICAL DISCLAIMER
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This recommendation is generated based on your health data and general medical knowledge. 
                  It is not a substitute for professional medical advice. Always consult with your healthcare 
                  provider before making any changes to your health regimen.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  // In a real app, this would save the recommendation to user's action plan
                  console.log('Adding to action plan:', selectedRecommendation);
                  handleCloseDialog();
                }}
              >
                Add to My Action Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default Recommendations;