import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, QrCode, Copy, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isBefore, startOfDay, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PublicBooking() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [bookingLoading, setBookingLoading] = useState(false)

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [slug])

  const fetchProfile = async () => {
    try {
      const { data: profileData, error } = await supabase.from('profiles').select('*').eq('slug', slug).single()
      if (error || !profileData) throw new Error('Profissional não encontrado')
      setProfile(profileData)

      const now = new Date().toISOString()
      const { data: slotsData } = await supabase.from('availability_slots').select('*').eq('user_id', profileData.id).eq('is_booked', false).gte('start_time', now).order('start_time', { ascending: true })
      setSlots(slotsData || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleManualBooking = async () => {
    setBookingLoading(true)
    try {
      const { error: updateError } = await supabase.from('availability_slots').update({ is_booked: true }).eq('id', selectedSlot.id)
      if (updateError) throw updateError

      const { error: appointError } = await supabase.from('appointments').insert([{ slot_id: selectedSlot.id, patient_name: formData.name, patient_phone: formData.phone, status: 'pending_proof', pix_code: 'manual_whatsapp' }])
      if (appointError) throw appointError

      const dateStr = new Date(selectedSlot.start_time).toLocaleDateString('pt-BR')
      const timeStr = new Date(selectedSlot.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const message = `Olá! Fiz o agendamento para o dia *${dateStr}* às *${timeStr}*. Nome: *${formData.name}*. Segue o comprovante do Pix de R$ ${selectedSlot.price}:`
      const targetPhone = "5541995654050"
      const waLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => { window.open(waLink, '_blank'); setStep(4) }, 1500)

    } catch (err) { alert('Erro ao reservar: ' + err.message) } finally { setBookingLoading(false) }
  }

  // Calendar helper functions
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  const getStartDayOffset = () => {
    const firstDay = startOfMonth(currentMonth)
    return getDay(firstDay) // 0 = Sunday, 1 = Monday, etc.
  }

  const hasSlots = (date) => {
    return slots.some(slot => isSameDay(new Date(slot.start_time), date))
  }

  const getSlotsForDate = (date) => {
    if (!date) return []
    return slots.filter(slot => isSameDay(new Date(slot.start_time), date))
  }

  const isPastDay = (date) => {
    return isBefore(date, startOfDay(new Date()))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Perfil não encontrado</div>
  const firstName = profile.full_name.split(' ')[0]

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const daysInMonth = getDaysInMonth()
  const startOffset = getStartDayOffset()
  const filteredSlots = getSlotsForDate(selectedDate)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-6 sm:py-10 px-3 sm:px-4 relative overflow-x-hidden">
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply"></div></div>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center border-2 border-white relative">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-indigo-600">{firstName[0]}</span>}
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.full_name}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 flex items-center justify-center gap-1"><ShieldCheck size={14} className="text-green-500" /> Agendamento Seguro</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative animate-fade-in-up">
          <div className="h-1 bg-slate-50 w-full"><div className={`h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out`} style={{ width: `${step * 25}%` }}></div></div>

          <div className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Escolha uma data</h2>
                  {slots.length > 0 && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{slots.length} horários</span>}
                </div>

                {/* Calendar */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-colors">
                      <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-colors">
                      <ChevronRight size={20} className="text-slate-600" />
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: startOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* Days */}
                    {daysInMonth.map(day => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const hasSlotsForDay = hasSlots(day)
                      const isPast = isPastDay(day)
                      const isDisabled = isPast || !hasSlotsForDay

                      return (
                        <button
                          key={day.toString()}
                          onClick={() => !isDisabled && setSelectedDate(day)}
                          disabled={isDisabled}
                          className={`aspect-square rounded-xl text-sm font-bold transition-all relative
                             ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : ''}
                             ${!isSelected && hasSlotsForDay && !isPast ? 'bg-white text-slate-900 hover:bg-indigo-50 border border-slate-200' : ''}
                             ${isDisabled ? 'text-slate-300 cursor-not-allowed' : ''}
                           `}
                        >
                          {format(day, 'd')}
                          {hasSlotsForDay && !isPast && (
                            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Slots for Selected Date */}
                {selectedDate && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Horários para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    {filteredSlots.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <p className="text-slate-500 text-sm">Nenhum horário disponível</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredSlots.map(slot => {
                          const date = new Date(slot.start_time)
                          return (
                            <button key={slot.id} onClick={() => setSelectedSlot(slot)} className={`p-3 rounded-2xl border text-left transition-all ${selectedSlot?.id === slot.id ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-slate-200 hover:border-indigo-300'}`}>
                              <div className="text-lg font-black text-slate-900">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="text-xs font-bold text-indigo-600 mt-1">R$ {slot.price}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button disabled={!selectedSlot} onClick={() => setStep(2)} className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-indigo-600 transition-all shadow-lg flex justify-center items-center gap-2">Continuar <ArrowRight size={16} /></button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in-up">
                <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400">← Voltar</button>
                <h2 className="text-lg font-bold text-slate-900">Seus dados</h2>
                <div className="space-y-4">
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="Nome Completo" />
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="WhatsApp (DDD + Número)" />
                </div>
                <button disabled={!formData.name || !formData.phone} onClick={() => setStep(3)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-indigo-600 transition-all shadow-lg mt-4">Ver Chave Pix</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center animate-fade-in-up">
                <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-400 self-start block mb-4">← Voltar</button>
                <div className="mb-4"><h2 className="text-xl font-black text-slate-900 mb-1">Pagamento Pix</h2><p className="text-slate-500 text-sm px-4">Escaneie o QR Code ou copie a chave.</p></div>

                {/* CARD PIX COM QR CODE DINÂMICO */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col items-center gap-4 mb-6 relative hover:border-indigo-200 transition-colors">
                  {/* AQUI É A MUDANÇA: Mostra a imagem se tiver, ou o ícone se não tiver */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    {profile.pix_qrcode_url ? (
                      <img src={profile.pix_qrcode_url} className="w-40 h-40 object-cover rounded-xl" alt="QR Code Pix" />
                    ) : (
                      <QrCode size={160} className="text-slate-900" />
                    )}
                  </div>

                  <div className="text-center w-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chave Pix</p>
                    <p className="font-mono text-sm font-black text-slate-900 break-all bg-white px-3 py-2 rounded-lg border border-slate-200 mb-2">{profile.pix_key || "Chave não cadastrada"}</p>

                    <button onClick={() => { navigator.clipboard.writeText(profile.pix_key); alert('Chave copiada!') }} className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 text-indigo-600 font-bold text-xs hover:bg-indigo-50 shadow-sm flex items-center justify-center gap-2">
                      <Copy size={14} /> Copiar Chave
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-left mb-4">
                  <p className="text-xs font-bold text-green-800 uppercase mb-1">Próximo passo:</p>
                  <p className="text-sm text-green-900 leading-snug">Após pagar <strong>R$ {selectedSlot.price}</strong>, clique abaixo para enviar o comprovante.</p>
                </div>

                <button onClick={handleManualBooking} disabled={bookingLoading} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 active:scale-95">
                  {bookingLoading ? <Loader2 className="animate-spin" size={20} /> : <><MessageCircle size={20} /> Enviar Comprovante no WhatsApp</>}
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-6 animate-fade-in-up">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6"><MessageCircle size={48} /></div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Conversa Iniciada!</h2>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">Se a janela do WhatsApp não abriu, verifique se o bloqueador de pop-ups está ativo.</p>
                <button onClick={() => window.location.reload()} className="text-indigo-600 font-bold hover:text-indigo-800">Voltar para o início</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
