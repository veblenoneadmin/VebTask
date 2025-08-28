import './App.css'

function App() {
  return (
    <>
      <div>
        <h1>🎉 VebTask</h1>
        <p>Better-Auth integration working!</p>
        
        <div className="card">
          <h2>🔐 Authentication Status</h2>
          <p>Auth server running on: <code>/api/auth/*</code></p>
          <p>Health check: <a href="/api/auth/ok" target="_blank">/api/auth/ok</a></p>
          <p>Session check: <a href="/api/auth/get-session" target="_blank">/api/auth/get-session</a></p>
        </div>
        
        <p className="read-the-docs">
          ✅ Fresh better-auth implementation with Express integration
        </p>
      </div>
    </>
  )
}

export default App
