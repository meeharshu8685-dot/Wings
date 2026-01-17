import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { GoalLock } from './screens/GoalLock';
import { FlightDeck } from './screens/FlightDeck';
import { Momentum } from './screens/Momentum';
import { TimePressure } from './screens/TimePressure';
import { WeeklyReportModal } from './screens/WeeklyReport';
import { Settings } from './screens/Settings';
import { ControlPanel } from './screens/ControlPanel';
import { Planning } from './screens/Planning';
import { Failure } from './screens/Failure';
import { useWingsStore } from './store/useWingsStore';
import { ViewState } from './types';

function App() {
  const { recalculateCapacityAndSanity, level, momentum } = useWingsStore();
  const [currentView, setCurrentView] = useState<ViewState>('FLIGHT');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  useEffect(() => {
    if (momentum.lastHardModeFailure) {
      setCurrentView('FAILURE');
    } else {
      recalculateCapacityAndSanity();
    }
  }, [momentum.lastHardModeFailure, recalculateCapacityAndSanity]);

  useEffect(() => {
    if (level < 2 && (currentView === 'MOMENTUM' || currentView === 'PRESSURE' || currentView === 'GOAL')) {
      setCurrentView('FLIGHT');
    }
    if (level < 3 && (currentView === 'PRESSURE' || currentView === 'GOAL')) {
      setCurrentView('FLIGHT');
    }
  }, [level, currentView]);

  const renderScreen = () => {
    switch (currentView) {
      case 'GOAL': return <GoalLock />;
      case 'FLIGHT': return <FlightDeck />;
      case 'MOMENTUM': return <Momentum />;
      case 'PRESSURE': return <TimePressure />;
      case 'SETTINGS': return <Settings />;
      case 'CONTROL_PANEL': return <ControlPanel />;
      case 'PLANNING': return <Planning />;
      case 'FAILURE': return <Failure onChangeView={setCurrentView} />;
      default: return <FlightDeck />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onChangeView={setCurrentView}>
        {renderScreen()}
      </Layout>

      {showWeeklyReport && (
        <WeeklyReportModal onClose={() => setShowWeeklyReport(false)} />
      )}
    </>
  );
}

export default App;
