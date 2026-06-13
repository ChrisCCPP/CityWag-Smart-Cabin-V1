import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bluetooth,
  BluetoothConnected,
  CheckCircle2,
  Clock,
  Gauge,
  Pause,
  Play,
  Power,
  ShieldCheck,
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

const copy = {
  zh: {
    language: '中文',
    switchLanguage: 'EN',
    connection: {
      notConnected: '未连接',
      connecting: '连接中...',
      connected: `已连接 ${DEVICE_NAME}`,
      disconnected: '已断开',
      mockMode: '演示模式',
      cancelled: '已取消设备选择。',
      unsupported: '当前浏览器不支持 Web Bluetooth。请使用 Chrome 或 Edge，或先运行演示模式。',
    },
    status: {
      normal: '舒适',
      warning: '需要关注',
      danger: '立即处理',
      unknown: '检查模块',
    },
    petStatus: {
      calm: '安静',
      active: '活跃',
      anxious: '紧张',
      unknown: '未知',
    },
    riskLevel: {
      normal: '正常',
      warning: '提醒',
      danger: '风险',
      unknown: '未知',
    },
    message: {
      'Cabin environment looks comfortable.': '舱内环境看起来舒适。',
      'Cabin temperature is getting high. Please check ventilation.': '舱内温度正在升高，请检查通风。',
      'Cabin temperature may be unsafe. Please take action immediately.': '舱内温度可能不安全，请立即处理。',
      'Frequent bumps detected. Consider slowing down or taking a short break.': '检测到频繁颠簸，建议减速或短暂停靠。',
      'High pet activity detected. Your pet may feel anxious.': '检测到宠物活动较强，可能处于紧张状态。',
      'Sensor data unavailable. Please check the smart module.': '传感器数据不可用，请检查智能模块。',
    },
    hero: {
      badge: 'Prototype 0.1',
      mockBadge: 'Mock Demo',
      title: 'CityWag Smart Cabin',
      subtitle: 'CityWag / 宠漫智能车载宠物舱 0.1 原型。',
      line: '用于演示舱内温湿度感知、行驶颠簸/运动状态、舒适指数和浏览器仪表盘。',
    },
    labels: {
      comfortScore: '舒适指数',
      cabinStatus: '舱内状态',
      petStatus: '宠物状态',
      outOf100: '满分 100',
      liveData: '实时舱内数据',
      liveHeading: '把宠物出行空间变得可见。',
      temperature: '温度',
      humidity: '湿度',
      motionLevel: '运动水平',
      bumpLevel: '颠簸水平',
      riskLevel: '风险等级',
      lastUpdated: '更新时间',
      technicalPayload: '技术数据',
      showPayload: '显示技术数据',
      hidePayload: '隐藏技术数据',
    },
    explanations: {
      comfortScore: '基于温度、湿度、运动和颠簸计算的演示指数。',
      cabinStatus: '把当前舱内状态转成合伙人和工厂容易理解的提示。',
      temperature: 'SHT31 采集的舱内空气温度。',
      humidity: 'SHT31 采集的舱内相对湿度。',
      motionLevel: 'MPU6050 估算的舱内运动变化强度。',
      bumpLevel: '1 秒采样周期内的短时颠簸峰值。',
      riskLevel: '演示用提醒等级，不等同于医学或安全认证判断。',
      lastUpdated: '浏览器收到最近一包 BLE 或 Mock 数据的时间。',
    },
    controls: {
      connect: '连接智能模块',
      disconnect: '断开连接',
      startMock: '开始演示模式',
      stopMock: '停止演示模式',
    },
    product: {
      eyebrow: '产品解释',
      title: '安装在车载宠物舱/宠物出行舱上的独立智能模块。',
      body: '这个 0.1 原型面向合伙人、工厂和早期用户演示。传感器模块安装在宠物舱内，采集温湿度与运动状态，由 ESP32 通过 BLE 发送到浏览器仪表盘。它帮助团队快速讨论产品形态、硬件位置、数据展示和出行体验。',
    },
    workflow: {
      eyebrow: 'How it works',
      title: 'Sensor module → ESP32 → BLE → Browser dashboard',
      steps: [
        ['Sensor module', 'SHT31 读取温湿度，MPU6050 感知运动与颠簸。'],
        ['ESP32', '每秒计算 comfortScore、riskLevel 和状态消息。'],
        ['BLE', '通过本地蓝牙广播紧凑 JSON 数据包，不经过云端。'],
        ['Browser dashboard', 'React/Vite 页面展示实时状态，也支持无硬件 Mock Mode。'],
      ],
    },
    safety: {
      eyebrow: 'Demo only',
      title: '这是产品概念验证，不是医疗或车控系统。',
      items: ['不诊断宠物健康', '不控制车辆', '不连接车机', '不上传云端', '不包含摄像头或麦克风'],
    },
    vision: {
      eyebrow: '下一阶段方向',
      body: '下一版可以聚焦工业设计安装位、传感器外壳、移动端 PWA、空气质量传感和更稳定的现场演示流程。',
    },
  },
  en: {
    language: 'EN',
    switchLanguage: '中文',
    connection: {
      notConnected: 'Not connected',
      connecting: 'Connecting...',
      connected: `Connected to ${DEVICE_NAME}`,
      disconnected: 'Disconnected',
      mockMode: 'Mock mode',
      cancelled: 'Device selection was cancelled.',
      unsupported: 'Web Bluetooth is not available in this browser. Use Chrome or Edge, or run demo mode.',
    },
    status: {
      normal: 'Comfortable',
      warning: 'Attention Needed',
      danger: 'Take Action',
      unknown: 'Check Module',
    },
    petStatus: {
      calm: 'Calm',
      active: 'Active',
      anxious: 'Anxious',
      unknown: 'Unknown',
    },
    riskLevel: {
      normal: 'Normal',
      warning: 'Warning',
      danger: 'Risk',
      unknown: 'Unknown',
    },
    message: {},
    hero: {
      badge: 'Prototype 0.1',
      mockBadge: 'Mock Demo',
      title: 'CityWag Smart Cabin',
      subtitle: 'A smart in-car pet cabin prototype for safer and more comfortable pet mobility.',
      line: 'See the cabin environment. Understand the ride. Travel with more peace of mind.',
    },
    labels: {
      comfortScore: 'Comfort Score',
      cabinStatus: 'Cabin Status',
      petStatus: 'Pet Status',
      outOf100: 'out of 100',
      liveData: 'Live Cabin Data',
      liveHeading: 'Simple signals from the travel space.',
      temperature: 'Temperature',
      humidity: 'Humidity',
      motionLevel: 'Motion Level',
      bumpLevel: 'Bump Level',
      riskLevel: 'Risk Level',
      lastUpdated: 'Last Updated',
      technicalPayload: 'Technical Payload',
      showPayload: 'Show Technical Payload',
      hidePayload: 'Hide Technical Payload',
    },
    explanations: {
      comfortScore: 'A demo index calculated from temperature, humidity, motion, and bumps.',
      cabinStatus: 'A partner-friendly summary of the current cabin condition.',
      temperature: 'Cabin air temperature measured by the SHT31 sensor.',
      humidity: 'Relative humidity measured by the SHT31 sensor.',
      motionLevel: 'Estimated movement intensity from MPU6050 acceleration changes.',
      bumpLevel: 'Short bump peak detected during each one-second sample cycle.',
      riskLevel: 'A demo reminder level, not a medical or certified safety decision.',
      lastUpdated: 'Time when the browser received the latest BLE or mock packet.',
    },
    controls: {
      connect: 'Connect Smart Module',
      disconnect: 'Disconnect',
      startMock: 'Start Demo Mode',
      stopMock: 'Stop Demo Mode',
    },
    product: {
      eyebrow: 'Product Explanation',
      title: 'An independent smart module for an in-car pet cabin or travel crate.',
      body: 'Prototype 0.1 is built for partner, factory, and early user demos. The module sits inside the pet cabin, senses temperature, humidity, motion, and bumps, then streams data from ESP32 to a browser dashboard over BLE.',
    },
    workflow: {
      eyebrow: 'How it works',
      title: 'Sensor module → ESP32 → BLE → Browser dashboard',
      steps: [
        ['Sensor module', 'SHT31 reads temperature and humidity; MPU6050 senses motion and bumps.'],
        ['ESP32', 'Calculates comfortScore, riskLevel, and a status message once per second.'],
        ['BLE', 'Sends compact local JSON packets without cloud upload.'],
        ['Browser dashboard', 'React/Vite renders live status and supports hardware-free Mock Mode.'],
      ],
    },
    safety: {
      eyebrow: 'Demo only',
      title: 'This is a concept prototype, not a medical or vehicle-control system.',
      items: ['No pet health diagnosis', 'No vehicle control', 'No car infotainment connection', 'No cloud upload', 'No camera or microphone'],
    },
    vision: {
      eyebrow: 'Next Direction',
      body: 'Next versions can focus on industrial design placement, sensor enclosure, mobile PWA behavior, air quality sensing, and a more reliable field demo flow.',
    },
  },
};

function getRiskTone(riskLevel) {
  if (riskLevel === 'danger') return 'danger';
  if (riskLevel === 'warning') return 'warning';
  if (riskLevel === 'normal') return 'normal';
  return 'unknown';
}

function translateMessage(text, t) {
  return t.message[text] ?? text;
}

function translatePetStatus(status, t) {
  return t.petStatus[status] ?? status;
}

function translateRiskLevel(level, t) {
  return t.riskLevel[level] ?? level;
}

function HeroSection({ connectionState, isMockMode, language, onToggleLanguage, riskTone, t }) {
  const connected = connectionState === t.connection.connected;

  return (
    <header className="hero-section">
      <nav className="hero-nav" aria-label="CityWag prototype status">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}citywag-logo.png`} alt="CityWag logo" />
        <div className="nav-actions">
          <button className="language-toggle" onClick={onToggleLanguage} aria-label="Switch language">
            {t.switchLanguage}
          </button>
          <div className={`connection-pill ${isMockMode ? 'mock' : riskTone}`}>
            {connected ? <BluetoothConnected size={16} /> : <Bluetooth size={16} />}
            <span>{connectionState}</span>
          </div>
        </div>
      </nav>

      <div className="hero-copy">
        <div className="badge-row">
          <span className="badge badge-strong">{t.hero.badge}</span>
          <span className="badge">CityWag / 宠漫</span>
          {isMockMode ? <span className="badge badge-dark">{t.hero.mockBadge}</span> : null}
        </div>
        <h1>{t.hero.title}</h1>
        <p className="subtitle">{t.hero.subtitle}</p>
        <p className="product-line">{t.hero.line}</p>
      </div>
    </header>
  );
}

function StatusHero({ cabinData, riskTone, t }) {
  const cabinStatus = t.status[riskTone] ?? t.status.unknown;

  return (
    <section className={`status-hero ${riskTone}`} aria-label="Main product status">
      <div className="score-panel">
        <p className="eyebrow">{t.labels.comfortScore}</p>
        <strong>{formatScore(cabinData.comfortScore)}</strong>
        <span>{t.labels.outOf100}</span>
        <p className="metric-explain">{t.explanations.comfortScore}</p>
      </div>

      <div className="status-panel">
        <div>
          <p className="eyebrow">{t.labels.cabinStatus}</p>
          <h2>{cabinStatus}</h2>
          <p className="metric-explain">{t.explanations.cabinStatus}</p>
        </div>
        <div className="status-meta">
          <span>{t.labels.petStatus}</span>
          <strong>{translatePetStatus(cabinData.petStatus, t)}</strong>
        </div>
        <p className="smart-message">{translateMessage(cabinData.message, t)}</p>
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
  t,
}) {
  return (
    <section className="control-bar" aria-label="Demo controls">
      <button onClick={onConnect} disabled={connectionState === t.connection.connecting || isMockMode}>
        <Bluetooth size={16} />
        {t.controls.connect}
      </button>
      <button onClick={onDisconnect} disabled={!hasClient}>
        <Power size={16} />
        {t.controls.disconnect}
      </button>
      <button onClick={onStartMock} disabled={isMockMode}>
        <Play size={16} />
        {t.controls.startMock}
      </button>
      <button onClick={onStopMock} disabled={!isMockMode}>
        <Pause size={16} />
        {t.controls.stopMock}
      </button>
    </section>
  );
}

function LiveCabinData({ cabinData, riskTone, t }) {
  return (
    <section className="section-block" aria-labelledby="live-data-heading">
      <div className="section-heading">
        <p className="eyebrow">{t.labels.liveData}</p>
        <h2 id="live-data-heading">{t.labels.liveHeading}</h2>
      </div>
      <div className="data-grid">
        <DataCard icon={Thermometer} label={t.labels.temperature} value={formatTemperature(cabinData.temp)} detail={t.explanations.temperature} tone={riskTone} />
        <DataCard icon={Waves} label={t.labels.humidity} value={formatHumidity(cabinData.humidity)} detail={t.explanations.humidity} />
        <DataCard icon={Activity} label={t.labels.motionLevel} value={formatPercent(cabinData.motionLevel)} detail={t.explanations.motionLevel} />
        <DataCard icon={Gauge} label={t.labels.bumpLevel} value={formatPercent(cabinData.bumpLevel)} detail={t.explanations.bumpLevel} tone={cabinData.bumpLevel > 0.55 ? 'warning' : 'neutral'} />
        <DataCard icon={AlertTriangle} label={t.labels.riskLevel} value={translateRiskLevel(cabinData.riskLevel, t)} detail={t.explanations.riskLevel} tone={riskTone} />
        <DataCard icon={Clock} label={t.labels.lastUpdated} value={formatUpdatedTime(cabinData.timestamp)} detail={t.explanations.lastUpdated} />
      </div>
    </section>
  );
}

function ProductSection({ t }) {
  return (
    <section className="story-section" aria-labelledby="product-heading">
      <div className="story-copy">
        <p className="eyebrow">{t.product.eyebrow}</p>
        <h2 id="product-heading">{t.product.title}</h2>
      </div>
      <p className="section-body">{t.product.body}</p>
    </section>
  );
}

function HowItWorks({ t }) {
  return (
    <section className="section-block" aria-labelledby="workflow-heading">
      <div className="section-heading">
        <p className="eyebrow">{t.workflow.eyebrow}</p>
        <h2 id="workflow-heading">{t.workflow.title}</h2>
      </div>
      <div className="workflow-grid">
        {t.workflow.steps.map(([title, body], index) => (
          <article className="workflow-step" key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SafetySection({ t }) {
  return (
    <section className="safety-section" aria-labelledby="safety-heading">
      <div>
        <p className="eyebrow">{t.safety.eyebrow}</p>
        <h2 id="safety-heading">{t.safety.title}</h2>
      </div>
      <div className="safety-list">
        {t.safety.items.map((item) => (
          <div className="safety-item" key={item}>
            <ShieldCheck size={18} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FutureVision({ t }) {
  return (
    <section className="future-vision">
      <p className="eyebrow">{t.vision.eyebrow}</p>
      <p>{t.vision.body}</p>
    </section>
  );
}

function RawPayload({ rawOpen, rawData, onToggle, t }) {
  return (
    <section className="raw-panel">
      <button className="raw-toggle" onClick={onToggle}>
        {rawOpen ? t.labels.hidePayload : t.labels.showPayload}
      </button>
      {rawOpen ? <pre aria-label={t.labels.technicalPayload}>{rawData}</pre> : null}
    </section>
  );
}

function App() {
  const [language, setLanguage] = useState('zh');
  const t = copy[language];
  const [connectionState, setConnectionState] = useState(t.connection.notConnected);
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

  useEffect(() => {
    setConnectionState((current) => {
      if (current === copy.zh.connection.notConnected || current === copy.en.connection.notConnected) return t.connection.notConnected;
      if (current === copy.zh.connection.connecting || current === copy.en.connection.connecting) return t.connection.connecting;
      if (current === copy.zh.connection.connected || current === copy.en.connection.connected) return t.connection.connected;
      if (current === copy.zh.connection.disconnected || current === copy.en.connection.disconnected) return t.connection.disconnected;
      if (current === copy.zh.connection.mockMode || current === copy.en.connection.mockMode) return t.connection.mockMode;
      return current;
    });
  }, [language, t]);

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
      setConnectionState(t.connection.connecting);
      clientRef.current = await connectCabinDevice({
        onData: applyRawPacket,
        onDisconnected: () => {
          clientRef.current = null;
          setConnectionState(copy[language].connection.disconnected);
        },
      });
      setConnectionState(t.connection.connected);
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : 'Connection failed.';
      setConnectionState(t.connection.notConnected);
      setError(message.includes('User cancelled') ? t.connection.cancelled : message);
    }
  }

  function handleDisconnect() {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState(t.connection.disconnected);
  }

  function startMockMode() {
    handleDisconnect();
    setIsMockMode(true);
    setConnectionState(t.connection.mockMode);
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
    if (connectionState === copy.zh.connection.mockMode || connectionState === copy.en.connection.mockMode) {
      setConnectionState(t.connection.notConnected);
    }
  }

  return (
    <main className="app-shell" lang={language === 'zh' ? 'zh-CN' : 'en'}>
      <HeroSection
        connectionState={connectionState}
        isMockMode={isMockMode}
        language={language}
        onToggleLanguage={() => setLanguage((current) => (current === 'zh' ? 'en' : 'zh'))}
        riskTone={riskTone}
        t={t}
      />

      {!bluetoothSupported ? (
        <div className="notice">
          <CheckCircle2 size={18} />
          <span>{t.connection.unsupported}</span>
        </div>
      ) : null}

      {error ? (
        <div className="notice error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <StatusHero cabinData={cabinData} riskTone={riskTone} t={t} />

      <ControlBar
        connectionState={connectionState}
        isMockMode={isMockMode}
        hasClient={Boolean(clientRef.current)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onStartMock={startMockMode}
        onStopMock={stopMockMode}
        t={t}
      />

      <ProductSection t={t} />
      <HowItWorks t={t} />
      <LiveCabinData cabinData={cabinData} riskTone={riskTone} t={t} />
      <RawPayload rawOpen={rawOpen} rawData={rawData} onToggle={() => setRawOpen((open) => !open)} t={t} />
      <SafetySection t={t} />
      <FutureVision t={t} />
    </main>
  );
}

export default App;
