import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const api = axios.create({ baseURL: "http://localhost:3001" });

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <Router>
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/tasks" className="nav-link">Tarefas</Link>
          <Link to="/profile" className="nav-link">Perfil</Link>
        </div>
        {token ? <button className="logout-btn" onClick={logout}>Sair</button> : <Link to="/login" className="nav-link">Login</Link>}
      </nav>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/tasks" element={<ProtectedRoute token={token}><TaskList token={token} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute token={token}><Profile token={token} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/tasks" />} />
      </Routes>
    </Router>
  );
}

function ProtectedRoute({ token, children }) {
  return token ? children : <Navigate to="/login" />;
}

function Login({ setToken }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const { data } = await api.post("/login", form);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/tasks");
    } catch (error) {
      alert("Erro ao fazer login. Verifique suas credenciais.");
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Login</h1>
      <input placeholder="Usuário" className="input" onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Senha" className="input" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleLogin} className="btn-primary">Entrar</button>
    </div>
  );
}

function TaskList({ token }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [status, setStatus] = useState("")
  const agora = new Date();
console.log(agora)

  const loadTasks = async () => {
    try {
      const { data } = await api.get("/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.warn("Resposta inesperada:", data);
        setTasks([]);
      }
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
      setTasks([]);
    }
  };
  function compararDataTask(dataTask) {
    const hoje = new Date();
    const dataAtual = new Date(hoje.toISOString().split('T')[0]); // Zera hora
    const data = new Date(dataTask);
  
    if (data.toDateString() === dataAtual.toDateString()) {
      return "hoje";
    } else if (data < dataAtual) {
      return "passada";
    } else {
      return "futura";
    }
  }

  const addTask = async () => {
    if (!newTask.trim() || !newDate.trim()) return;
    await api.post("/tasks", { title: newTask, date: newDate }, { headers: { Authorization: `Bearer ${token}` } });
    setNewTask("");
    setNewDate("");
    loadTasks();
  };

  const updateTask = async (id, title, date) => {
    await api.put(`/tasks/${id}`, { title, date }, { headers: { Authorization: `Bearer ${token}` } });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="task-container">
      <h1 className="page-title">Tarefas</h1>
      <div className="task-input-row">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} className="input" placeholder="Nova tarefa" />
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input" />
        <button onClick={addTask} className="btn-secondary">Criar</button>
      </div>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className="task-item">
            <input value={t.title} onChange={(e) => {updateTask(t.id, e.target.value, t.date)  } } className={`tag ${compararDataTask(t.date)} task-input`} />
            <input type="date" value={t.date || ""} onChange={(e) => updateTask(t.id, t.title, e.target.value)} className={`tag ${compararDataTask(t.date)} task-input`} />
            <button onClick={() => deleteTask(t.id)} className="btn-complete">Concluído</button>
            <button onClick={() => deleteTask(t.id)} className="btn-delete">Excluir</button>
            
          </li>
        ))}
      </ul>
    </div>
  );
}

function Profile({ token }) {
  const [user, setUser] = useState({ username: "" });
  const [newName, setNewName] = useState("");

  useEffect(() => {
    api.get("/profile", { headers: { Authorization: `Bearer ${token}` } }).then(({ data }) => {
      setUser(data);
      setNewName(data.username);
    });
  }, []);

  const updateProfile = async () => {
    await api.put("/profile", { username: newName }, { headers: { Authorization: `Bearer ${token}` } });
    setUser({ ...user, username: newName });
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Perfil</h1>
      <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" />
      <button onClick={updateProfile} className="btn-primary">Atualizar</button>
    </div>
  );
}

export default App;