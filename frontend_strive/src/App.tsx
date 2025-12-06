import { BrowserRouter , Routes, Route} from 'react-router-dom';
import Home from './components/Home/Home';
//import Register from "./components/Auth/Register"

export default function App() {
  return (
   <BrowserRouter>
    <Routes>
    <Route path="/home" element={<Home />} />
    <Route path="*" element={<Home />} />
    </Routes>
   </BrowserRouter>
  )
}
