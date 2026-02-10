import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Save, ArrowLeft, User, Wallet, DollarSign, Link as LinkIcon, Loader2, CheckCircle2, Camera, X, ZoomIn, QrCode, Upload } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '../lib/cropImage'

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [qrUploading, setQrUploading] = useState(false) // Novo estado para QR Code
  const [success, setSuccess] = useState(false)
  
  // Estados do Cropper (Avatar)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showCropper, setShowCropper] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    slug: '',
    pix_key: '',
    price: '',
    avatar_url: '',
    pix_qrcode_url: '' // Novo campo
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setFormData({
        full_name: data.full_name || '',
        slug: data.slug || '',
        pix_key: data.pix_key || '',
        price: data.price || '',
        avatar_url: data.avatar_url || '',
        pix_qrcode_url: data.pix_qrcode_url || ''
      })
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'slug') {
        setFormData(prev => ({ ...prev, [name]: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
    } else {
        setFormData(prev => ({ ...prev, [name]: value }))
    }
    setSuccess(false)
  }

  // --- LÓGICA DO AVATAR (Mantida igual) ---
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result)
        setShowCropper(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const performCropAndUpload = async () => {
    try {
      setUploading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const fileName = `avatar-${session.user.id}-${Math.random()}.jpg`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedImageBlob)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setShowCropper(false)
      setImageSrc(null)

    } catch (error) {
      alert('Erro no avatar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // --- LÓGICA DO QR CODE (NOVO - Upload Direto) ---
  const handleQrUpload = async (e) => {
    try {
        setQrUploading(true)
        const file = e.target.files[0]
        if (!file) return

        const { data: { session } } = await supabase.auth.getSession()
        const fileExt = file.name.split('.').pop()
        const fileName = `qrcode-${session.user.id}-${Math.random()}.${fileExt}`

        // Usa o mesmo bucket 'avatars' para simplificar (já é público)
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        setFormData(prev => ({ ...prev, pix_qrcode_url: publicUrl }))

    } catch (error) {
        alert('Erro no QR Code: ' + error.message)
    } finally {
        setQrUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            slug: formData.slug,
            pix_key: formData.pix_key,
            price: parseFloat(formData.price),
            avatar_url: formData.avatar_url,
            pix_qrcode_url: formData.pix_qrcode_url // Salva o QR Code
        })
        .eq('id', session.user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative overflow-x-hidden">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/60 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-purple-200/60 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-90 contrast-150"></div>
      </div>

      {/* MODAL CROPPER (AVATAR) */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col">
            <div className="flex-1 relative bg-slate-800">
                 <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    cropShape="round"
                    showGrid={false}
                />
            </div>
            <div className="bg-white p-6 rounded-t-3xl">
                <div className="flex items-center gap-4 mb-6">
                    <ZoomIn size={20} className="text-slate-400"/>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => {setShowCropper(false); setImageSrc(null)}} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 border border-slate-200">Cancelar</button>
                    <button onClick={performCropAndUpload} disabled={uploading} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">{uploading ? <Loader2 className="animate-spin" size={20}/> : 'Confirmar Recorte'}</button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-in-up">
        
        <div className="flex items-center gap-4 mb-8">
            <Link to="/admin" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-black text-slate-900">Configurações</h1>
                <p className="text-slate-500 text-sm">Personalize seu perfil público.</p>
            </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            
            <form onSubmit={handleSave} className="space-y-8 relative z-10">
                
                {/* 1. UPLOAD AVATAR */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-indigo-50 flex items-center justify-center relative">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-indigo-200" />
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer backdrop-blur-sm">
                            <Camera size={32} />
                            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" disabled={uploading}/>
                        </label>
                        <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full border-4 border-slate-50 shadow-sm"><Camera size={16} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Foto de Perfil</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Campos de Nome e Preço */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Profissional</label>
                        <div className="relative">
                            <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-900 text-sm shadow-sm"/>
                            <User className="absolute left-3 top-3 text-slate-400" size={18}/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Preço da Consulta</label>
                        <div className="relative">
                            <input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-900 text-sm shadow-sm"/>
                            <DollarSign className="absolute left-3 top-3 text-slate-400" size={18}/>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* 2. DADOS BANCÁRIOS E QR CODE */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Wallet size={20} className="text-indigo-600"/> Dados de Recebimento
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Chave Pix */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Chave Pix (Texto)</label>
                            <input name="pix_key" required value={formData.pix_key} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-900 text-sm shadow-sm" placeholder="CPF, Email ou Aleatória"/>
                        </div>

                        {/* Upload QR Code */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">QR Code do Pix (Imagem)</label>
                            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors overflow-hidden relative">
                                    {qrUploading ? <Loader2 className="animate-spin"/> : formData.pix_qrcode_url ? <img src={formData.pix_qrcode_url} className="w-full h-full object-cover"/> : <QrCode size={24}/>}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                                        {formData.pix_qrcode_url ? 'Alterar Imagem' : 'Enviar QR Code'}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Print do seu banco</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={qrUploading}/>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Seu Link Personalizado</label>
                    <div className="relative group">
                        <input name="slug" required value={formData.slug} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-600 text-sm group-hover:bg-white transition-colors"/>
                        <LinkIcon className="absolute left-3 top-3 text-slate-400" size={18}/>
                    </div>
                </div>

                <button type="submit" disabled={saving} className={`w-full py-4 rounded-xl font-black text-sm transition-all flex justify-center items-center gap-2 shadow-lg hover:-translate-y-1 ${success ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-900/20'}`}>
                    {saving ? <Loader2 className="animate-spin" size={20}/> : success ? <>Salvo com Sucesso! <CheckCircle2 size={20}/></> : <>Salvar Alterações <Save size={18}/></>}
                </button>
            </form>
        </div>
      </div>
    </div>
  )
}