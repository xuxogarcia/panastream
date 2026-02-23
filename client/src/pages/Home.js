import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlay, FaUpload, FaVideo, FaSearch, FaCheckCircle, FaHdd } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import { api } from '../services/api';

const HomeContainer = styled.div`
  padding: 40px 0;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 26, 0.8) 100%), 
              url('/img/camera.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 80px 0;
  text-align: center;
  margin-bottom: 60px;
  position: relative;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #e50914 0%, #f40612 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 20px;
  color: #999;
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const HeroActions = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: white;
`;

const ViewAllLink = styled(Link)`
  color: #e50914;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  padding: 0 20px;
`;

const StatCard = styled.div`
  background-color: #1a1a1a;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #333;
`;

const StatIcon = styled.div`
  font-size: 32px;
  color: #e50914;
  margin-bottom: 16px;
`;

const StatNumber = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 24px;
  margin-bottom: 12px;
  color: #999;
`;

const EmptyDescription = styled.p`
  font-size: 16px;
  margin-bottom: 30px;
  line-height: 1.6;
`;

function Home() {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'library-stats',
    api.getLibraryStats
  );

  const { data: recentMedia, isLoading: recentLoading } = useQuery(
    'recent-media',
    () => api.getMedia({ limit: 8 })
  );

  const { data: allMedia, isLoading: allLoading } = useQuery(
    'all-media',
    () => api.getMedia({ limit: 12 })
  );

  if (statsLoading || recentLoading || allLoading) {
    return (
      <HomeContainer>
        <div className="loading">Loading...</div>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Pixaclara Panastream</HeroTitle>
          <HeroSubtitle>
            Upload a video to begin
          </HeroSubtitle>
          <HeroActions>
            <Link to="/upload" className="btn btn-primary">
              <FaUpload />
              Upload Media
            </Link>
            <Link to="/library" className="btn btn-outline">
              <FaVideo />
              Browse Library
            </Link>
          </HeroActions>
        </HeroContent>
      </HeroSection>

      {stats && (
        <Section>
          <StatsGrid>
            <StatCard>
              <StatIcon>
                <FaVideo />
              </StatIcon>
              <StatNumber>{stats.totalMedia}</StatNumber>
              <StatLabel>Total Media</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>
                <FaPlay />
              </StatIcon>
              <StatNumber>{stats.totalGenres}</StatNumber>
              <StatLabel>Genres</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>
                <FaCheckCircle />
              </StatIcon>
              <StatNumber>{stats.completedJobs}</StatNumber>
              <StatLabel>Processed</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>
                <FaHdd />
              </StatIcon>
              <StatNumber>
                {stats.totalSize ? (stats.totalSize / (1024 * 1024 * 1024)).toFixed(1) : '0'}GB
              </StatNumber>
              <StatLabel>Storage Used</StatLabel>
            </StatCard>
          </StatsGrid>
        </Section>
      )}

      {recentMedia?.data && recentMedia.data.length > 0 && (
        <Section>
          <SectionHeader>
            <SectionTitle>Recently Added</SectionTitle>
            <ViewAllLink to="/library">
              View All
            </ViewAllLink>
          </SectionHeader>
          <MediaGrid>
            {recentMedia.data.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {allMedia?.data && allMedia.data.length > 0 && (
        <Section>
          <SectionHeader>
            <SectionTitle>Your Library</SectionTitle>
            <ViewAllLink to="/library">
              View All
            </ViewAllLink>
          </SectionHeader>
          <MediaGrid>
            {allMedia.data.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </MediaGrid>
        </Section>
      )}

      {(!recentMedia?.data?.length && !allMedia?.data?.length) && (
        <Section>
          <EmptyState>
            <EmptyIcon>🎬</EmptyIcon>
            <EmptyTitle>No media in your library yet</EmptyTitle>
            <EmptyDescription>
              Start building your streaming library by uploading your first video file.
              We'll automatically convert it to the optimal format for streaming.
            </EmptyDescription>
            <Link to="/upload" className="btn btn-primary">
              <FaUpload />
              Upload Your First Video
            </Link>
          </EmptyState>
        </Section>
      )}
    </HomeContainer>
  );
}

export default Home;
