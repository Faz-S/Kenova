import styled from 'styled-components';
import { colors, cardStyle } from '../../styles/theme';

export const UploadArea = styled.div`
  ${cardStyle}
  border: 2px dashed ${props => props.isDragging ? colors.primary : colors.border};
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${colors.primary};
    background: ${colors.backgroundLight};
  }
`;

export const PreviewArea = styled.div`
  ${cardStyle}
  margin-top: 20px;
`;

export const PreviewContent = styled.pre`
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${colors.text};
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 15px;
  background: ${colors.backgroundLight};
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

export const LoadingSpinner = styled.div`
  color: ${colors.primary};
  text-align: center;
  padding: 20px;
`;

export const SuccessMessage = styled.div`
  color: ${colors.accent};
  text-align: center;
  padding: 10px;
  background: rgba(0, 255, 163, 0.1);
  border-radius: 8px;
  margin-bottom: 15px;
`;

export const ErrorMessage = styled.div`
  color: ${colors.warning};
  padding: 10px;
  background: rgba(255, 184, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 15px;
`;
