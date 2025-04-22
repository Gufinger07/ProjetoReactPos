const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'segredo123';
const PORT = 3001;

let user = { id: 1, username: 'admin', password: '123456' };
let tasks = [
  { id: 1, title: 'Estudar React', date: '2024-01-01', userId: 1 },
  { id: 2, title: 'Revisar JWT', date: '2024-01-02', userId: 1 }
];
let taskId = 3;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, SECRET, (err, userDecoded) => {
      if (err) return res.sendStatus(403);
      req.user = userDecoded;
      next();
    });
  }

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).send('Usuário ou senha inválidos');
});

app.get('/tasks', authenticateToken, (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.user.id);
  res.json(userTasks);
});

app.post('/tasks', authenticateToken, (req, res) => {
  const { title, date } = req.body;
  const task = { id: taskId++, title, date, userId: req.user.id };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/tasks/:id', authenticateToken, (req, res) => {
  const { title, date } = req.body;
  const task = tasks.find(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (!task) return res.sendStatus(404);
  if (title !== undefined) task.title = title;
  if (date !== undefined) task.date = date;
  res.json(task);
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
  tasks = tasks.filter(t => !(t.id === parseInt(req.params.id) && t.userId === req.user.id));
  res.sendStatus(204);
});

app.get('/profile', authenticateToken, (req, res) => {
  res.json({ username: user.username });
});

app.put('/profile', authenticateToken, (req, res) => {
  user.username = req.body.username;
  res.json({ username: user.username });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));