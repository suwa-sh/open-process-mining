import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import AnalysisList from './components/AnalysisList';
import ProcessMap from './components/ProcessMap';

const AnalysisListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (analysisId: string) => {
    navigate(`/analysis/${analysisId}`);
  };

  return <AnalysisList onSelect={handleSelect} />;
};

const ProcessMapPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  if (!analysisId) {
    navigate('/');
    return null;
  }

  const handleBack = () => {
    navigate('/');
  };

  return <ProcessMap analysisId={analysisId} onBack={handleBack} />;
};

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AnalysisListPage />} />
          <Route path="/analysis/:analysisId" element={<ProcessMapPage />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
};

export default App;
