'use client';

import dynamic from 'next/dynamic';

// The app is a client-side SPA (uses window, document, localStorage and the
// session cookie), so it is rendered in the browser only.
const App = dynamic(() => import('../App.tsx'), { ssr: false });

export default function Page() {
  return <App />;
}
