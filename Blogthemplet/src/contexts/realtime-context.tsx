"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RealtimeData {
  siteName: string;
  categories: any[];
  settings: any;
  lastUpdate: number;
}

interface RealtimeContextType {
  data: RealtimeData;
  isConnected: boolean;
  isInitialLoading: boolean;
  updateData: (type: string, newData: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [data, setData] = useState<RealtimeData>({
    siteName: 'IPTV Hub',
    categories: [],
    settings: {},
    lastUpdate: 0, // Use 0 instead of Date.now() to avoid hydration mismatch
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial data from database
  useEffect(() => {
    if (!isMounted) return; // Only run on client side after mount
    
    const loadInitialData = async () => {
      try {
        // Load both settings and categories in parallel for faster loading
        const [settingsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/categories')
        ]);

        // Process settings
        if (settingsResponse.ok) {
          const settingsResult = await settingsResponse.json();
          if (settingsResult.success && settingsResult.data) {
            setData(prev => ({
              ...prev,
              siteName: settingsResult.data.siteName || 'IPTV Hub',
              settings: settingsResult.data,
              lastUpdate: Date.now(),
            }));
          }
        }

        // Process categories
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json();
          if (categoriesResult.success && categoriesResult.data) {
            setData(prev => ({
              ...prev,
              categories: categoriesResult.data,
              lastUpdate: Date.now(),
            }));
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    // Load initial data first
    loadInitialData();
  }, [isMounted]);

  useEffect(() => {
    // Only connect on client side after mount
    if (!isMounted || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/events');
        
        eventSource.onopen = () => {
          console.log('✅ Real-time connection established');
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            
            switch (update.type) {
              case 'connected':
                console.log('🔗 Connected to real-time updates');
                break;
                
              case 'settings_updated':
                console.log('⚙️ Settings updated:', update.data);
                setData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, ...update.data },
                  siteName: update.data.siteName || prev.siteName,
                  lastUpdate: update.timestamp,
                }));
                break;
                
              case 'categories_updated':
                console.log('📁 Categories updated:', update.data);
                setData(prev => ({
                  ...prev,
                  categories: update.data,
                  lastUpdate: update.timestamp,
                }));
                break;
                
              case 'site_name_updated':
                console.log('🏷️ Site name updated:', update.data);
                setData(prev => ({
                  ...prev,
                  siteName: update.data.siteName,
                  lastUpdate: update.timestamp,
                }));
                break;
                
              case 'heartbeat':
                // Keep connection alive
                break;
                
              default:
                console.log('📡 Real-time update:', update);
            }
          } catch (error) {
            console.error('Error parsing real-time update:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.log('❌ Real-time connection error, reconnecting...');
          setIsConnected(false);
          eventSource?.close();
          
          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(connect, 3000);
        };
        
      } catch (error) {
        console.error('Failed to establish real-time connection:', error);
        setIsConnected(false);
        
        // Retry connection after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
      setIsConnected(false);
    };
  }, [isMounted]);

  const updateData = (type: string, newData: any) => {
    setData(prev => ({
      ...prev,
      [type]: newData,
      lastUpdate: Date.now(),
    }));
  };

  return (
    <RealtimeContext.Provider value={{ data, isConnected, isInitialLoading, updateData }}>
      {children}
    </RealtimeContext.Provider>
  );
}
