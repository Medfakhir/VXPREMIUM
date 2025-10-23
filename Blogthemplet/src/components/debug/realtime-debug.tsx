"use client";

import { useRealtime } from "@/contexts/realtime-context";
import { useState } from "react";

export default function RealtimeDebug() {
  const { data, isConnected, isInitialLoading } = useRealtime();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-2 py-1 rounded text-xs"
      >
        Debug
      </button>
      
      {isVisible && (
        <div className="fixed top-12 left-4 z-50 bg-black/90 text-white p-4 rounded max-w-md max-h-96 overflow-auto text-xs">
          <h3 className="font-bold mb-2">Real-time Data Debug</h3>
          <div className="space-y-2">
            <div>
              <strong>Initial Loading:</strong> {isInitialLoading ? '🔄' : '✅'}
            </div>
            <div>
              <strong>Connected:</strong> {isConnected ? '✅' : '❌'}
            </div>
            <div>
              <strong>Site Name:</strong> {data.siteName}
            </div>
            <div>
              <strong>Categories:</strong> {data.categories.length} items
              {data.categories.length > 0 && (
                <ul className="ml-2 mt-1">
                  {data.categories.slice(0, 3).map((cat: any) => (
                    <li key={cat.id}>• {cat.name} ({cat.showInMenu ? 'menu' : 'hidden'})</li>
                  ))}
                  {data.categories.length > 3 && <li>... and {data.categories.length - 3} more</li>}
                </ul>
              )}
            </div>
            <div>
              <strong>Last Update:</strong> {new Date(data.lastUpdate).toLocaleTimeString()}
            </div>
            <div>
              <strong>Settings Keys:</strong> {Object.keys(data.settings).length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
