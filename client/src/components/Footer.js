import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #000;
  border-top: 1px solid #333;
  padding: 20px 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
`;

const Copyright = styled.p`
  color: #999;
  font-size: 14px;
  margin: 0;
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <Copyright>© 2025 Pixaclara. All rights reserved.</Copyright>
      </FooterContent>
    </FooterContainer>
  );
}

export default Footer;
