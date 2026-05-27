import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function MainLayout() {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: '#06060a' }}
    >
      <style>{`
        :root {
          --sidebar-w: 280px;
        }
        @media (min-width: 1920px) {
          :root { --sidebar-w: 300px; }
        }
        @media (min-width: 2560px) {
          :root { --sidebar-w: 320px; }
        }
      `}</style>

      <Sidebar />

      <main
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ paddingLeft: 'var(--sidebar-w, 280px)' }}
      >
        <div
          className="mx-auto px-6 py-8 md:px-8 md:py-10"
          style={{
            maxWidth: 'clamp(900px, 100%, 1750px)',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
