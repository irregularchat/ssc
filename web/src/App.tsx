import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import DeliverPage from './pages/DeliverPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/deliver" element={<DeliverPage />} />
      </Route>
    </Routes>
  )
}
