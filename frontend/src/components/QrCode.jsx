import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a payload as a QR code on a <canvas>.
 * Re-renders only when the payload or size changes.
 */
export default function QrCode({ value, size = 220, className }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    setError(null)
    // bolt11 invoices are uppercase by convention for tighter QR encoding,
    // but most wallets accept either case. Uppercase shrinks the QR a bit.
    const payload = value.toUpperCase()
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0b0030', light: '#ffffff' },
      },
      (err) => { if (err) setError(err.message) },
    )
  }, [value, size])

  if (!value) return null
  if (error) return <p style={{ color: '#ff4444', fontSize: 12 }}>{error}</p>

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
