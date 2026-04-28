import { useEffect, useRef, useState } from 'react'
import { X, Camera, SwitchCamera } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState('')
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [activeCameraIdx, setActiveCameraIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasScanned = useRef(false)

  useEffect(() => {
    let mounted = true
    const scannerId = 'barcode-scanner-region'

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras()
        if (!mounted) return
        if (devices.length === 0) {
          setError('Nenhuma camera encontrada no dispositivo')
          return
        }
        setCameras(devices)

        // Prefer back camera
        const backIdx = devices.findIndex(d => /back|rear|traseira|environment/i.test(d.label))
        const idx = backIdx >= 0 ? backIdx : 0
        setActiveCameraIdx(idx)

        const scanner = new Html5Qrcode(scannerId)
        scannerRef.current = scanner

        await scanner.start(
          devices[idx].id,
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (hasScanned.current) return
            hasScanned.current = true
            onScan(decodedText)
          },
          () => { /* ignore scan failures */ }
        )
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.message?.includes('Permission')
              ? 'Permissao de camera negada. Habilite nas configuracoes do navegador.'
              : 'Erro ao acessar a camera: ' + (err?.message || 'desconhecido')
          )
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [onScan])

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return
    const nextIdx = (activeCameraIdx + 1) % cameras.length
    try {
      await scannerRef.current.stop()
      hasScanned.current = false
      await scannerRef.current.start(
        cameras[nextIdx].id,
        { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
        (decodedText) => {
          if (hasScanned.current) return
          hasScanned.current = true
          onScan(decodedText)
        },
        () => {}
      )
      setActiveCameraIdx(nextIdx)
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-primary" />
            <h3 className="font-semibold text-gray-800">Escanear Codigo de Barras</h3>
          </div>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button onClick={switchCamera} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Trocar camera">
                <SwitchCamera size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scanner area */}
        <div className="relative bg-black" ref={containerRef}>
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50">
              <Camera size={48} className="text-gray-300 mb-4" />
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button onClick={onClose} className="btn-primary text-sm px-4 py-2">Fechar</button>
            </div>
          ) : (
            <div id="barcode-scanner-region" className="w-full" />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">Aponte a camera para o codigo de barras do produto</p>
        </div>
      </div>
    </div>
  )
}
