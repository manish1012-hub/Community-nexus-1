import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  BatteryCharging, 
  BatteryMedium, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Play, 
  RefreshCw,
  Send,
  Sparkles,
  Signal
} from 'lucide-react';

export const IoTSimulator = () => {
  const { role } = useAuth();
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [simulationStatus, setSimulationStatus] = useState('dispensed');
  const [doseTaken, setDoseTaken] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  useEffect(() => {
    fetchIoTData();
    api.get('/patients/').then((res) => {
      setPatients(res.data);
      if (res.data.length > 0) setSelectedPatientId(res.data[0].id);
    });
  }, []);

  const fetchIoTData = async () => {
    try {
      setLoading(true);
      const [devRes, evRes] = await Promise.all([
        api.get('/iot/devices'),
        api.get('/iot/events?limit=25')
      ]);
      setDevices(devRes.data);
      setEvents(evRes.data);
    } catch (err) {
      console.error('Failed to load IoT data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSimulation = async (statusType) => {
    try {
      setSimulating(true);
      setSimMessage('');
      const res = await api.post('/iot/simulate', {
        patient_id: parseInt(selectedPatientId),
        status: statusType || simulationStatus,
        dose_taken: statusType === 'missed' ? false : doseTaken
      });
      setSimMessage(res.data.message);
      fetchIoTData();
    } catch (err) {
      setSimMessage(err.response?.data?.detail || 'Simulation error.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            IoT Smart Dispenser Integration & Telemetry
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              Live Gateway
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate and monitor cellular-connected medication dispensing devices for real-time patient adherence.
          </p>
        </div>

        <button
          onClick={fetchIoTData}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Virtual IoT Device Interactive Controller */}
      <div className="bg-gradient-to-r from-navy-900 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Interactive IoT Device Simulator</span>
            </div>
            <p className="text-xs text-slate-400">
              Emulate physical hardware sensor events, scheduled compartment rotations, and missed dose telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Gateway Protocol</span>
              <span className="text-xs font-mono font-bold text-teal-400">REST API & WebSocket Broadcast</span>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Target Patient Device</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col justify-end">
            <label className="block text-slate-400 font-semibold mb-1.5">Generate Instant Simulation Event</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleTriggerSimulation('dispensed')}
                disabled={simulating}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Dispense</span>
              </button>

              <button
                onClick={() => handleTriggerSimulation('missed')}
                disabled={simulating}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Missed Dose Alert</span>
              </button>

              <button
                onClick={() => handleTriggerSimulation('late')}
                disabled={simulating}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>Simulate Late Dose Taken</span>
              </button>
            </div>
          </div>
        </div>

        {simMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-teal-950/80 border border-teal-800 text-teal-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{simMessage}</span>
          </div>
        )}
      </div>

      {/* Connected IoT Devices Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-600" />
          <span>Active Smart Dispenser Hardware Registry</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800">{d.device_serial}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    d.status === 'online' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    {d.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-semibold">{d.model_name}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Assigned: {d.patient_name}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <BatteryMedium className="w-4 h-4 text-emerald-600" />
                  <span>{d.battery_level}% Battery</span>
                </span>
                <span className="font-mono text-[10px]">{d.firmware_version}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Dispensing Events Stream */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Real-Time Dispensing & Adherence Event Stream</span>
            </h2>
            <p className="text-xs text-slate-500">Ingested via `POST /api/v1/iot/dispense` from smart pill dispensers</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {events.length} Telemetry Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Scheduled Time</th>
                <th className="py-3 px-4">Dispensed Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dose Taken</th>
                <th className="py-3 px-4">Sensor Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-600">{ev.scheduled_time}</td>
                  <td className="py-3 px-4 font-mono text-slate-900">{ev.dispensed_time || '—'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{ev.patient_name}</td>
                  <td className="py-3 px-4 text-slate-700">{ev.medication_name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      ev.status === 'dispensed'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : ev.status === 'late'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {ev.dose_taken ? (
                      <span className="text-emerald-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-red-600 font-semibold">No / Missed</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                    {ev.telemetry_notes || 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
