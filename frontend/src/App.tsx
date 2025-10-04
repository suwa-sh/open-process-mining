import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import AnalysisList from './components/AnalysisList';
import ProcessMap from './components/ProcessMap';
import OrganizationAnalysisList from './components/OrganizationAnalysisList';
import OrganizationAnalysisDetail from './components/OrganizationAnalysisDetail';
import OutcomeAnalysisList from './components/outcome/OutcomeAnalysisList';
import OutcomeAnalysisDetail from './components/outcome/OutcomeAnalysisDetail';

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

const OrganizationAnalysisListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (analysisId: string) => {
    navigate(`/organization/${analysisId}`);
  };

  return <OrganizationAnalysisList onSelect={handleSelect} />;
};

const OrganizationAnalysisDetailPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  if (!analysisId) {
    navigate('/organization');
    return null;
  }

  const handleBack = () => {
    navigate('/organization');
  };

  return <OrganizationAnalysisDetail analysisId={analysisId} onBack={handleBack} />;
};

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AnalysisListPage />} />
          <Route path="/analysis/:analysisId" element={<ProcessMapPage />} />
          <Route path="/organization" element={<OrganizationAnalysisListPage />} />
          <Route path="/organization/:analysisId" element={<OrganizationAnalysisDetailPage />} />
          <Route path="/outcome" element={<OutcomeAnalysisList />} />
          <Route path="/outcome/:id" element={<OutcomeAnalysisDetail />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
};

export default App;
