import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import { api } from '../services/api';

const SearchContainer = styled.div`
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

const SearchSection = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid #333;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background-color: #333;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #e50914;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const SearchButton = styled.button`
  background-color: #e50914;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f40612;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
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

const ClearButton = styled.button`
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

const ResultsSection = styled.div`
  padding: 0 20px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ResultsCount = styled.div`
  color: #999;
  font-size: 16px;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 18px;
`;

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    sort: 'created_at',
    order: 'desc'
  });

  const { data: genres } = useQuery('genres', api.getGenres);
  const { data: years } = useQuery('years', api.getYears);

  const { data: searchResults, isLoading } = useQuery(
    ['search', searchQuery, filters],
    () => api.searchMedia({
      q: searchQuery,
      ...filters
    }),
    {
      enabled: !!searchQuery.trim()
    }
  );

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      year: '',
      sort: 'created_at',
      order: 'desc'
    });
  };

  const hasActiveFilters = filters.genre || filters.year;

  return (
    <SearchContainer>
      <Header>
        <Title>Search Library</Title>
        <Subtitle>Find your favorite movies and shows</Subtitle>
      </Header>

      <SearchSection>
        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit" disabled={!searchQuery.trim()}>
            <FaSearch />
            Search
          </SearchButton>
        </SearchForm>

        {searchQuery && (
          <FiltersRow>
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
              <ClearButton onClick={clearFilters}>
                Clear Filters
              </ClearButton>
            )}
          </FiltersRow>
        )}
      </SearchSection>

      <ResultsSection>
        {isLoading ? (
          <LoadingContainer>Searching...</LoadingContainer>
        ) : searchResults && searchResults.length > 0 ? (
          <>
            <ResultsHeader>
              <ResultsCount>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </ResultsCount>
            </ResultsHeader>
            <MediaGrid>
              {searchResults.map((media) => (
                <MediaCard key={media.id} media={media} />
              ))}
            </MediaGrid>
          </>
        ) : searchQuery ? (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              No media found matching "{searchQuery}". Try adjusting your search terms or filters.
            </EmptyDescription>
          </EmptyState>
        ) : (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>Start your search</EmptyTitle>
            <EmptyDescription>
              Enter a search term above to find movies and shows in your library.
            </EmptyDescription>
          </EmptyState>
        )}
      </ResultsSection>
    </SearchContainer>
  );
}

export default Search;
