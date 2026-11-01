import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/noto-serif/wght.css'
import '@fontsource/noto-sans-cuneiform/400.css'
import './styles.css'
import { render } from 'preact'
import { App } from './App.tsx'

render(<App />, document.getElementById('app')!)
