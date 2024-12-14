import styled, { keyframes, css } from 'styled-components';

// Shared Animations
export const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export const floatWithRotate = keyframes`
  0% { 
    transform: translateY(0px) rotate(0deg);
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: translateY(-10px) rotate(2deg);
    filter: hue-rotate(180deg);
  }
  100% { 
    transform: translateY(0px) rotate(0deg);
    filter: hue-rotate(360deg);
  }
`;

export const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const glowPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 97, 216, 0.2), 0 0 10px rgba(255, 97, 216, 0.2), 0 0 15px rgba(255, 97, 216, 0.2); }
  50% { box-shadow: 0 0 10px rgba(255, 97, 216, 0.5), 0 0 20px rgba(255, 97, 216, 0.3), 0 0 30px rgba(255, 97, 216, 0.3); }
  100% { box-shadow: 0 0 5px rgba(255, 97, 216, 0.2), 0 0 10px rgba(255, 97, 216, 0.2), 0 0 15px rgba(255, 97, 216, 0.2); }
`;

export const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Shared Colors
export const colors = {
  primary: '#FF61D8',
  secondary: '#6B8AFF',
  accent: '#00FFA3',
  background: '#111111',
  darkGlass: 'rgba(26, 29, 36, 0.7)',
  lightGlass: 'rgba(255, 255, 255, 0.05)',
  error: '#FF6B6B',
  success: '#00FFA3',
};

// Shared Gradients
export const gradients = {
  primary: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
  accent: `linear-gradient(45deg, ${colors.accent}, ${colors.secondary})`,
  glow: `radial-gradient(circle at 50% 50%, ${colors.primary}20, transparent 70%)`,
};

// Shared Mixins
export const glassMorphism = css`
  background: ${colors.darkGlass};
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const neonText = css`
  color: ${colors.primary};
  text-shadow: 0 0 10px ${colors.primary}50;
`;

export const neonBox = css`
  box-shadow: 
    0 0 20px ${colors.primary}30,
    0 0 40px ${colors.secondary}20;
`;

export const hoverLift = css`
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    ${neonBox}
  }
`;

// Shared Components
export const Card = styled.div`
  ${glassMorphism}
  border-radius: 24px;
  padding: 2rem;
  ${hoverLift}
`;

export const GradientText = styled.span`
  background: ${gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${pulse} 3s ease-in-out infinite;
`;

export const GlowingButton = styled.button`
  padding: 1rem 2rem;
  background: ${gradients.primary};
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    animation: ${glowPulse} 2s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
`;

export const Input = styled.input`
  ${glassMorphism}
  padding: 1rem;
  border-radius: 12px;
  color: white;
  width: 100%;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 20px ${colors.primary}30;
  }
`;

// Shared Scrollbar Styles
export const scrollbarStyles = css`
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${colors.lightGlass};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${gradients.primary};
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    border: 1px solid transparent;
  }
`;
