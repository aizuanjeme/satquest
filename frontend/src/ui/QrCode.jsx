import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/*
  QrCode — renders a Lightning invoice payload to a canvas. Pure data → canvas;
  logic copied verbatim from the original (white code on light bg for scanners).
*/
export default function QrCode({ value, size = 220, className }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    setError(null)
    QRCode.toCanvas(
      canvasRef.current,
      value.toUpperCase(),
      { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#06121f', light: '#ffffff' } },
      (err) => { if (err) setError(err.message) },
    )
  }, [value, size])

  if (!value) return null
  if (error) return <p style={{ color: '#ff5e6e', fontSize: 12 }}>{error}</p>
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: 12, background: '#fff', padding: 8 }}
    />
  )
}
