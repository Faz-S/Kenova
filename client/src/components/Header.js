import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  colors,
  gradients,
  glassMorphism,
  float,
  shimmer,
  GradientText,
  scrollbarStyles
} from '../styles/SharedStyles';

const HeaderContainer = styled.header`
  ${glassMorphism}
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: ${gradients.primary};
    animation: ${shimmer} 3s linear infinite;
  }
`;

const Logo = styled(Link)`
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    font-size: 1.8rem;
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.5px;
    animation: ${float} 6s ease-in-out infinite;
  }
`;

const LogoIcon = styled.div`
  font-size: 2rem;
  animation: ${float} 6s ease-in-out infinite;
  filter: drop-shadow(0 0 10px ${colors.primary}50);
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
  ${scrollbarStyles}
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${gradients.primary};
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    border-radius: 12px;
  }

  &:hover {
    transform: translateY(-2px);
    color: white;
    
    &::before {
      opacity: 0.1;
    }
  }

  &.active {
    background: ${colors.lightGlass};
    
    &::before {
      opacity: 0.2;
    }
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <Logo to="/">
        <LogoIcon>🚀</LogoIcon>
        <GradientText as="h1">Kenova</GradientText>
      </Logo>
      <Nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;