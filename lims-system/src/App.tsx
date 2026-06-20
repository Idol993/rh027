import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EntrustList from './pages/Entrust/EntrustList';
import ContractReview from './pages/Entrust/ContractReview';
import SampleList from './pages/Sample/SampleList';
import TaskList from './pages/Task/TaskList';
import ReportList from './pages/Report/ReportList';
import ReagentList from './pages/Reagent/ReagentList';
import EquipmentList from './pages/Equipment/EquipmentList';
import Monitor from './pages/Monitor';
import { useStore } from './store/useStore';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const currentUser = useStore((state) => state.currentUser);
  return currentUser ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
      <AntdApp>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="entrust">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<EntrustList />} />
              <Route path="review" element={<ContractReview />} />
            </Route>
            <Route path="sample">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<SampleList />} />
            </Route>
            <Route path="task">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="my" element={<TaskList />} />
              <Route path="list" element={<TaskList />} />
            </Route>
            <Route path="report">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<ReportList />} />
            </Route>
            <Route path="reagent">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<ReagentList />} />
            </Route>
            <Route path="equipment">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<EquipmentList />} />
            </Route>
            <Route path="monitor" element={<Monitor />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
