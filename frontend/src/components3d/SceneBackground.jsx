import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { ThreeScene } from '../rendering/ThreeScene'
import s from './SceneBackground.module.css'

/*
  SceneBackground — mounts ONE persistent Three.js canvas behind the entire
  app and exposes `setMood(phase)` via context so screens can drive cinematic
  camera framing without ever tearing down the WebGL context.
*/
const SceneContext = createContext({ setMood: () => {} })
export const useScene = () => useContext(SceneContext)

export function SceneProvider({ children }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return undefined
    const scene = new ThreeScene(canvasRef.current)
    scene.start()
    sceneRef.current = scene
    setReady(true)

    // Apply saved theme immediately
    const saved = localStorage.getItem('satquest.theme') || 'dark'
    scene.setTheme(saved)

    // Listen for theme changes
    const onTheme = (e) => scene.setTheme(e.detail)
    window.addEventListener('satquest:theme', onTheme)

    return () => {
      window.removeEventListener('satquest:theme', onTheme)
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  const setMood = useCallback((mood) => {
    sceneRef.current?.setMood(mood)
  }, [])

  return (
    <SceneContext.Provider value={{ setMood, ready }}>
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.vignette} />
      <div className={s.grain} />
      {children}
    </SceneContext.Provider>
  )
}
