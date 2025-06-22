const express = require('express');
const app = express();
const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: { name: "Sarvani" } });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/health', require('./routes/health'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/training', require('./routes/training'));
app.use('/api/users', require('./routes/users'));