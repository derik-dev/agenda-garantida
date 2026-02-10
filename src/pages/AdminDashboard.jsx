import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Calendar as CalendarIcon, Clock, Trash2, Plus, Copy, LogOut, ExternalLink, Loader2,
  Wallet, Sparkles, TrendingUp, Users, MessageCircle, Phone,
  Settings as SettingsIcon, ChevronLeft, ChevronRight, Zap, CalendarDays, CheckCircle2
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [slots, setSlots] = useState([])
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('slots')

  // Estados do Calendário
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Estados do Formulário
  const [time, setTime] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estados do Modal de Configuração
  const [showFillModal, setShowFillModal] = useState(false)
  const [fillType, setFillType] = useState('month') // 'month' ou 'year'
  const [includeWeekends, setIncludeWeekends] = useState(false)
  const [includeHolidays, setIncludeHolidays] = useState(false)
  const [useCustomHours, setUseCustomHours] = useState(false)
  const [startHour, setStartHour] = useState('08:00')
  const [endHour, setEndHour] = useState('18:00')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'slots') fetchSlots(user.id)
      if (activeTab === 'appointments') fetchAppointments(user.id)
    }
  }, [activeTab, user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)
    fetchSlots(session.user.id)
    fetchAppointments(session.user.id)
  }

  const fetchSlots = async (userId) => {
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    setSlots(data || [])
    setLoading(false)
  }

  const fetchAppointments = async (userId) => {
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        availability_slots!inner (
          start_time,
          price,
          user_id
        )
      `)
      .eq('availability_slots.user_id', userId)
      .order('created_at', { ascending: false })

    setAppointments(data || [])
  }

  // --- ATIVAR UM SLOT FANTASMA (RASCUNHO -> REAL) ---
  const handleActivateGhost = async (ghostTime) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      // Criar data UTC para evitar problemas de fuso horário
      const startDateTime = new Date(`${dateStr}T${ghostTime}:00.000Z`)
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
      const isoString = startDateTime.toISOString()

      const { error } = await supabase
        .from('availability_slots')
        .insert([{
          user_id: user.id,
          start_time: isoString,
          end_time: endDateTime.toISOString(),
          price: profile.price,
          is_booked: false
        }])

      if (error) throw error
      fetchSlots(user.id) // Recarrega para virar slot real
    } catch (error) {
      alert('Erro ao ativar horário: ' + error.message)
    }
  }

  // --- ATIVAR O DIA TODO (TURBO) ---
  const handleActivateDay = async () => {
    setCreating(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      // Filtra apenas os ghosts
      const slotsToCreate = combinedSlots
        .filter(s => s.isGhost)
        .map(s => {
          const startDateTime = new Date(`${dateStr}T${s.time}:00`)
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
          return {
            user_id: user.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            price: profile.price,
            is_booked: false
          }
        })

      if (slotsToCreate.length === 0) return

      const { error } = await supabase.from('availability_slots').insert(slotsToCreate)
      if (error) throw error
      fetchSlots(user.id)
    } catch (error) {
      alert('Erro: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateSlotManual = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      // Criar data UTC para evitar problemas de fuso horário
      const startDateTime = new Date(`${dateStr}T${time}:00.000Z`)
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
      const isoString = startDateTime.toISOString()

      const exists = slots.some(s => s.start_time === isoString)
      if (exists) {
        alert('Horário já existe!')
        setCreating(false)
        return
      }

      const { error } = await supabase.from('availability_slots').insert([{
        user_id: user.id,
        start_time: isoString,
        end_time: endDateTime.toISOString(),
        price: profile.price,
        is_booked: false
      }])
      if (error) throw error
      setTime('')
      fetchSlots(user.id)
    } catch (error) { alert(error.message) } finally { setCreating(false) }
  }

  // Função para verificar se é feriado brasileiro
  const isBrazilianHoliday = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // Feriados fixos
    const fixedHolidays = [
      { month: 1, day: 1 },   // Ano Novo
      { month: 4, day: 21 },  // Tiradentes
      { month: 5, day: 1 },   // Dia do Trabalho
      { month: 9, day: 7 },   // Independência
      { month: 10, day: 12 }, // Nossa Senhora Aparecida
      { month: 11, day: 2 },  // Finados
      { month: 11, day: 15 }, // Proclamação da República
      { month: 12, day: 25 }, // Natal
    ]

    return fixedHolidays.some(h => h.month === month && h.day === day)
  }

  // Gera array de horários baseado na seleção do usuário
  const generateHoursArray = () => {
    if (!useCustomHours) {
      // Horários padrão (8h-18h, exceto 12h)
      return [8, 9, 10, 11, 13, 14, 15, 16, 17, 18]
    } else {
      // Horários personalizados
      const [startH, startM] = startHour.split(':').map(Number)
      const [endH, endM] = endHour.split(':').map(Number)
      const hours = []

      for (let h = startH; h <= endH; h++) {
        // Se for a hora final e tiver minutos, não incluir
        if (h === endH && endM === 0) break
        hours.push(h)
      }

      return hours
    }
  }

  const handleFillMonth = async () => {
    setCreating(true)
    try {
      const slotsToCreate = []
      const hoursToUse = generateHoursArray()
      const { days, year, month } = getDaysInMonth(currentDate)
      const today = new Date(); today.setHours(0, 0, 0, 0)

      const startDateStr = new Date(year, month, 1).toISOString()
      const endDateStr = new Date(year, month + 1, 0).toISOString()
      const { data: existingSlots } = await supabase.from('availability_slots').select('start_time').eq('user_id', user.id).gte('start_time', startDateStr).lte('start_time', endDateStr)
      const existingTimes = new Set(existingSlots?.map(s => s.start_time) || [])

      for (let d = 1; d <= days; d++) {
        const currentLoopDate = new Date(year, month, d)
        if (currentLoopDate < today) continue

        const dayOfWeek = currentLoopDate.getDay()
        // Pula fins de semana se não incluir
        if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue
        // Pula feriados se não incluir
        if (!includeHolidays && isBrazilianHoliday(currentLoopDate)) continue

        const dateStr = currentLoopDate.toISOString().split('T')[0]

        for (const hour of hoursToUse) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`
          // Criar data UTC para evitar problemas de fuso horário
          const startDateTime = new Date(`${dateStr}T${timeStr}:00.000Z`)
          const isoString = startDateTime.toISOString()
          if (!existingTimes.has(isoString)) {
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
            slotsToCreate.push({ user_id: user.id, start_time: isoString, end_time: endDateTime.toISOString(), price: profile.price, is_booked: false })
          }
        }
      }
      if (slotsToCreate.length > 0) {
        await supabase.from('availability_slots').insert(slotsToCreate)
        await fetchSlots(user.id)
        alert(`${slotsToCreate.length} horários criados com sucesso!`)
      } else { alert('Agenda cheia!') }
    } catch (error) { alert(error.message) } finally {
      setCreating(false)
      setShowFillModal(false)
    }
  }

  const handleFillYear = async () => {
    setCreating(true)
    try {
      const slotsToCreate = []
      const hoursToUse = generateHoursArray()
      const { year } = getDaysInMonth(currentDate)
      const today = new Date(); today.setHours(0, 0, 0, 0)

      // Buscar todos os slots existentes do ano
      const startYearStr = new Date(year, 0, 1).toISOString()
      const endYearStr = new Date(year, 11, 31, 23, 59, 59).toISOString()
      const { data: existingSlots } = await supabase.from('availability_slots').select('start_time').eq('user_id', user.id).gte('start_time', startYearStr).lte('start_time', endYearStr)
      const existingTimes = new Set(existingSlots?.map(s => s.start_time) || [])

      // Percorrer todos os 12 meses
      for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate()

        for (let d = 1; d <= daysInMonth; d++) {
          const currentLoopDate = new Date(year, m, d)
          if (currentLoopDate < today) continue

          const dayOfWeek = currentLoopDate.getDay()
          // Pula fins de semana se não incluir
          if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue
          // Pula feriados se não incluir
          if (!includeHolidays && isBrazilianHoliday(currentLoopDate)) continue

          const dateStr = currentLoopDate.toISOString().split('T')[0]

          for (const hour of hoursToUse) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`
            // Criar data UTC para evitar problemas de fuso horário
            const startDateTime = new Date(`${dateStr}T${timeStr}:00.000Z`)
            const isoString = startDateTime.toISOString()
            if (!existingTimes.has(isoString)) {
              const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
              slotsToCreate.push({ user_id: user.id, start_time: isoString, end_time: endDateTime.toISOString(), price: profile.price, is_booked: false })
            }
          }
        }
      }

      if (slotsToCreate.length > 0) {
        await supabase.from('availability_slots').insert(slotsToCreate)
        await fetchSlots(user.id)
        alert(`${slotsToCreate.length} horários criados com sucesso!`)
      } else { alert('Agenda cheia!') }
    } catch (error) { alert(error.message) } finally {
      setCreating(false)
      setShowFillModal(false)
    }
  }

  const openFillModal = (type) => {
    setFillType(type)
    setIncludeWeekends(false)
    setIncludeHolidays(false)
    setUseCustomHours(false)
    setStartHour('08:00')
    setEndHour('18:00')
    setShowFillModal(true)
  }

  const handleConfirmFill = () => {
    if (fillType === 'month') {
      handleFillMonth()
    } else {
      handleFillYear()
    }
  }

  const handleCleanupDuplicates = async () => {
    if (!confirm('Remover horários duplicados? Esta ação não pode ser desfeita.')) return
    setCreating(true)
    try {
      // Buscar todos os slots do usuário
      const { data: allSlots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true })

      if (!allSlots || allSlots.length === 0) {
        alert('Nenhum horário encontrado.')
        setCreating(false)
        return
      }

      // Agrupar por start_time
      const slotsByTime = {}
      allSlots.forEach(slot => {
        if (!slotsByTime[slot.start_time]) {
          slotsByTime[slot.start_time] = []
        }
        slotsByTime[slot.start_time].push(slot)
      })

      // Identificar duplicatas (manter o primeiro, deletar os outros)
      const idsToDelete = []
      Object.values(slotsByTime).forEach(slots => {
        if (slots.length > 1) {
          // Manter o primeiro, deletar os outros
          for (let i = 1; i < slots.length; i++) {
            idsToDelete.push(slots[i].id)
          }
        }
      })

      if (idsToDelete.length === 0) {
        alert('Nenhuma duplicata encontrada!')
        setCreating(false)
        return
      }

      // Deletar duplicatas
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .in('id', idsToDelete)

      if (error) throw error

      await fetchSlots(user.id)
      alert(`${idsToDelete.length} horários duplicados removidos com sucesso!`)
    } catch (error) {
      alert('Erro ao limpar duplicatas: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) return

    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar slot:', error)
        alert('Erro ao deletar horário: ' + error.message)
        return
      }

      // Atualizar lista local
      setSlots(slots.filter(slot => slot.id !== id))

      // Recarregar slots para garantir sincronização
      await fetchSlots(user.id)
    } catch (error) {
      console.error('Erro ao deletar slot:', error)
      alert('Erro ao deletar horário: ' + error.message)
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/') }
  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/agenda-garantida/${profile?.slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  // CALENDÁRIO
  const getDaysInMonth = (date) => {
    const year = date.getFullYear(); const month = date.getMonth()
    return { days: new Date(year, month + 1, 0).getDate(), firstDay: new Date(year, month, 1).getDay(), year, month }
  }
  const { days, firstDay, year, month } = getDaysInMonth(currentDate)
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const hasSlotsOnDay = (day) => slots.some(slot => {
    const d = new Date(slot.start_time)
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
  })

  // --- LÓGICA DE GHOST SLOTS (COMBINADA) ---
  const getCombinedSlots = () => {
    const realSlots = slots.filter(slot => {
      const d = new Date(slot.start_time)
      return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()
    }).map(s => ({ ...s, isGhost: false, time: new Date(s.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))

    const standardHours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18]
    const ghostSlots = []

    standardHours.forEach(h => {
      const timeStr = `${h.toString().padStart(2, '0')}:00`
      // Só cria fantasma se não existir um real (livre ou ocupado) naquele horário
      const exists = realSlots.some(r => r.time === timeStr)
      if (!exists) {
        ghostSlots.push({ id: `ghost-${h}`, time: timeStr, price: profile?.price, isGhost: true })
      }
    })

    // Junta e ordena
    return [...realSlots, ...ghostSlots].sort((a, b) => parseInt(a.time) - parseInt(b.time))
  }

  const combinedSlots = getCombinedSlots()
  const ghostCount = combinedSlots.filter(s => s.isGhost).length

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  const firstName = profile?.full_name?.split(' ')[0]
  const totalRevenue = appointments.reduce((acc, curr) => acc + (curr.availability_slots?.price || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-4 lg:pb-20 relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none bg-slate-50"><div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-90 contrast-150"></div></div>

      <nav className="sticky top-2 lg:top-4 z-50 px-3 sm:px-4 lg:px-6 mb-4 lg:mb-8">
        <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-2xl border border-slate-200/50 rounded-xl lg:rounded-2xl px-4 sm:px-6 py-2.5 lg:py-3 flex justify-between items-center shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg lg:rounded-xl bg-white border border-slate-100 flex items-center justify-center"><CalendarIcon size={16} className="text-indigo-600 sm:w-[18px] sm:h-[18px]" /></div>
            <div className="hidden sm:block"><h1 className="font-bold text-slate-900 text-xs sm:text-sm">Painel de Controle</h1><p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Olá, {firstName}</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/admin/settings')} className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg lg:rounded-xl shadow-sm"><SettingsIcon size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg lg:rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 shadow-sm"><LogOut size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Sair</span></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-8 animate-fade-in-up">

        {/* HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          <div className="md:col-span-8 rounded-2xl lg:rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[180px] sm:h-[200px] text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[80px] opacity-40"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div><h2 className="text-xl sm:text-2xl font-black text-white mb-1">Visão Geral</h2><p className="text-indigo-100 text-xs sm:text-sm">Gerencie seus horários e acompanhe seus pacientes.</p></div>
              <div className="hidden lg:flex p-1.5 bg-white/10 border border-white/20 rounded-xl gap-1 backdrop-blur-md">
                <button onClick={() => setActiveTab('slots')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${activeTab === 'slots' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100'}`}><CalendarIcon size={14} /> Calendário</button>
                <button onClick={() => setActiveTab('appointments')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${activeTab === 'appointments' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100'}`}><Users size={14} /> Pacientes</button>
              </div>
            </div>
            <div className="relative z-10 mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 bg-indigo-800/40 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-mono truncate text-indigo-100 flex items-center gap-2"><ExternalLink size={12} className="opacity-50 hidden sm:block" /> <span className="truncate">agendagarantida.com/{profile?.slug}</span></div>
              <button onClick={copyLink} className="bg-white text-indigo-900 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs hover:bg-indigo-50 flex items-center justify-center gap-2 whitespace-nowrap">{copied ? 'Copiado!' : <><Copy size={14} /> <span className="hidden sm:inline">Copiar</span> Link</>}</button>
            </div>
          </div>
          <div className="md:col-span-4 bg-white/70 backdrop-blur-xl border border-slate-200/60 p-5 sm:p-6 rounded-2xl lg:rounded-[2rem] shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:gap-3 text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4"><div className="p-1.5 bg-green-50 rounded-lg text-green-600 border border-green-100"><Wallet size={12} className="sm:w-[14px] sm:h-[14px]" /></div>Faturamento Total</div>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {activeTab === 'slots' && (
          <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-start animate-fade-in-up">
            <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-slate-200/60 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2"><h3 className="text-lg sm:text-xl font-black text-slate-900 capitalize">{monthNames[month]} <span className="text-slate-400 font-bold ml-1">{year}</span></h3><div className="flex gap-1 ml-2"><button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"><ChevronLeft size={16} /></button><button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"><ChevronRight size={16} /></button></div></div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => openFillModal('month')} disabled={creating} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center gap-1.5 sm:gap-2">{creating ? <Loader2 className="animate-spin" size={14} /> : <CalendarDays size={14} />} <span className="hidden sm:inline">Preencher</span> Mês</button>
                  <button onClick={() => openFillModal('year')} disabled={creating} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold rounded-xl border border-purple-100 hover:bg-purple-100 flex items-center justify-center gap-1.5 sm:gap-2">{creating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} <span className="hidden sm:inline">Preencher</span> Ano</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4 mb-4">
                {weekDays.map(day => <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">{day}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2 sm:p-4"></div>)}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1; const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(); const isSelected = day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear(); const hasSlots = hasSlotsOnDay(day)
                  return (
                    <button key={day} onClick={() => setSelectedDate(new Date(year, month, day))} className={`relative p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center gap-0.5 sm:gap-1 border min-h-[44px] sm:min-h-0 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 scale-105 z-10' : 'bg-white text-slate-700 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'} ${isToday && !isSelected ? 'ring-2 ring-indigo-100' : ''}`}>
                      <span className={isToday && !isSelected ? 'text-indigo-600' : ''}>{day}</span>
                      {hasSlots && <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              {/* CABEÇALHO DO DIA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">Dia {selectedDate.getDate()} <span className="text-slate-400 font-medium text-base sm:text-lg">{monthNames[month]}</span></h4>
                  <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{ghostCount} horários disponíveis para ativar</p>
                </div>
                {ghostCount > 0 && (
                  <button onClick={handleActivateDay} disabled={creating} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 animate-pulse min-h-[44px] sm:min-h-0">
                    {creating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} fill="currentColor" className="text-yellow-400" />}
                    Confirmar Todos
                  </button>
                )}
              </div>

              {/* LISTA HÍBRIDA (REAIS + FANTASMAS) */}
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {combinedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`
                            p-4 rounded-2xl border flex justify-between items-center transition-all
                            ${slot.isGhost
                        ? 'bg-slate-50 border-dashed border-slate-300 opacity-80 hover:opacity-100 hover:border-indigo-400 cursor-pointer group'
                        : slot.is_booked
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-slate-200 shadow-sm'
                      }
                        `}
                    onClick={() => slot.isGhost && handleActivateGhost(slot.time)}
                  >
                    <div className="flex items-center gap-3">
                      {slot.isGhost ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                          <Plus size={16} className="text-slate-500 group-hover:text-white" />
                        </div>
                      ) : (
                        <Clock size={18} className={slot.is_booked ? "text-red-400" : "text-indigo-500"} />
                      )}

                      <div>
                        <span className={`text-xl font-black ${slot.isGhost ? 'text-slate-400 group-hover:text-indigo-600' : slot.is_booked ? 'text-red-900' : 'text-slate-900'}`}>
                          {slot.time}
                        </span>
                        {slot.isGhost && <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-indigo-500">Toque para ativar</p>}
                      </div>

                      {!slot.isGhost && (
                        slot.is_booked ? (
                          <span className="ml-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md border border-red-200">OCUPADO</span>
                        ) : (
                          <span className="ml-2 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md border border-green-100 flex items-center gap-1"><CheckCircle2 size={10} /> ATIVO</span>
                        )
                      )}
                    </div>

                    {!slot.isGhost && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id) }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* ADICIONAR MANUAL (SE QUISER OUTRO HORÁRIO) */}
              <div className="pt-3 sm:pt-4 border-t border-slate-200 space-y-3">
                <form onSubmit={handleCreateSlotManual} className="flex gap-2 sm:gap-3 items-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Outro:</span>
                  <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="flex-1 p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-bold text-slate-900 text-sm min-h-[44px] sm:min-h-0" />
                  <button type="submit" disabled={creating} className="p-2.5 sm:p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"><Plus size={20} /></button>
                </form>

                {/* Botão de Limpeza de Duplicatas */}
                <button
                  onClick={handleCleanupDuplicates}
                  disabled={creating}
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                  title="Remover horários duplicados do banco de dados"
                >
                  {creating ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Limpar Duplicatas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA PACIENTES */}
        {activeTab === 'appointments' && (
          <div className="animate-fade-in-up">
            {appointments.length === 0 ? <div className="bg-white/50 backdrop-blur border-2 border-dashed border-slate-300 rounded-2xl lg:rounded-[2rem] p-12 sm:p-16 text-center"><p className="text-slate-500 text-sm sm:text-base">Sem pacientes.</p></div> :
              <div className="grid gap-3 sm:gap-4">{appointments.map((app) => (
                <div key={app.id} className="bg-white p-4 sm:p-6 rounded-xl lg:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="font-bold text-base sm:text-lg">{app.patient_name}</div>
                    <div className="text-xs sm:text-sm text-slate-500 mt-1">{new Date(app.availability_slots.start_time).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-slate-400 mt-1 sm:hidden">{app.patient_phone}</div>
                  </div>
                  <a href={`https://wa.me/55${app.patient_phone}`} target="_blank" className="w-full sm:w-auto bg-green-500 text-white px-4 py-2.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0"><MessageCircle size={16} className="sm:hidden" />WhatsApp</a>
                </div>
              ))}</div>
            }
          </div>
        )}
      </div>

      {/* Modal de Configuração de Preenchimento */}
      {showFillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Preencher {fillType === 'month' ? 'Mês' : 'Ano'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
              Configure as opções de preenchimento automático
            </p>

            <div className="space-y-4 mb-6">
              {/* Checkbox Finais de Semana */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeWeekends}
                  onChange={(e) => setIncludeWeekends(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Incluir Finais de Semana</div>
                  <div className="text-xs text-slate-500">Sábados e Domingos</div>
                </div>
              </label>

              {/* Checkbox Feriados */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeHolidays}
                  onChange={(e) => setIncludeHolidays(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Incluir Feriados</div>
                  <div className="text-xs text-slate-500">Feriados nacionais brasileiros</div>
                </div>
              </label>
            </div>

            {/* Seção de Horários */}
            <div className="space-y-3 mb-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Horários de Atendimento</h4>

              {/* Radio: Horários Padrão */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="radio"
                  name="hoursType"
                  checked={!useCustomHours}
                  onChange={() => setUseCustomHours(false)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900">Horários Padrão</div>
                  <div className="text-xs text-slate-500">8h às 18h (exceto 12h)</div>
                </div>
              </label>

              {/* Radio: Horários Personalizados */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="radio"
                  name="hoursType"
                  checked={useCustomHours}
                  onChange={() => setUseCustomHours(true)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-3">Horários Personalizados</div>

                  {useCustomHours && (
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Início</label>
                        <input
                          type="time"
                          value={startHour}
                          onChange={(e) => setStartHour(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Fim</label>
                        <input
                          type="time"
                          value={endHour}
                          onChange={(e) => setEndHour(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowFillModal(false)}
                className="flex-1 px-4 sm:px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-200 transition-all min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFill}
                disabled={creating}
                className="flex-1 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {creating ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 safe-area-inset-bottom">
        <div className="flex justify-around py-3 px-4">
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all ${activeTab === 'slots' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
          >
            <CalendarIcon size={22} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wide">Calendário</span>
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all ${activeTab === 'appointments' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
          >
            <Users size={22} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wide">Pacientes</span>
          </button>
        </div>
      </div>
    </div>
  )
}