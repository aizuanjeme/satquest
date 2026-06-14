import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BgScene } from './rendering/BgScene'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Stats from './components/Stats'
import HowItWorks from './components/HowItWorks'
import Leaderboard from './components/Leaderboard'
import Feedback from './components/Feedback'
import Blog from './components/Blog'
import Community from './components/Community'
import Footer from './components/Footer'
import TournamentPage from './pages/TournamentPage'

function Landing() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const scene = new BgScene(canvasRef.current)
    scene.start()
    return () => scene.dispose()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <canvas ref={canvasRef} id="bg-canvas" />
      <div id="app-root">
        <Nav />
        <main>
          <Hero />
          <Stats />
          <HowItWorks />
          <Leaderboard />
          <Feedback />
          <Blog />
          <Community />
        </main>
        <Footer />
      </div>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/tournament" element={<TournamentPage />} />
      <Route path="/*" element={<Landing />} />
    </Routes>
  )
}

