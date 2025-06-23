const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// EJS Setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: 'your-secret-key', // koi bhi secret
  resave: false,
  saveUninitialized: true,
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const indexRoutes = require('./routes/index.routes');
const apiRoutes = require('./routes/api.routes'); // or './src/routes/api'
const plantRoutes = require('./routes/plant.routes');
const itemRoutes = require('./routes/item.routes');
const inventoryRoutes = require('./routes/inventory.routes');

app.use('/', indexRoutes);
app.use('/api', apiRoutes);
app.use('/plants', plantRoutes);
app.use('/items', itemRoutes);
app.use('/inventory', inventoryRoutes);

module.exports = app;
