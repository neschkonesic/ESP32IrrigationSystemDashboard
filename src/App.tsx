import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Gauge, 
  Wifi, 
  WifiOff, 
  Power, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Play,
  Pause,
  Wind,
  Sun,
  Leaf,
  ThermometerSun,
  Fan,
  Calendar
} from 'lucide-react';
import CalendarIntegration from './components/CalendarIntegration';
import ScheduleManager from './components/ScheduleManager';

interface SensorData {
  temperature: number;
  pressure: number;
  soilMoisture: number;
  windSpeed: number;
  lightIntensity: number;
  co2Saturation: number;
  externalTemperature: number;
  valves: { valve1: boolean; valve2: boolean };
  wifiConnected: boolean;
  mqttConnected: boolean;
  systemActive: boolean;
  targetTemperature: number;
  fanSpeed: number;
  autoMode: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  type: 'irrigation' | 'maintenance' | 'fertilizer';
  valves: string[];
  duration: number;
}

type OperatingMode = 'manual' | 'automatic' | 'scheduled';

const ModeSwitch: React.FC<{ 
  mode: OperatingMode; 
  onModeChange: (mode: OperatingMode) => void;
}> = ({ mode, onModeChange }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
      <div className="flex items-center justify-center">
        <div className="bg-white/20 rounded-full p-1 flex">
          <button
            onClick={() => onModeChange('manual')}
            className={`flex items-center gap-2 px-4 py-3 rounded-full font-semibold transition-all duration-300 ${
              mode === 'manual'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5" />
            Ručni
          </button>
          <button
            onClick={() => onModeChange('automatic')}
            className={`flex items-center gap-2 px-4 py-3 rounded-full font-semibold transition-all duration-300 ${
              mode === 'automatic'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Target className="w-5 h-5" />
            Automatski
          </button>
          <button
            onClick={() => onModeChange('scheduled')}
            className={`flex items-center gap-2 px-4 py-3 rounded-full font-semibold transition-all duration-300 ${
              mode === 'scheduled'
                ? 'bg-white text-blue-900 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Zakazano
          </button>
        </div>
      </div>
    </div>
  );
};

const SensorCard: React.FC<{
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}> = ({ title, value, unit, icon, status = 'good', description }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-green-500/50 bg-green-500/10';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'critical': return 'text-red-300';
      case 'warning': return 'text-yellow-300';
      default: return 'text-green-300';
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-white">{icon}</div>
        <span className="text-white font-medium text-sm">{title}</span>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </div>
        <div className="text-white/70 text-sm">{unit}</div>
        {description && (
          <div className="text-white/60 text-xs mt-1">{description}</div>
        )}
      </div>
    </div>
  );
};

const TemperatureControl: React.FC<{ 
  currentTemp: number; 
  targetTemp: number; 
  onTargetChange: (temp: number) => void;
}> = ({ currentTemp, targetTemp, onTargetChange }) => {
  
  const getTemperatureStatus = () => {
    const diff = Math.abs(currentTemp - targetTemp);
    if (diff <= 1) return { status: 'Оптимално', color: 'text-green-400' };
    if (diff <= 3) return { status: 'Близу циља', color: 'text-yellow-400' };
    return { status: 'Далеко од циља', color: 'text-red-400' };
  };

  const tempStatus = getTemperatureStatus();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">Контрола Температуре</span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-white/70 mb-1">Тренутна</div>
            <div className="text-2xl font-bold text-white">{currentTemp.toFixed(1)}°C</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/70 mb-1">Циљана</div>
            <div className="text-2xl font-bold text-blue-300">{targetTemp.toFixed(1)}°C</div>
          </div>
        </div>

        <div className="text-center">
          <span className={`text-sm font-medium ${tempStatus.color}`}>
            {tempStatus.status}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Циљана температура</span>
            <span>{targetTemp}°C</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="10"
              max="40"
              step="0.5"
              value={targetTemp}
              onChange={(e) => onTargetChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((targetTemp - 10) / 30) * 100}%, rgba(255,255,255,0.2) ${((targetTemp - 10) / 30) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>10°C</span>
              <span>25°C</span>
              <span>40°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FanSpeedControl: React.FC<{ 
  fanSpeed: number; 
  onFanSpeedChange: (speed: number) => void;
}> = ({ fanSpeed, onFanSpeedChange }) => {
  
  const getFanStatus = () => {
    if (fanSpeed === 0) return { status: 'Искључен', color: 'text-gray-400' };
    if (fanSpeed <= 30) return { status: 'Тихо', color: 'text-green-400' };
    if (fanSpeed <= 70) return { status: 'Умерено', color: 'text-yellow-400' };
    return { status: 'Брзо', color: 'text-red-400' };
  };

  const fanStatus = getFanStatus();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <Fan className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">Контрола Вентилатора</span>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-white/70 mb-1">Брзина</div>
          <div className="text-3xl font-bold text-white">{fanSpeed}%</div>
          <span className={`text-sm font-medium ${fanStatus.color}`}>
            {fanStatus.status}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Брзина вентилатора</span>
            <span>{fanSpeed}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={fanSpeed}
              onChange={(e) => onFanSpeedChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${fanSpeed}%, rgba(255,255,255,0.2) ${fanSpeed}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-xs text-green-200">
            <div className="font-medium mb-1">Аутоматска регулација:</div>
            <div>• Повећава се при високој температури</div>
            <div>• Смањује се при ниској температури</div>
            <div>• Искључује се при јаком ветру</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValveControl: React.FC<{ 
  valve: string; 
  active: boolean; 
  onToggle: () => void;
  disabled?: boolean;
}> = ({ valve, active, onToggle, disabled = false }) => {
  
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{valve}</span>
        </div>
        <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-400' : 'bg-gray-500'}`} />
      </div>
      
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
          disabled
            ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
            : active 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {active ? 'Затвори Вентил' : 'Отвори Вентил'}
      </button>
    </div>
  );
};

const AutomaticControls: React.FC<{ 
  data: SensorData; 
  onTargetChange: (temp: number) => void;
  onFanSpeedChange: (speed: number) => void;
}> = ({ data, onTargetChange, onFanSpeedChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TemperatureControl
          currentTemp={data.temperature}
          targetTemp={data.targetTemperature}
          onTargetChange={onTargetChange}
        />
        
        <FanSpeedControl
          fanSpeed={data.fanSpeed}
          onFanSpeedChange={onFanSpeedChange}
        />
      </div>
      
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Аутоматске Функције</span>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-sm text-blue-200">
              <div className="font-medium mb-2">Активне аутоматске контроле:</div>
              <div className="space-y-1 text-xs">
                <div>• Температурна регулација: {data.targetTemperature}°C ± 1°C</div>
                <div>• Вентилатор: {data.fanSpeed}% брзине</div>
                <div>• Влажност земљишта: Аутоматско наводњавање</div>
                <div>• Ветар: Заштита при јачини > 15 km/h</div>
                <div>• CO₂: Оптимизација за раст биљака</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-green-300 font-medium">Вентили</div>
              <div className="text-xs text-green-200">Аутоматски</div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-blue-300 font-medium">Наводњавање</div>
              <div className="text-xs text-blue-200">По потреби</div>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-purple-300 font-medium">Вентилатор</div>
              <div className="text-xs text-purple-200">{data.fanSpeed}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManualControls: React.FC<{ 
  data: SensorData; 
  onValveToggle: (valve: 'valve1' | 'valve2') => void;
}> = ({ data, onValveToggle }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Power className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Ручна Контрола Вентила</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValveControl 
            valve="Главни Вентил" 
            active={data.valves.valve1} 
            onToggle={() => onValveToggle('valve1')}
          />
          <ValveControl 
            valve="Секундарни Вентил" 
            active={data.valves.valve2} 
            onToggle={() => onValveToggle('valve2')}
          />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-semibold">Ручни Режим - Упозорења</span>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>У ручном режиму сте одговорни за контролу свих система</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>Пратите сензоре и прилагођавајте вентиле према потреби</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <span>Висока брзина ветра (>{data.windSpeed.toFixed(1)} km/h) може утицати на систем</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemStatus: React.FC<{ data: SensorData }> = ({ data }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">Статус Система</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.wifiConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className="text-white/80">WiFi Веза</span>
          </div>
          <span className={`text-sm ${data.wifiConnected ? 'text-green-400' : 'text-red-400'}`}>
            {data.wifiConnected ? 'Повезано' : 'Није повезано'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${data.mqttConnected ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-white/80">MQTT Брокер</span>
          </div>
          <span className={`text-sm ${data.mqttConnected ? 'text-green-400' : 'text-red-400'}`}>
            {data.mqttConnected ? 'Повезано' : 'Није повезано'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className={`w-4 h-4 ${data.systemActive ? 'text-green-400' : 'text-gray-400'}`} />
            <span className="text-white/80">Статус Система</span>
          </div>
          <span className={`text-sm ${data.systemActive ? 'text-green-400' : 'text-gray-400'}`}>
            {data.systemActive ? 'Активан' : 'У приправности'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className={`w-4 h-4 ${data.autoMode ? 'text-blue-400' : 'text-gray-400'}`} />
            <span className="text-white/80">Режим Рада</span>
          </div>
          <span className={`text-sm ${data.autoMode ? 'text-blue-400' : 'text-gray-400'}`}>
            {data.autoMode ? 'Аутоматски' : 'Ручни'}
          </span>
        </div>
        
        <div className="pt-2 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Clock className="w-3 h-3" />
            <span>Последње ажурирање: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('manual');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 22.5,
    pressure: 1.2,
    soilMoisture: 45,
    windSpeed: 8.3,
    lightIntensity: 75,
    co2Saturation: 420,
    externalTemperature: 18.7,
    valves: { valve1: false, valve2: true },
    wifiConnected: true,
    mqttConnected: true,
    systemActive: true,
    targetTemperature: 24.0,
    fanSpeed: 45,
    autoMode: false
  });

  // Update autoMode when operating mode changes
  useEffect(() => {
    setSensorData(prev => ({
      ...prev,
      autoMode: operatingMode === 'automatic'
    }));
  }, [operatingMode]);

  // Automatic control logic
  useEffect(() => {
    if (sensorData.autoMode) {
      const tempDiff = sensorData.temperature - sensorData.targetTemperature;
      
      setSensorData(prev => {
        let newValves = { ...prev.valves };
        let newFanSpeed = prev.fanSpeed;
        
        // Temperature-based valve control
        if (tempDiff > 2) {
          newValves.valve1 = true;
          newValves.valve2 = true;
        } else if (tempDiff < -2) {
          newValves.valve1 = false;
          newValves.valve2 = false;
        }
        
        // Automatic fan speed control based on temperature difference
        if (tempDiff > 3) {
          newFanSpeed = Math.min(100, 80);
        } else if (tempDiff > 1) {
          newFanSpeed = Math.min(100, 60);
        } else if (tempDiff < -3) {
          newFanSpeed = Math.max(0, 20);
        } else if (tempDiff < -1) {
          newFanSpeed = Math.max(0, 30);
        } else {
          newFanSpeed = 45; // Default moderate speed
        }
        
        // Reduce fan speed in high wind conditions
        if (prev.windSpeed > 15) {
          newFanSpeed = Math.min(newFanSpeed, 20);
        }
        
        return {
          ...prev,
          valves: newValves,
          fanSpeed: newFanSpeed
        };
      });
    }
  }, [sensorData.temperature, sensorData.targetTemperature, sensorData.windSpeed, sensorData.autoMode]);

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        temperature: 22.5 + (Math.random() - 0.5) * 10,
        pressure: 1.2 + (Math.random() - 0.5) * 0.8,
        soilMoisture: Math.max(20, Math.min(90, prev.soilMoisture + (Math.random() - 0.5) * 10)),
        windSpeed: Math.max(0, Math.min(25, prev.windSpeed + (Math.random() - 0.5) * 5)),
        lightIntensity: Math.max(0, Math.min(100, prev.lightIntensity + (Math.random() - 0.5) * 20)),
        co2Saturation: Math.max(300, Math.min(600, prev.co2Saturation + (Math.random() - 0.5) * 50)),
        externalTemperature: 18.7 + (Math.random() - 0.5) * 8
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleValve = (valve: 'valve1' | 'valve2') => {
    if (sensorData.autoMode) return;
    
    setSensorData(prev => ({
      ...prev,
      valves: {
        ...prev.valves,
        [valve]: !prev.valves[valve]
      }
    }));
  };

  const handleTargetTemperatureChange = (temp: number) => {
    setSensorData(prev => ({
      ...prev,
      targetTemperature: temp
    }));
  };

  const handleFanSpeedChange = (speed: number) => {
    setSensorData(prev => ({
      ...prev,
      fanSpeed: speed
    }));
  };

  const handleScheduleUpdate = (events: CalendarEvent[]) => {
    setCalendarEvents(events);
  };

  const handleExecuteEvent = (event: any) => {
    console.log('Executing scheduled event:', event);
    
    // Execute the scheduled event
    if (event.type === 'irrigation') {
      setSensorData(prev => ({
        ...prev,
        valves: {
          valve1: event.valves.includes('valve1'),
          valve2: event.valves.includes('valve2')
        }
      }));
    }
  };

  const getSensorStatus = (type: string, value: number) => {
    switch (type) {
      case 'wind':
        if (value > 15) return 'critical';
        if (value > 10) return 'warning';
        return 'good';
      case 'light':
        if (value < 30 || value > 90) return 'warning';
        return 'good';
      case 'co2':
        if (value < 350 || value > 500) return 'warning';
        return 'good';
      case 'soil':
        if (value < 30) return 'critical';
        if (value < 50) return 'warning';
        return 'good';
      default:
        return 'good';
    }
  };

  const renderModeContent = () => {
    switch (operatingMode) {
      case 'automatic':
        return (
          <AutomaticControls 
            data={sensorData} 
            onTargetChange={handleTargetTemperatureChange}
            onFanSpeedChange={handleFanSpeedChange}
          />
        );
      case 'scheduled':
        return (
          <div className="space-y-6">
            <CalendarIntegration onScheduleUpdate={handleScheduleUpdate} />
            <ScheduleManager 
              events={calendarEvents} 
              onExecuteEvent={handleExecuteEvent}
            />
          </div>
        );
      default:
        return (
          <ManualControls 
            data={sensorData} 
            onValveToggle={toggleValve}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Droplets className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">ESP32 Систем за Наводњавање</h1>
          </div>
          <p className="text-white/70">Напредна Контролна Табла за Климу и Наводњавање</p>
        </div>

        {/* Mode Switch */}
        <ModeSwitch mode={operatingMode} onModeChange={setOperatingMode} />

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <SensorCard
            title="Температура у Пластенику"
            value={sensorData.temperature}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            status="good"
          />
          <SensorCard
            title="Спољашња Температура"
            value={sensorData.externalTemperature}
            unit="°C"
            icon={<ThermometerSun className="w-5 h-5" />}
            status="good"
          />
          <SensorCard
            title="Притисак"
            value={sensorData.pressure}
            unit="бара"
            icon={<Gauge className="w-5 h-5" />}
            status={sensorData.pressure < 0.5 ? 'critical' : 'good'}
          />
          <SensorCard
            title="Влажност Земљишта"
            value={sensorData.soilMoisture}
            unit="%"
            icon={<Droplets className="w-5 h-5" />}
            status={getSensorStatus('soil', sensorData.soilMoisture)}
          />
          <SensorCard
            title="Брзина Ветра"
            value={sensorData.windSpeed}
            unit="km/h"
            icon={<Wind className="w-5 h-5" />}
            status={getSensorStatus('wind', sensorData.windSpeed)}
          />
          <SensorCard
            title="Јачина Светлости"
            value={sensorData.lightIntensity}
            unit="%"
            icon={<Sun className="w-5 h-5" />}
            status={getSensorStatus('light', sensorData.lightIntensity)}
          />
          <SensorCard
            title="CO₂ Засићење"
            value={sensorData.co2Saturation}
            unit="ppm"
            icon={<Leaf className="w-5 h-5" />}
            status={getSensorStatus('co2', sensorData.co2Saturation)}
          />
        </div>

        {/* Mode-specific Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            {renderModeContent()}
          </div>
          
          <div className="lg:col-span-1">
            <SystemStatus data={sensorData} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/50 text-sm">
          <p>ESP32 Систем за Наводњавање в3.2 | WebSocket: Порт 81 | MQTT: localhost:1883 | Google Calendar API</p>
        </div>
      </div>

      {/* CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

export default App;