import { keyframes, css } from 'styled-components';

// Animations
export const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export const shine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
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

// Shared gradients and effects
export const gradientBg = css`
  background: linear-gradient(45deg, #FF61D8, #6B8AFF, #00FFA3, #FFB800);
  background-size: 400% 400%;
  animation: ${shine} 15s ease infinite;
`;

export const baseContainerStyle = css`
  background: linear-gradient(135deg, #13151a 0%, #1a1d24 100%);
  color: #FFFFFF;
  font-family: 'Space Grotesk', sans-serif;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(107, 138, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    animation: ${pulse} 10s ease-in-out infinite;
  }
`;

// Theme colors
export const colors = {
  primary: '#FF61D8',
  secondary: '#6B8AFF',
  accent: '#00FFA3',
  warning: '#FFB800',
  background: '#13151a',
  backgroundLight: '#1a1d24',
  border: 'rgba(255, 97, 216, 0.2)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  glass: 'rgba(20, 22, 28, 0.8)',
  lightGlass: 'rgba(255, 255, 255, 0.1)',
};

// Shared styles
export const cardStyle = css`
  background: rgba(20, 22, 28, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 97, 216, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
`;

export const buttonStyle = css`
  background: ${colors.primary};
  color: ${colors.text};
  border: none;
  border-radius: 12px;
  padding: 0.8rem 1.5rem;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${colors.secondary};
  }

  &:disabled {
    background: ${colors.border};
    cursor: not-allowed;
  }
`;

export const inputStyle = css`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${colors.border};
  border-radius: 12px;
  color: ${colors.text};
  padding: 1rem 1.2rem;
  font-family: 'Space Grotesk', sans-serif;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;
