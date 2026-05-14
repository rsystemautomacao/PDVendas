import { useEffect, useRef, useState } from 'react'
import { X, Camera, SwitchCamera, Settings, AlertTriangle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

type CameraStatus = 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error'

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [status, setStatus] = useState<CameraStatus>('requesting')
  const [errorMsg, setErrorMsg] = useState('')
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [activeCameraIdx, setActiveCameraIdx] = useState(0)
  const hasScanned = useRef(false)

  useEffect(() => {
    let mounted = true
    const scannerId = 'barcode-scanner-region'

    const requestAndStart = async () => {
      // 1. Primeiro, pedir permissao explicitamente via getUserMedia
      // Isso forca o prompt de permissao no Android
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        // Permissao concedida — parar o stream imediatamente (html5-qrcode vai abrir o seu)
        stream.getTracks().forEach(t => t.stop())
      } catch (permErr: any) {
        if (!mounted) return
        const name = permErr?.name || ''
        const msg = permErr?.message || ''

        if (name === 'NotAllowedError' || msg.includes('Permission')) {
          setStatus('denied')
          return
        }
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setStatus('unavailable')
          setErrorMsg('Nenhuma camera encontrada neste dispositivo.')
          return
        }
        // OverconstrainedError, NotReadableError, etc — tentar mesmo assim
      }

      // 2. Listar cameras disponiveis
      try {
        const devices = await Html5Qrcode.getCameras()
        if (!mounted) return

        if (!devices || devices.length === 0) {
          setStatus('unavailable')
          setErrorMsg('Nenhuma camera encontrada neste dispositivo.')
          return
        }

        setCameras(devices)

        // Preferir camera traseira
        const backIdx = devices.findIndex(d =>
          /back|rear|traseira|environment/i.test(d.label)
        )
        const idx = backIdx >= 0 ? backIdx : 0
        setActiveCameraIdx(idx)

        // 3. Iniciar scanner
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
          () => {}
        )

        if (mounted) setStatus('ready')
      } catch (err: any) {
        if (!mounted) return
        const msg = err?.message || 'Erro desconhecido'
        if (msg.includes('Permission') || err?.name === 'NotAllowedError') {
          setStatus('denied')
        } else {
          setStatus('error')
          setErrorMsg(msg)
        }
      }
    }

    requestAndStart()

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

  const isAndroid = /android/i.test(navigator.userAgent)


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
            {cameras.length > 1 && status === 'ready' && (
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
        <div className="relative bg-black min-h-[280px]">
          {/* Requesting permission */}
          {status === 'requesting' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 min-h-[280px]">
              <div className="h-12 w-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-700">Solicitando acesso a camera...</p>
              <p className="text-xs text-gray-400 mt-1">Toque em "Permitir" quando solicitado</p>
            </div>
          )}

          {/* Permission denied */}
          {status === 'denied' && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gray-50 min-h-[280px]">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Camera size={32} className="text-red-400" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-2">Camera bloqueada</p>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                A permissao de acesso a camera foi negada. Para usar o leitor de codigo de barras, voce precisa habilitar a camera.
              </p>

              <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5 text-left">
                <div className="flex items-start gap-2 mb-2">
                  <Settings size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-800">Como habilitar:</p>
                </div>
                {isAndroid ? (
                  <ol className="text-xs text-amber-700 space-y-1.5 ml-6 list-decimal">
                    <li>Toque nos <strong>3 pontos</strong> (menu) do navegador</li>
                    <li>Toque em <strong>Configuracoes</strong></li>
                    <li>Va em <strong>Configuracoes do site</strong> &gt; <strong>Camera</strong></li>
                    <li>Encontre <strong>{window.location.hostname}</strong> e toque para <strong>Permitir</strong></li>
                    <li>Volte e tente novamente</li>
                  </ol>
                ) : (
                  <ol className="text-xs text-amber-700 space-y-1.5 ml-6 list-decimal">
                    <li>Toque no icone de <strong>cadeado</strong> na barra de endereco</li>
                    <li>Toque em <strong>Permissoes</strong> ou <strong>Configuracoes do site</strong></li>
                    <li>Habilite a <strong>Camera</strong></li>
                    <li>Recarregue a pagina e tente novamente</li>
                  </ol>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
                >
                  <Camera size={15} /> Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* No camera available */}
          {status === 'unavailable' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 min-h-[280px]">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-gray-400" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-2">Camera indisponivel</p>
              <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold">
                Fechar
              </button>
            </div>
          )}

          {/* Generic error */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 min-h-[280px]">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-2">Erro ao acessar camera</p>
              <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                  Fechar
                </button>
                <button onClick={() => window.location.reload()} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold">
                  Recarregar
                </button>
              </div>
            </div>
          )}

          {/* Scanner render target — always present so html5-qrcode can mount */}
          <div
            id="barcode-scanner-region"
            className={`w-full ${status === 'ready' ? '' : 'hidden'}`}
          />
        </div>

        {/* Footer */}
        {status === 'ready' && (
          <div className="px-4 py-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">Aponte a camera para o codigo de barras do produto</p>
          </div>
        )}
      </div>
    </div>
  )
}
