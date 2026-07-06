import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dashboard.css'
import App from './App.jsx'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { winkTheme } from './theme'
import { ConfirmProvider } from './components/ConfirmProvider'

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'wink-color-scheme',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider
      theme={winkTheme}
      defaultColorScheme="dark"
      colorSchemeManager={colorSchemeManager}
    >
      <ConfirmProvider>
        <Notifications position="top-right" />
        <App />
      </ConfirmProvider>
    </MantineProvider>
  </StrictMode>,
)
