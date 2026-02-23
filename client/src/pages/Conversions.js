import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { FaSpinner, FaCheck, FaTimes, FaClock, FaPlay } from 'react-icons/fa';
import { conversionApi } from '../services/api';

const ConversionsContainer = styled.div`
  padding: 40px 0;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #999;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${props => {
    switch(props.status) {
      case 'active': return '#e50914';
      case 'completed': return '#4CAF50';
      case 'failed': return '#f44336';
      default: return '#666';
    }
  }};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const JobList = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
`;

const JobHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 100px 80px;
  gap: 20px;
  padding: 20px;
  background: #222;
  border-bottom: 1px solid #333;
  font-weight: 600;
  color: #ccc;
  font-size: 14px;
`;

const JobItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 100px 80px;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #333;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #222;
  }
`;

const JobInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const JobTitle = styled.div`
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const JobDetails = styled.div`
  font-size: 12px;
  color: #999;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch(props.status) {
      case 'SUBMITTED':
        return `
          background: rgba(229, 9, 20, 0.2);
          color: #e50914;
          border: 1px solid rgba(229, 9, 20, 0.3);
        `;
      case 'PROGRESSING':
        return `
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.3);
        `;
      case 'COMPLETE':
        return `
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        `;
      case 'ERROR':
        return `
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.3);
        `;
      default:
        return `
          background: rgba(102, 102, 102, 0.2);
          color: #666;
          border: 1px solid rgba(102, 102, 102, 0.3);
        `;
    }
  }}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #e50914;
  width: ${props => props.progress || 0}%;
  transition: width 0.3s ease;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #444;
    border-color: #666;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  color: #999;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #666;
`;

function Conversions() {
  const queryClient = useQueryClient();
  const [autoRefresh] = useState(true);

  // Fetch conversion jobs
  const { data: jobs = [], isLoading, error } = useQuery(
    'conversions',
    () => conversionApi.getJobs(),
    {
      refetchInterval: autoRefresh ? 5000 : false, // Poll every 5 seconds
      refetchIntervalInBackground: false,
    }
  );

  // Poll AWS MediaConvert job status for active jobs
  const { data: statusUpdates } = useQuery(
    'jobStatus',
    async () => {
      if (!jobs || jobs.length === 0) return null;
      
      // Get active job IDs (not completed or error)
      const activeJobIds = jobs
        .filter(job => job.status === 'SUBMITTED' || job.status === 'PROGRESSING')
        .map(job => job.jobId);
      
      if (activeJobIds.length === 0) return null;
      
      // Use API service to poll job status
      return conversionApi.pollStatus({ jobIds: activeJobIds });
    },
    {
      refetchInterval: autoRefresh ? 10000 : false, // Poll AWS every 10 seconds
      enabled: jobs && jobs.some(job => job.status === 'SUBMITTED' || job.status === 'PROGRESSING'),
    }
  );

  // Cancel job mutation
  const cancelMutation = useMutation(conversionApi.cancelJob, {
    onSuccess: () => {
      queryClient.invalidateQueries('conversions');
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <FaClock />;
      case 'PROGRESSING':
        return <FaSpinner className="fa-spin" />;
      case 'COMPLETE':
        return <FaCheck />;
      case 'ERROR':
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };

  const getProgress = (job) => {
    // Check if we have real-time status updates from AWS
    if (statusUpdates && statusUpdates.statusUpdates) {
      const statusUpdate = statusUpdates.statusUpdates.find(update => update.jobId === job.jobId);
      if (statusUpdate) {
        return statusUpdate.progress;
      }
    }
    
    // Fallback to static progress based on status
    if (job.status === 'COMPLETE') return 100;
    if (job.status === 'ERROR') return 0;
    if (job.status === 'SUBMITTED') return 10;
    if (job.status === 'PROGRESSING') return 50;
    return 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  // Calculate stats
  const stats = {
    total: jobs.length,
    active: jobs.filter(job => ['SUBMITTED', 'PROGRESSING'].includes(job.status)).length,
    completed: jobs.filter(job => job.status === 'COMPLETE').length,
    failed: jobs.filter(job => job.status === 'ERROR').length,
  };

  if (isLoading) {
    return (
      <ConversionsContainer>
        <Header>
          <Title>Conversion Jobs</Title>
          <Subtitle>Loading conversion status...</Subtitle>
        </Header>
      </ConversionsContainer>
    );
  }

  if (error) {
    return (
      <ConversionsContainer>
        <Header>
          <Title>Conversion Jobs</Title>
          <Subtitle>Error loading conversions: {error.message}</Subtitle>
        </Header>
      </ConversionsContainer>
    );
  }

  return (
    <ConversionsContainer>
      <Header>
        <Title>Conversion Jobs</Title>
        <Subtitle>Monitor your Pixaclara job progress and status</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber status="total">{stats.total}</StatNumber>
          <StatLabel>Total Jobs</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber status="active">{stats.active}</StatNumber>
          <StatLabel>Active</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber status="completed">{stats.completed}</StatNumber>
          <StatLabel>Completed</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber status="failed">{stats.failed}</StatNumber>
          <StatLabel>Failed</StatLabel>
        </StatCard>
      </StatsGrid>

      <JobList>
        <JobHeader>
          <div>Job Details</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Duration</div>
          <div>Actions</div>
        </JobHeader>

        {jobs.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FaPlay />
            </EmptyIcon>
            <EmptyTitle>No Conversion Jobs</EmptyTitle>
            <EmptyText>
              Upload and convert video files to see conversion jobs here.
            </EmptyText>
          </EmptyState>
        ) : (
          jobs.map((job) => (
            <JobItem key={job.jobId}>
              <JobInfo>
                <JobTitle>{job.mediaTitle || 'Untitled Media'}</JobTitle>
                <JobDetails>
                  Job ID: {job.jobId}
                  <br />
                  Started: {formatDate(job.createdAt)}
                </JobDetails>
              </JobInfo>
              
              <StatusBadge status={job.status}>
                {getStatusIcon(job.status)}
                {job.status}
              </StatusBadge>
              
              <div>
                <ProgressBar>
                  <ProgressFill progress={getProgress(job)} />
                </ProgressBar>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {getProgress(job)}%
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#999' }}>
                {formatDuration(job.createdAt, job.completedAt)}
              </div>
              
              <div>
                {job.status === 'SUBMITTED' || job.status === 'PROGRESSING' ? (
                  <ActionButton
                    onClick={() => cancelMutation.mutate(job.jobId)}
                    disabled={cancelMutation.isLoading}
                  >
                    Cancel
                  </ActionButton>
                ) : (
                  <ActionButton disabled>
                    -
                  </ActionButton>
                )}
              </div>
            </JobItem>
          ))
        )}
      </JobList>
    </ConversionsContainer>
  );
}

export default Conversions;
