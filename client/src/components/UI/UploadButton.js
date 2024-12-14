import React from 'react';
import styled from 'styled-components';
import { colors, buttonStyle } from '../../styles/theme';

const Button = styled.label`
  ${buttonStyle}
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  background: ${colors.glass};
  border: 1px solid ${colors.border};
  
  &:hover {
    background: ${colors.lightGlass};
    border-color: ${colors.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const UploadButton = () => (
  <Button htmlFor="file-upload">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    Choose a file or drag it here
  </Button>
);

export default UploadButton;
