import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlay, FaClock, FaCalendarAlt } from 'react-icons/fa';

const CardContainer = styled(Link)`
  display: block;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;
  border: 1px solid #333;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    border-color: #555;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  background-color: #333;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #333 0%, #555 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 48px;
`;

const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`;

const PlayButton = styled.div`
  width: 60px;
  height: 60px;
  background-color: rgba(229, 9, 20, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  transition: transform 0.2s ease;
  
  ${PlayOverlay}:hover & {
    transform: scale(1.1);
  }
`;

const Content = styled.div`
  padding: 16px;
  border-radius: 0 0 8px 8px;
  background-color: #1a1a1a;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Description = styled.p`
  font-size: 14px;
  color: #999;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #666;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Genre = styled.span`
  background-color: #333;
  color: #999;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

function MediaCard({ media }) {
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

  return (
    <CardContainer to={`/player/${media.id}`}>
      <ImageContainer>
        {media.thumbnail_path ? (
          <Thumbnail 
            src={media.thumbnail_path} 
            alt={media.title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <PlaceholderImage style={{ display: media.thumbnail_path ? 'none' : 'flex' }}>
          🎬
        </PlaceholderImage>
        
        <PlayOverlay>
          <PlayButton>
            <FaPlay />
          </PlayButton>
        </PlayOverlay>
      </ImageContainer>
      
      <Content>
        <Title>{media.title}</Title>
        
        {media.description && (
          <Description>{media.description}</Description>
        )}
        
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
        </MetaInfo>
        
        {media.genre && (
          <Genre style={{ marginTop: '8px', display: 'inline-block' }}>
            {media.genre}
          </Genre>
        )}
      </Content>
    </CardContainer>
  );
}

export default MediaCard;
