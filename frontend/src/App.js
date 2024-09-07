import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import MBpage from './MintBurn';
import RCoinChart from './RCoinChart';  // Assume these components are created
import RCSChart from './RCSChart';
import ReserveDetails from './ReserveDetails';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar */}
        <nav>
          <ul className="navbar">
            <li>
            <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/rcoinchart">RCoinChart</Link>
            </li>
            <li>
              <Link to="/rcschart">RCSChart</Link>
            </li>
            <li>
              <Link to="/reservedetails">ReserveDetails</Link>
            </li>
          </ul>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<MBpage />} />
          <Route path="/rcoinchart" element={<RCoinChart />} />
          <Route path="/rcschart" element={<RCSChart />} />
          <Route path="/reservedetails" element={<ReserveDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
