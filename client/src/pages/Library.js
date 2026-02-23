import React, { useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { FaFilter, FaSearch, FaSort } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import { api } from '../services/api';

const LibraryContainer = styled.div`
  padding: 40px 0;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 0 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 12px;
  color: white;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #999;
`;

const FiltersContainer = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #333;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  
  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: #999;
  font-weight: 500;
`;

const FilterInput = styled.input`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 10px 12px;
  color: white;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const FilterSelect = styled.select`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 10px 12px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  option {
    background-color: #333;
    color: white;
  }
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const ClearFiltersButton = styled.button`
  background-color: transparent;
  border: 1px solid #555;
  color: #999;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #e50914;
    color: #e50914;
  }
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 280px);
  gap: 24px;
  padding: 0 20px;
  justify-content: center;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, 260px);
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, 240px);
    gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, 200px);
    gap: 12px;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
  padding: 0 20px;
`;

const PaginationButton = styled.button`
  background-color: ${props => props.active ? '#e50914' : '#333'};
  border: 1px solid ${props => props.active ? '#e50914' : '#555'};
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #e50914;
    border-color: #e50914;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsInfo = styled.div`
  text-align: center;
  color: #999;
  margin-bottom: 20px;
  padding: 0 20px;
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
  line-height: 1.6;
`;

function Library() {
  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    year: '',
    sort: 'created_at',
    order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { data: mediaData, isLoading } = useQuery(
    ['media', filters, currentPage],
    () => api.getMedia({
      page: currentPage,
      limit,
      ...filters
    })
  );

  const { data: genres } = useQuery('genres', api.getGenres);
  const { data: years } = useQuery('years', api.getYears);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      genre: '',
      year: '',
      sort: 'created_at',
      order: 'desc'
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.search || filters.genre || filters.year;

  if (isLoading) {
    return (
      <LibraryContainer>
        <div className="loading">Loading library...</div>
      </LibraryContainer>
    );
  }

  return (
    <LibraryContainer>
      <Header>
        <Title>Media Library</Title>
        <Subtitle>Browse and manage your streaming collection</Subtitle>
      </Header>

      <FiltersContainer>
        <FiltersRow>
          <FilterGroup>
            <FilterLabel>
              <FaSearch style={{ marginRight: '8px' }} />
              Search
            </FilterLabel>
            <FilterInput
              type="text"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>
              <FaFilter style={{ marginRight: '8px' }} />
              Genre
            </FilterLabel>
            <FilterSelect
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
            >
              <option value="">All Genres</option>
              {genres?.map(genre => (
                <option key={genre.genre} value={genre.genre}>
                  {genre.genre} ({genre.count})
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Year</FilterLabel>
            <FilterSelect
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">All Years</option>
              {years?.map(year => (
                <option key={year.year} value={year.year}>
                  {year.year} ({year.count})
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <SortContainer>
            <FaSort style={{ color: '#999' }} />
            <FilterSelect
              value={`${filters.sort}_${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('_');
                handleFilterChange('sort', sort);
                handleFilterChange('order', order);
              }}
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
              <option value="year_desc">Year (Newest)</option>
              <option value="year_asc">Year (Oldest)</option>
            </FilterSelect>
          </SortContainer>

          {hasActiveFilters && (
            <ClearFiltersButton onClick={clearFilters}>
              Clear Filters
            </ClearFiltersButton>
          )}
        </FiltersRow>
      </FiltersContainer>

      {mediaData?.data && (
        <ResultsInfo>
          Showing {mediaData.data.length} of {mediaData.pagination.total} media items
          {hasActiveFilters && ' (filtered)'}
        </ResultsInfo>
      )}

      {mediaData?.data && mediaData.data.length > 0 ? (
        <>
          <MediaGrid>
            {mediaData.data.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </MediaGrid>

          {mediaData.pagination.pages > 1 && (
            <Pagination>
              <PaginationButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationButton>

              {Array.from({ length: Math.min(5, mediaData.pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationButton
                    key={page}
                    active={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationButton>
                );
              })}

              <PaginationButton
                onClick={() => setCurrentPage(prev => Math.min(mediaData.pagination.pages, prev + 1))}
                disabled={currentPage === mediaData.pagination.pages}
              >
                Next
              </PaginationButton>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState>
          <EmptyIcon>🎬</EmptyIcon>
          <EmptyTitle>
            {hasActiveFilters ? 'No results found' : 'No media in your library'}
          </EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? 'Try adjusting your search criteria or clear the filters to see all media.'
              : 'Start building your streaming library by uploading your first video file.'
            }
          </EmptyDescription>
        </EmptyState>
      )}
    </LibraryContainer>
  );
}

export default Library;
