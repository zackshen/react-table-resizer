import React from 'react'
import ReactDOM from 'react-dom'
import './styles.css'
import Basic from './examples/Basic'

function App() {
    return (
        <div className="App">
            <Basic />
        </div>
    )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
