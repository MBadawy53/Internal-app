'use client';

import { useEffect, useRef } from 'react';

/**
 * Static DOM scaffold expected by the ported engine. Rendered as raw HTML so
 * the engine's inline event attributes (onclick=...) bind against the window
 * handlers it installs on init. The engine populates #auth, #sidebar, #topbar
 * and #content at runtime.
 */
const SCAFFOLD = `
<div id="auth"></div>
<div id="app">
  <div class="sb-backdrop" id="sbBackdrop" onclick="toggleSidebar(false)"></div>
  <div class="shell">
    <aside class="sidebar" id="sidebar"></aside>
    <div class="main">
      <header class="topbar" id="topbar"></header>
      <main class="content" id="content"></main>
    </div>
  </div>
  <div class="notif-panel" id="notifPanel"></div>
</div>
<div class="overlay" id="overlay" onclick="if(event.target===this)closeModal()"></div>
<div id="toasts"></div>
`;

export default function FactoringPortal() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard against React strict-mode double effect
    started.current = true;
    let active = true;
    // Client-only: load the DOM engine after the scaffold is in the document.
    void import('@/lib/portal/engine').then((m) => {
      if (active) m.initFactoringPortal();
    });
    return () => {
      active = false;
    };
  }, []);

  return <div id="cf-root" dangerouslySetInnerHTML={{ __html: SCAFFOLD }} />;
}
