import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { GoalLock } from './screens/GoalLock';
import { FlightDeck } from './screens/FlightDeck';
import { Momentum } from './screens/Momentum';
import { TimePressure } from './screens/TimePressure';
import { WeeklyReportModal } from './screens/WeeklyReport';
import { WeeklyCheck } from './screens/WeeklyCheck';
import { Settings } from './screens/Settings';
import { ControlPanel } from './screens/ControlPanel';
import { Planning } from './screens/Planning';
import { Failure } from './screens/Failure';
import { useWingsStore } from './store/useWingsStore';
import { ViewState } from './types';
import { getStartOfWeek } from './utils/dateUtils';

function App() {
  const { recalculateCapacityAndSanity, level, momentum, weeklyChecks } = useWingsStore();
  const [currentView, setCurrentView] = useState<ViewState>('FLIGHT');
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showWeeklyCheck, setShowWeeklyCheck] = useState(false);

  // Navigation with history for back button
  const navigateTo = (view: ViewState) => {
    setViewHistory(prev => [...prev, currentView]);
    setCurrentView(view);
  };

  const goBack = () => {
    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(prevView);
    } else {
      // No history, go back to Flight Deck
      setCurrentView('FLIGHT');
    }
  };

  useEffect(() => {
    if (momentum.lastHardModeFailure) {
      setCurrentView('FAILURE');
    } else {
      recalculateCapacityAndSanity();
    }
  }, [momentum.lastHardModeFailure, recalculateCapacityAndSanity]);

  // Weekly Reality Check: Show on Sunday if not answered this week
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const weekStart = getStartOfWeek();
    const alreadyAnswered = weeklyChecks.some(c => c.weekOf === weekStart && c.answeredOn !== null);

    if (isSunday && !alreadyAnswered) {
      setShowWeeklyCheck(true);
    }
  }, [weeklyChecks]);

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
      case 'FAILURE': return <Failure onChangeView={navigateTo} />;
      default: return <FlightDeck />;
    }
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onChangeView={navigateTo}
        canGoBack={viewHistory.length > 0}
        onGoBack={goBack}
      >
        {renderScreen()}
      </Layout>

      <AnimatePresence>
        {showWeeklyReport && (
          <WeeklyReportModal onClose={() => setShowWeeklyReport(false)} />
        )}
        {showWeeklyCheck && (
          <WeeklyCheck onClose={() => setShowWeeklyCheck(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
