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

function App() {
  return (
    <Router>
      <Sidebar />
      <Topbar />
      <div style={{ marginLeft: 220, marginTop: 56, padding: 32 }}>
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
        </Routes>
      </div>
    </Router>
  );
}
export default App;
