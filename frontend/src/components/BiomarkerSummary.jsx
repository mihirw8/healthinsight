import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Skeleton
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const BiomarkerSummary = ({ biomarkers, loading }) => {
  // Get the most critical biomarkers to highlight
  const getCriticalBiomarkers = () => {
    if (!biomarkers || biomarkers.length === 0) return [];
    
    return biomarkers
      .filter(b => b.status === 'critical_high' || b.status === 'critical_low')
      .slice(0, 3); // Show top 3 critical biomarkers
  };

  // Get status icon and color based on biomarker status
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'normal':
        return { icon: <CheckCircleIcon fontSize="small" />, color: 'success', text: 'Normal' };
      case 'high':
        return { icon: <ArrowUpwardIcon fontSize="small" />, color: 'warning', text: 'High' };
      case 'low':
        return { icon: <ArrowDownwardIcon fontSize="small" />, color: 'warning', text: 'Low' };
      case 'critical_high':
        return { icon: <ErrorIcon fontSize="small" />, color: 'error', text: 'Critical High' };
      case 'critical_low':
        return { icon: <ErrorIcon fontSize="small" />, color: 'error', text: 'Critical Low' };
      default:
        return { icon: <WarningIcon fontSize="small" />, color: 'info', text: 'Unknown' };
    }
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!biomarkers || biomarkers.length === 0) {
      return { total: 0, normal: 0, abnormal: 0, critical: 0 };
    }

    const total = biomarkers.length;
    const normal = biomarkers.filter(b => b.status === 'normal').length;
    const critical = biomarkers.filter(b => 
      b.status === 'critical_high' || b.status === 'critical_low'
    ).length;
    const abnormal = total - normal - critical;

    return { total, normal, abnormal, critical };
  };

  const stats = getSummaryStats();
  const criticalBiomarkers = getCriticalBiomarkers();

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Biomarker Summary
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="40%" height={30} />
        </Box>
        <Skeleton variant="rectangular" height={200} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Biomarker Summary
      </Typography>
      
      {biomarkers && biomarkers.length > 0 ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${stats.total} Total`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={`${stats.normal} Normal`} 
              color="success" 
              variant={stats.normal > 0 ? "default" : "outlined"} 
            />
            <Chip 
              label={`${stats.abnormal} Abnormal`} 
              color="warning" 
              variant={stats.abnormal > 0 ? "default" : "outlined"} 
            />
            <Chip 
              label={`${stats.critical} Critical`} 
              color="error" 
              variant={stats.critical > 0 ? "default" : "outlined"} 
            />
          </Box>

          {criticalBiomarkers.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Critical Biomarkers Requiring Attention:
              </Typography>
              {criticalBiomarkers.map((biomarker, index) => {
                const status = getStatusDisplay(biomarker.status);
                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {status.icon}
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      <strong>{biomarker.biomarker.name}:</strong> {biomarker.value} {biomarker.biomarker.unit} 
                      {biomarker.referenceMin && biomarker.referenceMax && 
                        ` (Reference: ${biomarker.referenceMin}-${biomarker.referenceMax})`
                      }
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Biomarker</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Reference Range</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {biomarkers.slice(0, 5).map((biomarker, index) => {
                  const status = getStatusDisplay(biomarker.status);
                  return (
                    <TableRow key={index}>
                      <TableCell>{biomarker.biomarker.name}</TableCell>
                      <TableCell align="right">{biomarker.value} {biomarker.biomarker.unit}</TableCell>
                      <TableCell align="right">
                        {biomarker.referenceMin && biomarker.referenceMax ? 
                          `${biomarker.referenceMin}-${biomarker.referenceMax}` : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          size="small"
                          label={status.text}
                          color={status.color}
                          icon={status.icon}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {biomarkers.length > 5 && (
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'right' }}>
              Showing 5 of {biomarkers.length} biomarkers
            </Typography>
          )}
        </>
      ) : (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No biomarker data available. Upload a health report to see your biomarker summary.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default BiomarkerSummary;