import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Home, Model } from './pages';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/model" element={<Model />} />
    </Routes>
  );
};
