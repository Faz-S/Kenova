import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';

const AnalysisContainer = styled.div`
  min-height: 100vh;
  padding: 40px;
  background: #13151a;
  font-family: 'Space Grotesk', sans-serif;
  color: white;
  overflow-y: auto;
  max-height: 100vh;
  position: relative;

  * {
    box-sizing: border-box;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1d24;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #2a2d35;
    border-radius: 4px;
    
    &:hover {
      background: #3a3d45;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  position: sticky;
  top: 0;
  background: #13151a;
  padding: 20px 0;
  z-index: 10;

  h1 {
    color: #FF61D8;
    font-size: 2rem;
    margin: 0;
  }

  button {
    padding: 12px 24px;
    background: #6B8AFF;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #8ba1ff;
      transform: translateY(-2px);
    }
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 40px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
`;

const MetricCard = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  padding: 24px;
  text-align: center;

  .label {
    color: #8b8d91;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }

  .value {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.color || '#00FFA3'};
  }

  .trend {
    font-size: 0.9rem;
    color: ${props => props.trendColor || '#00FFA3'};
    margin-top: 8px;
  }
`;

const ChartSection = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  padding: 24px;
  margin-bottom: 24px;
  
  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
  }
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
`;

const DetailedStats = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  padding: 24px;

  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #2a2d35;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #8b8d91;
    }

    .value {
      color: #00FFA3;
      font-weight: 600;
    }
  }
`;

const RecentQuizzes = styled.div`
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;
  padding: 24px;

  h2 {
    color: #FF61D8;
    margin-bottom: 20px;
  }

  .quiz-item {
    padding: 12px;
    border-radius: 8px;
    background: #22252d;
    margin-bottom: 12px;
    
    .date {
      color: #6B8AFF;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .score {
      display: flex;
      justify-content: space-between;
      
      .label {
        color: #8b8d91;
      }
      
      .value {
        color: #00FFA3;
      }
    }

    .grade {
      text-align: right;
      font-weight: bold;
      margin-top: 8px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  background: #1a1d24;
  border-radius: 12px;
  border: 1px solid #2a2d35;

  h2 {
    color: #FF61D8;
    margin-bottom: 16px;
  }

  p {
    color: #6B8AFF;
    margin-bottom: 24px;
  }

  button {
    padding: 12px 24px;
    background: #6B8AFF;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #8ba1ff;
      transform: translateY(-2px);
    }
  }
`;

const QuizAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastQuizResult = location.state?.lastQuizResult;
  
  // Get all quiz results from localStorage
  const allResults = JSON.parse(localStorage.getItem('quizResults') || '[]');

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    if (allResults.length === 0) return null;

    const totalQuizzes = allResults.length;
    const averageScore = (allResults.reduce((acc, curr) => 
      acc + parseFloat(curr.percentage), 0) / totalQuizzes).toFixed(1);
    
    const grades = allResults.map(r => r.grade);
    const bestGrade = grades.reduce((a, b) => 
      ['A+', 'A', 'B', 'C', 'D', 'F'].indexOf(a) < ['A+', 'A', 'B', 'C', 'D', 'F'].indexOf(b) ? a : b);
    
    const recentTrend = allResults.slice(-3).map(r => parseFloat(r.percentage));
    const trending = recentTrend.length > 1 ? 
      recentTrend[recentTrend.length - 1] > recentTrend[recentTrend.length - 2] : null;

    const totalQuestions = allResults.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const correctAnswers = allResults.reduce((acc, curr) => acc + curr.score, 0);
    
    const weakestArea = "Need more data"; // This would need actual question category data
    const strongestArea = "Need more data"; // This would need actual question category data

    return {
      totalQuizzes,
      averageScore,
      bestGrade,
      trending,
      totalQuestions,
      correctAnswers,
      weakestArea,
      strongestArea
    };
  }, [allResults]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A+':
      case 'A':
        return '#00FFA3';
      case 'B':
        return '#6B8AFF';
      case 'C':
        return '#FF61D8';
      case 'D':
        return '#FFA500';
      default:
        return '#FF4444';
    }
  };

  const startNewQuiz = () => {
    navigate('/quiz');
  };

  if (!metrics) {
    return (
      <AnalysisContainer>
        <ContentWrapper>
          <Header>
            <h1>Quiz Analysis</h1>
            <button onClick={startNewQuiz}>Start New Quiz</button>
          </Header>
          <EmptyState>
            <h2>No Quiz Results Yet</h2>
            <p>Take your first quiz to see your performance analysis!</p>
            <button onClick={startNewQuiz}>Start a Quiz</button>
          </EmptyState>
        </ContentWrapper>
      </AnalysisContainer>
    );
  }

  return (
    <AnalysisContainer>
      <ContentWrapper>
        <Header>
          <h1>Quiz Analysis Dashboard</h1>
          <button onClick={startNewQuiz}>Start New Quiz</button>
        </Header>

        <DashboardGrid>
          <MetricCard color="#FF61D8">
            <div className="label">Total Quizzes Taken</div>
            <div className="value">{metrics.totalQuizzes}</div>
          </MetricCard>
          <MetricCard color="#00FFA3">
            <div className="label">Average Score</div>
            <div className="value">{metrics.averageScore}%</div>
            {metrics.trending !== null && (
              <div className="trend" style={{ color: metrics.trending ? '#00FFA3' : '#FF4444' }}>
                {metrics.trending ? '↑ Improving' : '↓ Needs Work'}
              </div>
            )}
          </MetricCard>
          <MetricCard color={getGradeColor(metrics.bestGrade)}>
            <div className="label">Best Grade Achieved</div>
            <div className="value">{metrics.bestGrade}</div>
          </MetricCard>
        </DashboardGrid>

        <PerformanceGrid>
          <DetailedStats>
            <h2>Performance Metrics</h2>
            <div className="stat-row">
              <span className="label">Total Questions Attempted</span>
              <span className="value">{metrics.totalQuestions}</span>
            </div>
            <div className="stat-row">
              <span className="label">Correct Answers</span>
              <span className="value">{metrics.correctAnswers}</span>
            </div>
            <div className="stat-row">
              <span className="label">Success Rate</span>
              <span className="value">
                {((metrics.correctAnswers / metrics.totalQuestions) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="stat-row">
              <span className="label">Weakest Area</span>
              <span className="value">{metrics.weakestArea}</span>
            </div>
            <div className="stat-row">
              <span className="label">Strongest Area</span>
              <span className="value">{metrics.strongestArea}</span>
            </div>
          </DetailedStats>

          <RecentQuizzes>
            <h2>Recent Quizzes</h2>
            {allResults.slice(-5).reverse().map((result, index) => (
              <div className="quiz-item" key={index}>
                <div className="date">{formatDate(result.date)}</div>
                <div className="score">
                  <span className="label">Score:</span>
                  <span className="value">{result.percentage}%</span>
                </div>
                <div 
                  className="grade"
                  style={{ color: getGradeColor(result.grade) }}
                >
                  {result.grade}
                </div>
              </div>
            ))}
          </RecentQuizzes>
        </PerformanceGrid>

        <ChartSection>
          <h2>Performance Trends</h2>
          <div style={{ 
            textAlign: 'center', 
            color: '#8b8d91',
            padding: '40px 0' 
          }}>
            {allResults.length < 3 ? 
              "Take more quizzes to see your performance trends!" :
              `Your performance has ${metrics.trending ? 'improved' : 'declined'} in recent quizzes.`
            }
          </div>
        </ChartSection>
      </ContentWrapper>
    </AnalysisContainer>
  );
};

export default QuizAnalysis;
