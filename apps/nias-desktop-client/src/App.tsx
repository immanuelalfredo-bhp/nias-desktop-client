import { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Create state for inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Logging in with:', username, password);
    setIsLoggedIn(true);
  };

  return (
    <div className="shell">
      {!isLoggedIn ? (
        <div id="loginWrap" className="login-wrap">
          <section className="card login-card">
            <h1>Login</h1>
            <p className="sub">First login creates the first Admin user.</p>
            
            {/* Controlled inputs */}
            <label htmlFor="username">Username</label>
            <input 
              id="username" 
              placeholder="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
            />

            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />

            <div className="actions">
              <button onClick={handleLogin} className="primary">Login</button>
            </div>
          </section>
        </div>
      ) : (
        <div id="app" className="app">
          <aside className="leftbar">Navigation</aside>
          <main className="content">Main Content</main>
        </div>
      )}
    </div>
  );
}

export default App;