import { Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { Home, Model } from './pages';

export const App = () => {
  const navigate = useNavigate();

  // useEffect(() => {
  // const storedObjectString = localStorage.getItem('design') ?? '{}';
  // const storedObject = JSON.parse(storedObjectString);

  //   if (storedObject.description) {
  //     navigate('/model');
  //   }
  // }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/model/*" element={<Model />} />
    </Routes>
  );
};
