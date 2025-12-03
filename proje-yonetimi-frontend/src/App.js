import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Projeler from "./pages/Projeler";
import Gorevler from "./pages/Gorevler";
import GanttChart from "./pages/GanttChart";
import Takvim from "./pages/Takvim";
import Raporlar from "./pages/Raporlar";
import Kullanicilar from "./pages/Kullanicilar";
import Login from "./pages/Login";
import Kayit from "./pages/Kayit";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProcessMap from './components/ProcessMap';

function App() {
  return (
    <Router>
      <Sidebar />
      <Topbar />
      <div style={{ marginLeft: 260, marginTop: 88, padding: 32 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projeler" element={<Projeler />} />
          <Route path="/gorevler" element={<Gorevler />} />
          <Route path="/gantt-chart" element={<GanttChart />} />
          <Route path="/takvim" element={<Takvim />} />
          <Route path="/raporlar" element={<Raporlar />} />
          <Route path="/kullanicilar" element={<Kullanicilar />} />
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route path="/process-map" element={<ProcessMap processes={[
            { id: 1, name: "Process 1", latitude: 39.925533, longitude: 32.866287 },
            { id: 2, name: "Process 2", latitude: 39.930000, longitude: 32.870000 },
            { id: 3, name: "Process 3", latitude: 39.920000, longitude: 32.860000 },
          ]} />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;


// src/App.js

