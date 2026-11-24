import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { wsService } from '../services/ws';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'doctor', email: 'doctor@pharmacare.ai', password: 'Doctor@12345', label: 'Dr. Marcus Thorne (Doctor)', desc: 'Cardiology & Chronic Care' },
  { role: 'pharmacist', email: 'pharmacist@pharmacare.ai', password: 'Pharm@12345', label: 'Sarah Jenkins, PharmD (Pharmacist)', desc: 'Formulary & Drug Interactions' },
  { role: 'researcher', email: 'researcher@pharmacare.ai', password: 'Research@12345', label: 'Prof. David Chen (Researcher)', desc: 'AI/ML & Population Signals' },
  { role: 'admin', email: 'admin@pharmacare.ai', password: 'Admin@12345', label: 'Dr. Eleanor Vance (System Admin)', desc: 'User Management & Audit Logs' },
  { role: 'patient', email: 'patient@pharmacare.ai', password: 'Patient@12345', label: 'Robert Miller (Patient)', desc: 'Personal Meds & ADR Self-Reporting' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacare_user');
      if (!saved) return DEMO_ACCOUNTS[0]; // Default to Doctor role for instant preview
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.email) return parsed;
      return DEMO_ACCOUNTS[0];
    } catch (e) {
      localStorage.removeItem('pharmacare_user');
      return DEMO_ACCOUNTS[0];
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pharmacare_token') || 'demo-preview-token');
  const [loading, setLoading] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res?.data && typeof res.data === 'object' && res.data.email) {
            setUser(res.data);
            localStorage.setItem('pharmacare_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // If auth check fails, don't crash or kick out on preview
        })
        .finally(() => setLoading(false));

      // Connect WebSocket
      wsService.connect();
      const unsubscribe = wsService.subscribe((event) => {
        if (event.type === 'new_adr_report') {
          setLiveAlerts((prev) => [
            {
              id: Date.now(),
              type: 'adr',
              title: `ADR Alert: ${event.data.medication}`,
              desc: `${event.data.severity.toUpperCase()} reaction reported for ${event.data.patient_mrn}`,
              time: 'Just now'
            },
            ...prev.slice(0, 7)
          ]);
        } else if (event.type === 'iot_dispense_event') {
          setLiveAlerts((prev) => [
            {
              id: Date.now(),
              type: 'iot',
              title: `IoT Dispensed: ${event.data.medication}`,
              desc: `${event.data.patient_name} - Status: ${event.data.status}`,
              time: 'Just now'
            },
            ...prev.slice(0, 7)
          ]);
        }
      });

      return () => {
        unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('pharmacare_token', access_token);
    localStorage.setItem('pharmacare_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { access_token, user: newUser } = res.data;
    localStorage.setItem('pharmacare_token', access_token);
    localStorage.setItem('pharmacare_user', JSON.stringify(newUser));
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('pharmacare_token');
    localStorage.removeItem('pharmacare_user');
    setToken(null);
    setUser(null);
    wsService.disconnect();
  };

  const switchRole = async (targetRole) => {
    const cred = DEMO_ACCOUNTS.find((a) => a.role === targetRole);
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchRole,
      liveAlerts,
      role: user?.role || 'guest'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
