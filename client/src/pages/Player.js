import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { FaArrowLeft, FaPlay, FaClock, FaCalendarAlt, FaTag } from 'react-icons/fa';
import VideoPlayer from '../components/VideoPlayer';
import { api } from '../services/api';

const PlayerContainer = styled.div`
  min-height: 100vh;
  background-color: #000;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
  z-index: 100;
  padding: 20px;
`;

const BackButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const VideoSection = styled.section`
  padding-top: 80px;
  background-color: #000;
`;

const VideoContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const InfoSection = styled.section`
  background-color: #0a0a0a;
  padding: 40px 0;
`;

const InfoContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const MediaInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 40px;
  align-items: start;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const MainInfo = styled.div`
  color: white;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 16px;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 24px;
`;

const Genre = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #333;
  color: #999;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const Sidebar = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #333;
`;

const SidebarTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: white;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FileInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FileInfoLabel = styled.span`
  color: #999;
  font-size: 14px;
`;

const FileInfoValue = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #999;
  font-size: 18px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #e50914;
  text-align: center;
  padding: 40px 20px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #999;
  margin-bottom: 24px;
`;

function Player() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: media, isLoading, error } = useQuery(
    ['media', id],
    () => api.getMediaById(id),
    {
      enabled: !!id
    }
  );

  const { data: streamData } = useQuery(
    ['stream', id],
    () => api.getStreamUrl(id),
    {
      enabled: !!id && !!media
    }
  );

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <PlayerContainer>
        <LoadingContainer>Loading media...</LoadingContainer>
      </PlayerContainer>
    );
  }

  if (error || !media) {
    return (
      <PlayerContainer>
        <ErrorContainer>
          <ErrorTitle>Media Not Found</ErrorTitle>
          <ErrorMessage>
            The media you're looking for doesn't exist or has been removed.
          </ErrorMessage>
          <BackButton onClick={() => navigate('/library')}>
            <FaArrowLeft />
            Back to Library
          </BackButton>
        </ErrorContainer>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Back
        </BackButton>
      </Header>

      <VideoSection>
        <VideoContainer>
          <VideoPlayer
            src={streamData?.stream_url}
            poster={media.thumbnail_path}
            title={media.title}
          />
        </VideoContainer>
      </VideoSection>

      <InfoSection>
        <InfoContainer>
          <MediaInfo>
            <MainInfo>
              <Title>{media.title}</Title>
              
              <MetaInfo>
                {media.year && (
                  <MetaItem>
                    <FaCalendarAlt />
                    {media.year}
                  </MetaItem>
                )}
                
                {media.duration && (
                  <MetaItem>
                    <FaClock />
                    {formatDuration(media.duration)}
                  </MetaItem>
                )}
                
                {media.genre && (
                  <MetaItem>
                    <FaTag />
                    {media.genre}
                  </MetaItem>
                )}
              </MetaInfo>
              
              {media.description && (
                <Description>{media.description}</Description>
              )}
              
              {media.genre && (
                <Genre>
                  <FaTag />
                  {media.genre}
                </Genre>
              )}
            </MainInfo>
            
            <Sidebar>
              <SidebarTitle>File Information</SidebarTitle>
              <FileInfo>
                <FileInfoItem>
                  <FileInfoLabel>File Size</FileInfoLabel>
                  <FileInfoValue>{formatFileSize(media.file_size)}</FileInfoValue>
                </FileInfoItem>
                
                <FileInfoItem>
                  <FileInfoLabel>Format</FileInfoLabel>
                  <FileInfoValue>{media.mime_type ? media.mime_type.split('/')[1].toUpperCase() : 'Unknown'}</FileInfoValue>
                </FileInfoItem>
                
                <FileInfoItem>
                  <FileInfoLabel>Added</FileInfoLabel>
                  <FileInfoValue>{formatDate(media.created_at)}</FileInfoValue>
                </FileInfoItem>
                
                <FileInfoItem>
                  <FileInfoLabel>Last Updated</FileInfoLabel>
                  <FileInfoValue>{formatDate(media.updated_at)}</FileInfoValue>
                </FileInfoItem>
              </FileInfo>
            </Sidebar>
          </MediaInfo>
        </InfoContainer>
      </InfoSection>
    </PlayerContainer>
  );
}

export default Player;
