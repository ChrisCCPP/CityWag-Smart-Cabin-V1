import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bluetooth,
  BluetoothConnected,
  Clock,
  Gauge,
  Pause,
  Play,
  Power,
  Thermometer,
  Waves,
} from 'lucide-react';
import { connectCabinDevice, isWebBluetoothSupported, DEVICE_NAME } from './bluetooth/bluetoothClient.js';
import { createMockCabinPacket } from './mock/mockData.js';
import { parseCabinData } from './utils/parseCabinData.js';
import {
  formatHumidity,
  formatPercent,
  formatScore,
  formatTemperature,
  formatUpdatedTime,
} from './utils/formatters.js';

const initialData = {
  temp: 24.6,
  humidity: 52,
  motionLevel: 0.18,
  bumpLevel: 0.12,
  comfortScore: 96,
  petStatus: 'calm',
  riskLevel: 'normal',
  message: 'Cabin environment looks comfortable.',
  timestamp: Math.floor(Date.now() / 1000),
};

const statusCopy = {
  normal: 'Comfortable',
  warning: 'Attention Needed',
  danger: 'Take Action',
  unknown: 'Check Module',
};

function getRiskTone(riskLevel) {
  if (riskLevel === 'danger') return 'danger';
  if (riskLevel === 'warning') return 'warning';
  if (riskLevel === 'normal') return 'normal';
  return 'unknown';
}

function HeroSection({ connectionState, isMockMode, riskTone }) {
  const connected = connectionState.includes('Connected');

  return (
    <header className="hero-section">
      <nav className="hero-nav" aria-label="CityWag prototype status">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}citywag-logo.png`} alt="CityWag logo" />
        <div className={`connection-pill ${isMockMode ? 'mock' : riskTone}`}>
          {connected ? <BluetoothConnected size={16} /> : <Bluetooth size={16} />}
          <span>{connectionState}</span>
        </div>
      </nav>

      <div className="hero-copy">
        <div className="badge-row">
          <span className="badge">Prototype 0.1</span>
          {isMockMode ? <span className="badge badge-dark">Mock Demo</span> : null}
        </div>
        <h1>CityWag Smart Cabin</h1>
        <p className="subtitle">
          A smart in-car pet cabin prototype for safer and more comfortable pet mobility.
        </p>
        <p className="product-line">
          See the cabin environment. Understand the ride. Travel with more peace of mind.
        </p>
      </div>
    </header>
  );
}

function StatusHero({ cabinData, riskTone }) {
  const cabinStatus = statusCopy[riskTone] ?? statusCopy.unknown;

  return (
    <section className={`status-hero ${riskTone}`} aria-label="Main product status">
      <div className="score-panel">
        <p className="eyebrow">Comfort Score</p>
        <strong>{formatScore(cabinData.comfortScore)}</strong>
        <span>out of 100</span>
      </div>

      <div className="status-panel">
        <div>
          <p className="eyebrow">Cabin Status</p>
          <h2>{cabinStatus}</h2>
        </div>
        <div className="status-meta">
          <span>Pet status</span>
          <strong>{cabinData.petStatus}</strong>
        </div>
        <p className="smart-message">{cabinData.message}</p>
      </div>
    </section>
  );
}

function DataCard({ icon: Icon, label, value, detail, tone = 'neutral' }) {
  return (
    <article className={`data-card tone-${tone}`}>
      <div className="card-topline">
        <span>{label}</span>
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ControlBar({
  connectionState,
  isMockMode,
  hasClient,
  onConnect,
  onDisconnect,
  onStartMock,
  onStopMock,
}) {
  return (
    <section className="control-bar" aria-label="Demo controls">
      <button onClick={onConnect} disabled={connectionState === 'Connecting...' || isMockMode}>
        <Bluetooth size={16} />
        Connect Smart Module
      </button>
      <button onClick={onDisconnect} disabled={!hasClient}>
        <Power size={16} />
        Disconnect
      </button>
      <button onClick={onStartMock} disabled={isMockMode}>
        <Play size={16} />
        Start Demo Mode
      </button>
      <button onClick={onStopMock} disabled={!isMockMode}>
        <Pause size={16} />
        Stop Demo Mode
      </button>
    </section>
  );
}

function LiveCabinData({ cabinData, riskTone }) {
  return (
    <section className="section-block" aria-labelledby="live-data-heading">
      <div className="section-heading">
        <p className="eyebrow">Live Cabin Data</p>
        <h2 id="live-data-heading">Simple signals from the travel space.</h2>
      </div>
      <div className="data-grid">
        <DataCard icon={Thermometer} label="Temperature" value={formatTemperature(cabinData.temp)} detail="Cabin air" tone={riskTone} />
        <DataCard icon={Waves} label="Humidity" value={formatHumidity(cabinData.humidity)} detail="Relative humidity" />
        <DataCard icon={Activity} label="Motion Level" value={formatPercent(cabinData.motionLevel)} detail={cabinData.petStatus} />
        <DataCard icon={Gauge} label="Bump Level" value={formatPercent(cabinData.bumpLevel)} detail="Ride movement" tone={cabinData.bumpLevel > 0.55 ? 'warning' : 'neutral'} />
        <DataCard icon={AlertTriangle} label="Risk Level" value={cabinData.riskLevel} detail="Environment reminder" tone={riskTone} />
        <DataCard icon={Clock} label="Last Updated" value={formatUpdatedTime(cabinData.timestamp)} detail="Local display time" />
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="story-section" aria-labelledby="story-heading">
      <div className="story-copy">
        <p className="eyebrow">Concept Story</p>
        <h2 id="story-heading">A calmer way to see pet travel conditions.</h2>
        <p>
          CityWag Smart Cabin is an early functional prototype exploring how pet travel spaces can become safer,
          smarter, and more visible. Through an independent smart module, the cabin monitors temperature, humidity,
          motion, and ride conditions, helping owners better understand their pet's travel environment.
        </p>
      </div>

      <div className="feature-grid">
        <article>
          <h3>Cabin Micro-Environment</h3>
          <p>Monitor temperature and humidity inside the pet cabin.</p>
        </article>
        <article>
          <h3>Ride & Motion Awareness</h3>
          <p>Understand bumps, movement, and travel comfort.</p>
        </article>
        <article>
          <h3>Smart Reminders</h3>
          <p>Receive simple, non-medical reminders when attention may be needed.</p>
        </article>
      </div>
    </section>
  );
}

function FutureVision() {
  return (
    <section className="future-vision">
      <p className="eyebrow">Future Vision</p>
      <p>
        Future versions may explore air quality sensing, fan module control, mobile PWA support, and smart cockpit
        display integration.
      </p>
    </section>
  );
}

function RawPayload({ rawOpen, rawData, onToggle }) {
  return (
    <section className="raw-panel">
      <button className="raw-toggle" onClick={onToggle}>
        {rawOpen ? 'Hide Technical Payload' : 'Show Technical Payload'}
      </button>
      {rawOpen ? <pre>{rawData}</pre> : null}
    </section>
  );
}

function App() {
  const [connectionState, setConnectionState] = useState('Not connected');
  const [cabinData, setCabinData] = useState(initialData);
  const [rawData, setRawData] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const clientRef = useRef(null);
  const mockTimerRef = useRef(null);

  const bluetoothSupported = isWebBluetoothSupported();
  const riskTone = useMemo(() => getRiskTone(cabinData.riskLevel), [cabinData.riskLevel]);

  useEffect(() => {
    return () => {
      if (mockTimerRef.current) {
        window.clearInterval(mockTimerRef.current);
      }
      clientRef.current?.disconnect();
    };
  }, []);

  function applyRawPacket(raw) {
    const parsed = parseCabinData(raw);
    setRawData(typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2));

    if (!parsed.ok) {
      setError(`Data parse error: ${parsed.error}`);
      return;
    }

    setCabinData(parsed.data);
    setError('');
  }

  async function handleConnect() {
    setError('');
    stopMockMode();

    try {
      setConnectionState('Connecting...');
      clientRef.current = await connectCabinDevice({
        onData: applyRawPacket,
        onDisconnected: () => {
          clientRef.current = null;
          setConnectionState('Disconnected');
        },
      });
      setConnectionState(`Connected to ${DEVICE_NAME}`);
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : 'Connection failed.';
      setConnectionState('Not connected');
      setError(message.includes('User cancelled') ? 'Device selection was cancelled.' : message);
    }
  }

  function handleDisconnect() {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState('Disconnected');
  }

  function startMockMode() {
    handleDisconnect();
    setIsMockMode(true);
    setConnectionState('Mock mode');
    setError('');
    applyRawPacket(createMockCabinPacket());

    mockTimerRef.current = window.setInterval(() => {
      applyRawPacket(createMockCabinPacket());
    }, 1000);
  }

  function stopMockMode() {
    if (mockTimerRef.current) {
      window.clearInterval(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    setIsMockMode(false);
    if (connectionState === 'Mock mode') {
      setConnectionState('Not connected');
    }
  }

  return (
    <main className="app-shell">
      <HeroSection connectionState={connectionState} isMockMode={isMockMode} riskTone={riskTone} />

      {!bluetoothSupported ? (
        <div className="notice">
          Web Bluetooth is not available in this browser. Use Chrome or Edge, or run the page in demo mode.
        </div>
      ) : null}

      {error ? (
        <div className="notice error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <StatusHero cabinData={cabinData} riskTone={riskTone} />

      <ControlBar
        connectionState={connectionState}
        isMockMode={isMockMode}
        hasClient={Boolean(clientRef.current)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onStartMock={startMockMode}
        onStopMock={stopMockMode}
      />

      <LiveCabinData cabinData={cabinData} riskTone={riskTone} />
      <RawPayload rawOpen={rawOpen} rawData={rawData} onToggle={() => setRawOpen((open) => !open)} />
      <StorySection />
      <FutureVision />
    </main>
  );
}

export default App;
