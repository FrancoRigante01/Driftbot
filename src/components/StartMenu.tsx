import React from 'react'

interface StartMenuProps {
  onStart: () => void
}

const StartMenu: React.FC<StartMenuProps> = ({ onStart }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6"
      style={{ width: '100vw', height: '100vh', background: 'transparent' }}
    >
      <h1 className="text-white text-5xl font-bold select-none">Driftbot</h1>
      <button
        onClick={onStart}
        className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded text-3xl text-white font-semibold"
      >
        Iniciar Juego
      </button>
    </div>
  )
}

export default StartMenu
