import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaUpload, FaHome, FaVideo, FaCog } from 'react-icons/fa';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #333;
  z-index: 1000;
  padding: 0 20px;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  height: 50px; /* Match the header height proportionally */
`;

const LogoImage = styled.img`
  height: 50px;
  width: auto;
  object-fit: contain;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;
`;

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #e50914;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background-color: #333;
  border: 1px solid #555;
  border-radius: 20px;
  padding: 8px 16px 8px 40px;
  color: white;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #e50914;
    background-color: #444;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileNav = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #333;
  padding: 20px;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const MobileNavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <LogoImage src="/img/PanaStream.png" alt="PanaStream" />
        </Logo>
        
        <Nav>
          <NavLink to="/">
            <FaHome />
            Home
          </NavLink>
          <NavLink to="/library">
            <FaVideo />
            Library
          </NavLink>
          <NavLink to="/upload">
            <FaUpload />
            Upload
          </NavLink>
          <NavLink to="/conversions">
            <FaCog />
            Conversions
          </NavLink>
          
          <SearchContainer>
            <form onSubmit={handleSearch}>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search movies and shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </SearchContainer>
        </Nav>
        
        <MobileMenuButton onClick={toggleMobileMenu}>
          ☰
        </MobileMenuButton>
      </HeaderContent>
      
      <MobileNav isOpen={isMobileMenuOpen}>
        <MobileNavContent>
          <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <FaHome />
            Home
          </NavLink>
          <NavLink to="/library" onClick={() => setIsMobileMenuOpen(false)}>
            <FaVideo />
            Library
          </NavLink>
          <NavLink to="/upload" onClick={() => setIsMobileMenuOpen(false)}>
            <FaUpload />
            Upload
          </NavLink>
          <NavLink to="/conversions" onClick={() => setIsMobileMenuOpen(false)}>
            <FaCog />
            Conversions
          </NavLink>
          
          <SearchContainer>
            <form onSubmit={handleSearch}>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search movies and shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </SearchContainer>
        </MobileNavContent>
      </MobileNav>
    </HeaderContainer>
  );
}

export default Header;
