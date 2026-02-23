import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Library from './pages/Library';
import Player from './pages/Player';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Conversions from './pages/Conversions';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #0a0a0a;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  padding-top: 80px; /* Account for fixed header */
  flex: 1;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/search" element={<Search />} />
          <Route path="/conversions" element={<Conversions />} />
        </Routes>
      </MainContent>
      <Footer />
    </AppContainer>
  );
}

export default App;
