import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowRight,
  BatteryLow,
  BellRing,
  Brain,
  CalendarHeart,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Coffee,
  HeartHandshake,
  Home,
  Inbox,
  KeyRound,
  Lightbulb,
  ListChecks,
  MapPin,
  MessageCircleHeart,
  MoonStar,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldHeart,
  Sparkles,
  TimerReset,
  Trash2,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'

type Category = 'Chore' | 'Conversation' | 'Date' | 'Reminder' | 'Decision'
type Owner = 'Me' | 'Partner' | 'Together' | 'Unowned'
type Energy = 'low' | 'medium' | 'high'
type Budget = 'free' | 'cheap' | 'treat'
type TimeWindow = '30m' | '1h' | '2h+'
type Tab = 'Tonight' | 'Inbox' | 'Together' | 'Life' | 'More'

type InboxItem = {
  id: string
  text: string
  category: Category
  owner: Owner
  createdAt: number
  deferredUntil?: number
  done?: boolean
  invisibleLabour?: 'planning' | 'remembering' | 'booking' | 'following-up'
  createdBy: 'Me' | 'Partner'
}

type ObjectMemory = {
  id: string
  object: string
  location: string
  updatedAt: number
}

type AutopilotItem = {
  id: string
  label: string
  cadence: string
  next: string
  owner: Owner
}

type AppData = {
  items: InboxItem[]
  objects: ObjectMemory[]
  autopilot: AutopilotItem[]
  meName: string
  partnerName: string
}

const STORAGE_KEY = 'us-later-data-v1'

const starterData: AppData = {
  meName: 'You',
  partnerName: 'Alex',
  items: [
    {
      id: '1',
      text: 'Buy dog food before the weekend',
      category: 'Chore',
      owner: 'Unowned',
      createdAt: Date.now() - 1000 * 60 * 60 * 4,
      createdBy: 'Me',
      invisibleLabour: 'remembering',
    },
    {
      id: '2',
      text: 'Ask Sam about Christmas plans',
      category: 'Conversation',
      owner: 'Together',
      createdAt: Date.now() - 1000 * 60 * 60 * 10,
      createdBy: 'Partner',
      invisibleLabour: 'following-up',
    },
    {
      id: '3',
      text: 'Night market date idea',
      category: 'Date',
      owner: 'Together',
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
      createdBy: 'Me',
      invisibleLabour: 'planning',
    },
    {
      id: '4',
      text: 'I felt hurt when dinner plans changed',
      category: 'Conversation',
      owner: 'Together',
      createdAt: Date.now() - 1000 * 60 * 50,
      deferredUntil: Date.now() + 1000 * 60 * 60 * 14,
      createdBy: 'Partner',
    },
    {
      id: '5',
      text: 'Book the dog vaccination appointment',
      category: 'Reminder',
      owner: 'Unowned',
      createdAt: Date.now() - 1000 * 60 * 60 * 52,
      createdBy: 'Me',
      invisibleLabour: 'booking',
    },
  ],
  objects: [
    { id: 'o1', object: 'Passports', location: 'Top drawer, hallway console — blue zip pouch', updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 8 },
    { id: 'o2', object: 'Spare key', location: 'Kitchen junk drawer, back-left tray', updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3 },
  ],
  autopilot: [
    { id: 'a1', label: 'Bins out', cadence: 'Weekly · Thu night', next: 'Thursday', owner: 'Together' },
    { id: 'a2', label: 'Dog flea treatment', cadence: 'Monthly', next: '12 Sep', owner: 'Partner' },
    { id: 'a3', label: 'Car rego', cadence: 'Yearly', next: '18 Oct', owner: 'Unowned' },
  ],
}

const categories: Category[] = ['Chore', 'Conversation', 'Date', 'Reminder', 'Decision']

const dateIdeas = [
  { title: 'Dessert mission', energy: 'low', budget: 'cheap', time: '30m', blurb: 'Pick one place you have never tried. Share one dessert and rate it dramatically.' },
  { title: 'Sunset snack walk', energy: 'low', budget: 'free', time: '1h', blurb: 'Bring whatever snacks are already at home and walk somewhere with a view.' },
  { title: 'Two-stop mystery date', energy: 'medium', budget: 'cheap', time: '2h+', blurb: 'Each person secretly chooses one stop. Reveal the next destination only when you leave.' },
  { title: 'Op-shop challenge', energy: 'high', budget: 'cheap', time: '2h+', blurb: 'Set a tiny budget and find the funniest or most “us” object for each other.' },
  { title: 'Kitchen floor picnic', energy: 'low', budget: 'free', time: '30m', blurb: 'Put phones away, sit somewhere you normally would not, and eat whatever is easiest.' },
  { title: 'Mini adventure drive', energy: 'medium', budget: 'treat', time: '2h+', blurb: 'Pick a direction, drive 20 minutes, then stop at the first place that looks interesting.' },
  { title: 'Fast photo scavenger hunt', energy: 'high', budget: 'free', time: '1h', blurb: 'Find: something heart-shaped, something tiny, something absurd, and something beautiful.' },
  { title: 'Fancy drink, no occasion', energy: 'medium', budget: 'treat', time: '1h', blurb: 'Go somewhere nice for one drink each and pretend you are celebrating a mysterious achievement.' },
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function smartCategory(text: string): Category {
  const t = text.toLowerCase()
  if (/hurt|upset|talk|ask|tell|feel|argument|conversation|discuss/.test(t)) return 'Conversation'
  if (/date|night market|restaurant|movie|picnic|cute|weekend idea|activity/.test(t)) return 'Date'
  if (/decide|choose|which|whether|decision/.test(t)) return 'Decision'
  if (/remind|remember|appointment|birthday|bill|rego|prescription|call/.test(t)) return 'Reminder'
  return 'Chore'
}

function smartLabour(text: string): InboxItem['invisibleLabour'] {
  const t = text.toLowerCase()
  if (/book|appointment|reserve|register/.test(t)) return 'booking'
  if (/ask|follow|reply|check with/.test(t)) return 'following-up'
  if (/plan|organise|organize|date|christmas|birthday/.test(t)) return 'planning'
  return 'remembering'
}

function formatAge(timestamp: number) {
  const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return starterData
    try { return JSON.parse(saved) as AppData } catch { return starterData }
  })
  const [tab, setTab] = useState<Tab>('Tonight')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const unfinished = useMemo(() => data.items.filter(i => !i.done), [data.items])
  const tonight = useMemo(() => {
    const now = Date.now()
    return [...unfinished]
      .filter(i => !i.deferredUntil || i.deferredUntil <= now)
      .sort((a, b) => {
        const weight = (item: InboxItem) => {
          let score = 0
          if (item.owner === 'Unowned') score += 4
          if (item.category === 'Conversation') score += 3
          if (item.category === 'Reminder') score += 2
          score += Math.min(4, (now - item.createdAt) / (1000 * 60 * 60 * 24))
          return score
        }
        return weight(b) - weight(a)
      })
      .slice(0, 3)
  }, [unfinished])

  function saveItem(text: string, options?: Partial<InboxItem>) {
    const clean = text.trim()
    if (!clean) return
    const item: InboxItem = {
      id: uid(),
      text: clean,
      category: options?.category ?? smartCategory(clean),
      owner: options?.owner ?? 'Unowned',
      createdAt: Date.now(),
      createdBy: options?.createdBy ?? 'Me',
      invisibleLabour: options?.invisibleLabour ?? smartLabour(clean),
      deferredUntil: options?.deferredUntil,
      done: false,
    }
    setData(d => ({ ...d, items: [item, ...d.items] }))
    setQuickText('')
    setQuickAddOpen(false)
    setToast(`Caught it. Filed under ${item.category.toLowerCase()}.`)
  }

  function patchItem(id: string, patch: Partial<InboxItem>) {
    setData(d => ({ ...d, items: d.items.map(i => i.id === id ? { ...i, ...patch } : i) }))
  }

  function removeItem(id: string) {
    setData(d => ({ ...d, items: d.items.filter(i => i.id !== id) }))
  }

  const nav: Array<{ tab: Tab; icon: typeof Home; label: string }> = [
    { tab: 'Tonight', icon: MoonStar, label: 'Tonight' },
    { tab: 'Inbox', icon: Inbox, label: 'Inbox' },
    { tab: 'Together', icon: Users, label: 'Together' },
    { tab: 'Life', icon: RefreshCw, label: 'Life' },
    { tab: 'More', icon: MoreHorizontal, label: 'More' },
  ]

  return (
    <div className="app-shell">
      <main className="app-main">
        <header className="topbar">
          <div>
            <div className="eyebrow">US, LATER</div>
            <h1>{tab === 'Tonight' ? 'Only what matters now.' : tab}</h1>
          </div>
          <button className="avatar-pair" onClick={() => setTab('More')} aria-label="Open settings">
            <span>Y</span><span>A</span>
          </button>
        </header>

        {tab === 'Tonight' && <TonightView items={tonight} unfinished={unfinished.length} onDone={(id) => patchItem(id, { done: true })} onOwn={(id, owner) => patchItem(id, { owner })} onOpenInbox={() => setTab('Inbox')} onAdd={() => setQuickAddOpen(true)} />}
        {tab === 'Inbox' && <InboxView items={data.items} onAdd={() => setQuickAddOpen(true)} onPatch={patchItem} onRemove={removeItem} />}
        {tab === 'Together' && <TogetherView onCapture={(text, delayHours) => saveItem(text, { category: 'Conversation', owner: 'Together', deferredUntil: Date.now() + delayHours * 3600000 })} />}
        {tab === 'Life' && <LifeView data={data} setData={setData} />}
        {tab === 'More' && <MoreView data={data} setData={setData} />}
      </main>

      <button className="fab" onClick={() => setQuickAddOpen(true)} aria-label="Add to mental inbox"><Plus size={28} /></button>

      <nav className="bottom-nav" aria-label="Main navigation">
        {nav.map(({ tab: n, icon: Icon, label }) => (
          <button key={n} className={classNames('nav-item', tab === n && 'active')} onClick={() => setTab(n)}>
            <Icon size={21} strokeWidth={tab === n ? 2.6 : 2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {quickAddOpen && (
        <div className="sheet-backdrop" onMouseDown={() => setQuickAddOpen(false)}>
          <section className="sheet" onMouseDown={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title-row">
              <div>
                <div className="eyebrow">MENTAL INBOX</div>
                <h2>Catch it before it disappears.</h2>
              </div>
              <button className="icon-btn" onClick={() => setQuickAddOpen(false)}><X size={20} /></button>
            </div>
            <textarea autoFocus value={quickText} onChange={e => setQuickText(e.target.value)} placeholder='Try “we need dog food” or “I felt hurt when plans changed”' rows={5} />
            {quickText.trim() && (
              <div className="smart-preview">
                <Sparkles size={17} /> Looks like <strong>{smartCategory(quickText)}</strong> · {smartLabour(quickText)?.replace('-', ' ')}
              </div>
            )}
            <button className="primary-btn wide" onClick={() => saveItem(quickText)}>Save for later <ArrowRight size={18} /></button>
            <p className="microcopy">No due date required. Us, Later will resurface it when it is useful.</p>
          </section>
        </div>
      )}

      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  )
}

function TonightView({ items, unfinished, onDone, onOwn, onOpenInbox, onAdd }: {
  items: InboxItem[]
  unfinished: number
  onDone: (id: string) => void
  onOwn: (id: string, owner: Owner) => void
  onOpenInbox: () => void
  onAdd: () => void
}) {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-kicker"><Brain size={16} /> Gentle triage</div>
        <h2>You two have {unfinished} unfinished {unfinished === 1 ? 'thing' : 'things'}.</h2>
        <p>Here are the {Math.min(3, items.length)} that matter tonight. The rest can stay safely out of your head.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={onAdd}><Plus size={18} /> Catch something</button>
          <button className="ghost-btn" onClick={onOpenInbox}>See all</button>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div><span className="eyebrow">TONIGHT'S THREE</span><h3>Small enough to start</h3></div>
          <span className="soft-badge">No overdue shame</span>
        </div>
        <div className="focus-list">
          {items.length ? items.map((item, idx) => (
            <article className="focus-card" key={item.id}>
              <div className="focus-num">{idx + 1}</div>
              <div className="focus-copy">
                <div className="item-meta"><CategoryPill category={item.category} /><span>{formatAge(item.createdAt)}</span></div>
                <h4>{item.text}</h4>
                <OwnerSelector value={item.owner} onChange={owner => onOwn(item.id, owner)} />
              </div>
              <button className="done-btn" onClick={() => onDone(item.id)} aria-label={`Complete ${item.text}`}><Check size={20} /></button>
            </article>
          )) : (
            <div className="empty-card"><Sparkles size={24} /><h4>Nothing needs you right now.</h4><p>Enjoy the suspiciously empty brain space.</p></div>
          )}
        </div>
      </section>

      <section className="nudge-card">
        <div className="nudge-icon"><HeartHandshake size={22} /></div>
        <div><span className="eyebrow">RELATIONSHIP NUDGE</span><h4>Two-minute check-in</h4><p>Ask: “Is there anything you want me to know before we switch off for the night?”</p></div>
      </section>
    </div>
  )
}

function InboxView({ items, onAdd, onPatch, onRemove }: {
  items: InboxItem[]
  onAdd: () => void
  onPatch: (id: string, patch: Partial<InboxItem>) => void
  onRemove: (id: string) => void
}) {
  const [filter, setFilter] = useState<'Open' | 'Done'>('Open')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const visible = items.filter(i => filter === 'Done' ? i.done : !i.done).filter(i => category === 'All' || i.category === category)

  return (
    <div className="page-stack">
      <section className="quick-capture-card" onClick={onAdd}>
        <Plus size={22} /><div><strong>Dump a thought</strong><span>Chore, feeling, reminder, idea — anything.</span></div><ChevronRight size={19} />
      </section>

      <div className="segmented"><button className={filter === 'Open' ? 'active' : ''} onClick={() => setFilter('Open')}>Open</button><button className={filter === 'Done' ? 'active' : ''} onClick={() => setFilter('Done')}>Done</button></div>
      <div className="chip-row scroll-x">
        {(['All', ...categories] as const).map(c => <button key={c} className={classNames('filter-chip', category === c && 'active')} onClick={() => setCategory(c)}>{c}</button>)}
      </div>

      <section className="inbox-list">
        {visible.map(item => (
          <article className={classNames('inbox-card', item.deferredUntil && item.deferredUntil > Date.now() && 'deferred')} key={item.id}>
            <div className="inbox-card-main">
              <div className="item-meta"><CategoryPill category={item.category}/><span>Added by {item.createdBy === 'Me' ? 'you' : 'Alex'} · {formatAge(item.createdAt)}</span></div>
              <h4>{item.text}</h4>
              {item.deferredUntil && item.deferredUntil > Date.now() && <div className="deferred-note"><Pause size={14}/> Parked until later</div>}
              {!item.done && <OwnerSelector value={item.owner} onChange={owner => onPatch(item.id, { owner })} />}
            </div>
            <div className="inbox-actions">
              {!item.done ? <button className="icon-btn soft" onClick={() => onPatch(item.id, { done: true })}><Check size={18}/></button> : <button className="icon-btn soft" onClick={() => onPatch(item.id, { done: false })}><RotateCcw size={17}/></button>}
              <button className="icon-btn soft danger" onClick={() => onRemove(item.id)}><Trash2 size={17}/></button>
            </div>
          </article>
        ))}
        {!visible.length && <div className="empty-card"><Archive size={24}/><h4>Nothing here.</h4><p>Your brain is allowed to forget this section exists.</p></div>}
      </section>
    </div>
  )
}

function TogetherView({ onCapture }: { onCapture: (text: string, delayHours: number) => void }) {
  return (
    <div className="page-stack">
      <BodyDouble />
      <ParkConversation onCapture={onCapture} />
      <RepairMode />
      <DopamineDate />
    </div>
  )
}

function BodyDouble() {
  const [seconds, setSeconds] = useState(20 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || seconds <= 0) return
    const timer = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(timer)
  }, [running, seconds])

  useEffect(() => { if (seconds <= 0) setRunning(false) }, [seconds])

  const min = Math.floor(seconds / 60).toString().padStart(2, '0')
  const sec = (seconds % 60).toString().padStart(2, '0')

  return (
    <section className="feature-card timer-card">
      <div className="feature-icon"><TimerReset size={23}/></div>
      <div className="feature-copy"><span className="eyebrow">COUPLE BODY-DOUBLING</span><h3>We both do boring stuff</h3><p>No coordinating required. Pick one annoying thing each and exist near each other.</p></div>
      <div className="timer-display">{min}:{sec}</div>
      <div className="timer-actions">
        <button className="primary-btn" onClick={() => setRunning(r => !r)}>{running ? <Pause size={18}/> : <Play size={18}/>} {running ? 'Pause' : seconds < 20 * 60 ? 'Resume' : 'Start 20 min'}</button>
        <button className="ghost-btn" onClick={() => { setRunning(false); setSeconds(20 * 60) }}><RotateCcw size={17}/> Reset</button>
      </div>
    </section>
  )
}

function ParkConversation({ onCapture }: { onCapture: (text: string, delayHours: number) => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  return (
    <section className="feature-card peach">
      <div className="feature-topline"><div className="feature-icon"><Pause size={22}/></div><span className="soft-badge">Protect the moment</span></div>
      <span className="eyebrow">DON'T DISCUSS THIS RIGHT NOW</span>
      <h3>Save the issue. Skip the explosion.</h3>
      <p>Capture what matters while it is fresh, then bring it back when both people have more capacity.</p>
      {!open ? <button className="secondary-btn wide" onClick={() => setOpen(true)}><MessageCircleHeart size={18}/> Park a conversation</button> : (
        <div className="inline-form">
          <textarea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="What do you want future-you-two to talk about?" />
          <div className="two-col-actions"><button className="primary-btn" onClick={() => { onCapture(text, 12); setText(''); setOpen(false) }}>Bring back tomorrow</button><button className="ghost-btn" onClick={() => setOpen(false)}>Cancel</button></div>
        </div>
      )}
    </section>
  )
}

function RepairMode() {
  const prompts = [
    'What were you trying to protect or get understood?',
    'What do you wish your partner knew about what was happening inside you?',
    'What is one thing you can own without taking all the blame?',
  ]
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [mine, setMine] = useState('')
  const [partner, setPartner] = useState('')

  if (!active) return (
    <section className="feature-card dark-card">
      <div className="feature-icon inverted"><ShieldHeart size={22}/></div>
      <span className="eyebrow light">REPAIR MODE</span>
      <h3>From argument to starting point.</h3>
      <p>Each person gets a short private prompt. The app turns both answers into something calmer to begin with.</p>
      <button className="light-btn" onClick={() => setActive(true)}>Start repair mode <ArrowRight size={18}/></button>
    </section>
  )

  return (
    <section className="feature-card dark-card">
      {step < 2 ? (
        <>
          <span className="eyebrow light">PRIVATE · {step === 0 ? 'YOUR TURN' : 'PARTNER TURN'}</span>
          <h3>{prompts[step]}</h3>
          <textarea className="dark-textarea" rows={4} value={step === 0 ? mine : partner} onChange={e => step === 0 ? setMine(e.target.value) : setPartner(e.target.value)} placeholder="60 seconds. Messy is fine." />
          <button className="light-btn" onClick={() => setStep(s => s + 1)} disabled={step === 0 ? !mine.trim() : !partner.trim()}>{step === 0 ? 'Hide my answer & hand over' : 'Create a calm opener'} <ArrowRight size={17}/></button>
        </>
      ) : (
        <>
          <span className="eyebrow light">CALM OPENER</span>
          <h3>Try starting here:</h3>
          <div className="repair-output">“It sounds like you were both trying to protect something important. One of you said: ‘{mine}’ The other said: ‘{partner}’ Can you each say what part of the other person's answer makes sense, before solving anything?”</div>
          <button className="light-btn" onClick={() => { setActive(false); setStep(0); setMine(''); setPartner('') }}>Done</button>
        </>
      )}
    </section>
  )
}

function DopamineDate() {
  const [energy, setEnergy] = useState<Energy>('low')
  const [budget, setBudget] = useState<Budget>('cheap')
  const [time, setTime] = useState<TimeWindow>('1h')
  const [idea, setIdea] = useState(dateIdeas[1])

  function generate() {
    const exact = dateIdeas.filter(d => d.energy === energy && d.budget === budget && d.time === time)
    const close = dateIdeas.filter(d => d.energy === energy || d.budget === budget || d.time === time)
    const pool = exact.length ? exact : close.length ? close : dateIdeas
    setIdea(pool[Math.floor(Math.random() * pool.length)])
  }

  return (
    <section className="feature-card lavender">
      <div className="feature-topline"><div className="feature-icon"><Zap size={22}/></div><span className="soft-badge">Low planning load</span></div>
      <span className="eyebrow">DOPAMINE DATE</span><h3>What could we do right now?</h3>
      <div className="preference-grid">
        <Preference label="Energy" value={energy} setValue={v => setEnergy(v as Energy)} options={[['low','Low'],['medium','Medium'],['high','Buzzing']]} />
        <Preference label="Budget" value={budget} setValue={v => setBudget(v as Budget)} options={[['free','Free'],['cheap','$'],['treat','$$']]} />
        <Preference label="Time" value={time} setValue={v => setTime(v as TimeWindow)} options={[['30m','30m'],['1h','1h'],['2h+','2h+']]} />
      </div>
      <div className="date-result"><span className="eyebrow">TRY THIS</span><h4>{idea.title}</h4><p>{idea.blurb}</p></div>
      <button className="secondary-btn wide" onClick={generate}><Sparkles size={18}/> Give us another</button>
    </section>
  )
}

function Preference({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[][] }) {
  return <div><label>{label}</label><div className="mini-segment">{options.map(([v, text]) => <button key={v} className={value === v ? 'active' : ''} onClick={() => setValue(v)}>{text}</button>)}</div></div>
}

function LifeView({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [objectName, setObjectName] = useState('')
  const [location, setLocation] = useState('')
  const [search, setSearch] = useState('')
  const filtered = data.objects.filter(o => (o.object + ' ' + o.location).toLowerCase().includes(search.toLowerCase()))

  function addObject() {
    if (!objectName.trim() || !location.trim()) return
    setData(d => ({ ...d, objects: [{ id: uid(), object: objectName.trim(), location: location.trim(), updatedAt: Date.now() }, ...d.objects] }))
    setObjectName(''); setLocation('')
  }

  function rotateOwner(id: string) {
    const order: Owner[] = ['Unowned', 'Me', 'Partner', 'Together']
    setData(d => ({ ...d, autopilot: d.autopilot.map(a => a.id === id ? { ...a, owner: order[(order.indexOf(a.owner) + 1) % order.length] } : a) }))
  }

  return (
    <div className="page-stack">
      <section>
        <div className="section-heading"><div><span className="eyebrow">OBJECT-LOCATION MEMORY</span><h3>Where did we put it?</h3></div><KeyRound size={24}/></div>
        <div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search passports, key, medication bag…" /></div>
        <div className="object-list">
          {filtered.map(o => <div className="object-card" key={o.id}><MapPin size={19}/><div><strong>{o.object}</strong><span>{o.location}</span></div></div>)}
        </div>
        <div className="compact-form"><input value={objectName} onChange={e => setObjectName(e.target.value)} placeholder="Object"/><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Where it lives"/><button className="secondary-btn" onClick={addObject}><Plus size={17}/> Save place</button></div>
      </section>

      <section>
        <div className="section-heading"><div><span className="eyebrow">RECURRING-LIFE AUTOPILOT</span><h3>Things that come back anyway</h3></div><RefreshCw size={24}/></div>
        <div className="autopilot-list">
          {data.autopilot.map(a => <div className="autopilot-card" key={a.id}><div className="autopilot-icon"><CalendarHeart size={19}/></div><div className="grow"><strong>{a.label}</strong><span>{a.cadence} · Next: {a.next}</span></div><button className="owner-pill" onClick={() => rotateOwner(a.id)}>{a.owner === 'Me' ? 'You' : a.owner}</button></div>)}
        </div>
        <p className="microcopy">Tap the owner to rotate responsibility. “Unowned” means the task needs a person, not a culprit.</p>
      </section>
    </div>
  )
}

function MoreView({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const open = data.items.filter(i => !i.done)
  const invisible = open.filter(i => i.invisibleLabour)
  const mine = invisible.filter(i => i.createdBy === 'Me').length
  const partner = invisible.filter(i => i.createdBy === 'Partner').length
  const total = Math.max(1, mine + partner)

  function resetDemo() {
    setData({ ...starterData, items: starterData.items.map(i => ({ ...i, createdAt: Date.now() - Math.random() * 1000 * 60 * 60 * 50 })) })
  }

  return (
    <div className="page-stack">
      <section className="feature-card">
        <div className="feature-topline"><div className="feature-icon"><HeartHandshake size={22}/></div><span className="soft-badge">Patterns, not points</span></div>
        <span className="eyebrow">FAIRNESS WITHOUT SCOREKEEPING</span><h3>Who is carrying the remembering?</h3>
        <p>This is a soft signal about invisible work — planning, remembering, booking and following up — not a scoreboard.</p>
        <div className="fairness-bars">
          <div><span>You</span><div className="bar"><i style={{ width: `${(mine / total) * 100}%` }}/></div><strong>{mine}</strong></div>
          <div><span>Alex</span><div className="bar"><i style={{ width: `${(partner / total) * 100}%` }}/></div><strong>{partner}</strong></div>
        </div>
        <div className="signal-box"><Lightbulb size={18}/><span>{mine > partner + 1 ? 'You are currently catching more of the invisible work. Try moving one planning task to Alex.' : partner > mine + 1 ? 'Alex is currently catching more of the invisible work. Try taking one follow-up off their plate.' : 'The invisible workload looks fairly balanced right now.'}</span></div>
      </section>

      <section className="settings-card">
        <div className="setting-row"><div className="setting-icon"><Users size={19}/></div><div className="grow"><strong>Your couple</strong><span>{data.meName} + {data.partnerName}</span></div><ChevronRight size={18}/></div>
        <div className="setting-row"><div className="setting-icon"><BellRing size={19}/></div><div className="grow"><strong>Gentle reminders</strong><span>Only surface a few things at once</span></div><span className="status-dot">On</span></div>
        <div className="setting-row"><div className="setting-icon"><WalletCards size={19}/></div><div className="grow"><strong>Data mode</strong><span>Stored locally on this device</span></div><span className="soft-badge">MVP</span></div>
        <div className="setting-row"><div className="setting-icon"><Settings size={19}/></div><div className="grow"><strong>Reset demo</strong><span>Restore the sample data</span></div><button className="text-btn" onClick={resetDemo}>Reset</button></div>
      </section>

      <section className="sync-note">
        <div className="feature-icon"><Users size={20}/></div><div><strong>Ready for real couple sync</strong><p>This GitHub version is local-first. The README includes the next step for adding Supabase so two phones can share the same inbox securely.</p></div>
      </section>
    </div>
  )
}

function CategoryPill({ category }: { category: Category }) {
  const Icon = category === 'Chore' ? ListChecks : category === 'Conversation' ? MessageCircleHeart : category === 'Date' ? CalendarHeart : category === 'Reminder' ? Clock3 : CircleDashed
  return <span className={`category-pill cat-${category.toLowerCase()}`}><Icon size={13}/>{category}</span>
}

function OwnerSelector({ value, onChange }: { value: Owner; onChange: (owner: Owner) => void }) {
  return (
    <select className={classNames('owner-select', value === 'Unowned' && 'needs-owner')} value={value} onChange={e => onChange(e.target.value as Owner)} aria-label="Owner">
      <option value="Unowned">Needs an owner</option>
      <option value="Me">You</option>
      <option value="Partner">Alex</option>
      <option value="Together">Together</option>
    </select>
  )
}

export default App
