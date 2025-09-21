import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchUserBiomarkerHistory } from '../services/apiService';

const HealthTrends = ({ userId }) => {
  const [biomarkerOptions, setBiomarkerOptions] = useState([]);
  const [selectedBiomarkers, setSelectedBiomarkers] = useState([]);
  const [timeRange, setTimeRange] = useState('6m'); // 6m, 1y, all
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for different biomarkers
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];

  useEffect(() => {
    const loadBiomarkerOptions = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch the available biomarkers for this user
        const response = await fetchUserBiomarkerHistory(userId);
        
        // Extract unique biomarkers
        const uniqueBiomarkers = [...new Set(response.data.flatMap(report => 
          report.biomarkerValues.map(bv => bv.biomarker.name)
        ))];
        
        setBiomarkerOptions(uniqueBiomarkers);
        
        // Select first two biomarkers by default if available
        if (uniqueBiomarkers.length > 0) {
          setSelectedBiomarkers([uniqueBiomarkers[0]]);
          if (uniqueBiomarkers.length > 1) {
            setSelectedBiomarkers([uniqueBiomarkers[0], uniqueBiomarkers[1]]);
          }
        }
        
        // Process data for chart
        processChartData(response.data, selectedBiomarkers, timeRange);
      } catch (err) {
        console.error('Error loading biomarker history:', err);
        setError('Failed to load your health trends. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadBiomarkerOptions();
    }
  }, [userId]);

  useEffect(() => {
    const loadChartData = async () => {
      if (!userId || selectedBiomarkers.length === 0) return;
      
      try {
        setLoading(true);
        const response = await fetchUserBiomarkerHistory(userId);
        processChartData(response.data, selectedBiomarkers, timeRange);
      } catch (err) {
        console.error('Error loading biomarker history:', err);
        setError('Failed to load your health trends. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [userId, selectedBiomarkers, timeRange]);

  const processChartData = (reports, biomarkers, range) => {
    if (!reports || reports.length === 0) {
      setChartData([]);
      return;
    }

    // Sort reports by date
    const sortedReports = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Filter by time range
    const filteredReports = filterByTimeRange(sortedReports, range);
    
    // Transform data for chart
    const chartData = filteredReports.map(report => {
      const dataPoint = {
        date: new Date(report.date).toLocaleDateString(),
        timestamp: new Date(report.date).getTime(),
      };
      
      // Add biomarker values
      report.biomarkerValues.forEach(bv => {
        if (biomarkers.includes(bv.biomarker.name)) {
          dataPoint[bv.biomarker.name] = bv.value;
          dataPoint[`${bv.biomarker.name}_min`] = bv.referenceMin;
          dataPoint[`${bv.biomarker.name}_max`] = bv.referenceMax;
          dataPoint[`${bv.biomarker.name}_unit`] = bv.biomarker.unit;
        }
      });
      
      return dataPoint;
    });
    
    setChartData(chartData);
  };

  const filterByTimeRange = (reports, range) => {
    if (range === 'all') return reports;
    
    const now = new Date();
    let cutoffDate;
    
    if (range === '6m') {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
    } else if (range === '1y') {
      cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }
    
    return reports.filter(report => new Date(report.date) >= cutoffDate);
  };

  const handleBiomarkerChange = (event) => {
    setSelectedBiomarkers(event.target.value);
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => {
            // Skip reference range entries
            if (entry.dataKey.includes('_min') || entry.dataKey.includes('_max')) return null;
            
            const biomarkerName = entry.dataKey;
            const value = entry.value;
            const unit = payload.find(p => p.dataKey === biomarkerName)?.payload[`${biomarkerName}_unit`] || '';
            const min = payload.find(p => p.dataKey === biomarkerName)?.payload[`${biomarkerName}_min`];
            const max = payload.find(p => p.dataKey === biomarkerName)?.payload[`${biomarkerName}_max`];
            
            let status = 'Normal';
            let color = 'success.main';
            
            if (min !== undefined && max !== undefined) {
              if (value < min) {
                status = 'Low';
                color = 'warning.main';
              } else if (value > max) {
                status = 'High';
                color = 'warning.main';
              }
              
              // Check for critical values (20% beyond reference range)
              const lowCritical = min - (min * 0.2);
              const highCritical = max + (max * 0.2);
              
              if (value <= lowCritical) {
                status = 'Critical Low';
                color = 'error.main';
              } else if (value >= highCritical) {
                status = 'Critical High';
                color = 'error.main';
              }
            }
            
            return (
              <Box key={index} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: entry.color }}>
                  {biomarkerName}: <strong>{value} {unit}</strong>
                </Typography>
                {min !== undefined && max !== undefined && (
                  <Typography variant="caption" sx={{ display: 'block', color }}>
                    Status: {status} (Reference: {min}-{max})
                  </Typography>
                )}
              </Box>
            );
          })}
        </Paper>
      );
    }
    return null;
  };

  if (loading && !chartData.length) {
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
        Health Trends
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="biomarker-select-label">Biomarkers</InputLabel>
          <Select
            labelId="biomarker-select-label"
            id="biomarker-select"
            multiple
            value={selectedBiomarkers}
            onChange={handleBiomarkerChange}
            label="Biomarkers"
            renderValue={(selected) => selected.join(', ')}
          >
            {biomarkerOptions.map((biomarker) => (
              <MenuItem key={biomarker} value={biomarker}>
                {biomarker}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          aria-label="time range"
        >
          <ToggleButton value="6m" aria-label="6 months">
            6 Months
          </ToggleButton>
          <ToggleButton value="1y" aria-label="1 year">
            1 Year
          </ToggleButton>
          <ToggleButton value="all" aria-label="all time">
            All Time
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {chartData.length > 0 ? (
        <Box sx={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {selectedBiomarkers.map((biomarker, index) => {
                // Find a data point with reference ranges for this biomarker
                const dataPointWithRefs = chartData.find(point => 
                  point[`${biomarker}_min`] !== undefined && 
                  point[`${biomarker}_max`] !== undefined
                );
                
                return (
                  <React.Fragment key={biomarker}>
                    <Line
                      type="monotone"
                      dataKey={biomarker}
                      stroke={colors[index % colors.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    
                    {/* Reference lines for min/max if available */}
                    {dataPointWithRefs && (
                      <>
                        <ReferenceLine 
                          y={dataPointWithRefs[`${biomarker}_min`]} 
                          stroke={colors[index % colors.length]} 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.6}
                          label={{ 
                            value: `Min: ${dataPointWithRefs[`${biomarker}_min`]}`, 
                            position: 'insideBottomLeft',
                            fill: colors[index % colors.length],
                            fontSize: 10
                          }}
                        />
                        <ReferenceLine 
                          y={dataPointWithRefs[`${biomarker}_max`]} 
                          stroke={colors[index % colors.length]} 
                          strokeDasharray="3 3"
                          strokeOpacity={0.6}
                          label={{ 
                            value: `Max: ${dataPointWithRefs[`${biomarker}_max`]}`, 
                            position: 'insideTopLeft',
                            fill: colors[index % colors.length],
                            fontSize: 10
                          }}
                        />
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No trend data available. Please select biomarkers or upload more health reports.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default HealthTrends;