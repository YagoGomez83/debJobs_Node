const mongoose = require("mongoose");
require("./config/db.js");
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const router = require("./routes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config({ path: ".env" });
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");

const flash = require("connect-flash");
const createError = require("http-errors");
const passport = require("./config/passport.js");
const app = express();

//Habilitar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//validación de campos con express-validator

//Habilitamos habdlebars como view

// habilitar handlebars como view
app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "layout",
    helpers: require("./helpers/handlebars.js"),
  })
);

app.set("view engine", "handlebars");

//static files

app.use(express.static(path.join(__dirname, "public")));

//sesion
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE,
    }),
  })
);

//inicializar passport

app.use(passport.initialize());
app.use(passport.session());

//Alertas / flash messages
app.use(flash());

//Crear nuestro middleware
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  next();
});

//dirname nos tra la url actual o la seleccionada

app.use("/", router());

//404 pagina no existente

app.use((req, res, next) => {
  next(createError(404, "No encontrado"));
});

//Administracion de los errores

app.use((error, req, res) => {
  res.locals.mensaje = error.message;

  const status = error.status || 500;

  res.locals.status = status;

  res.status(status);
  res.render("error");
});

//Uso timeout para aumentar el tiempo que busca en la base de datos
app.listen(process.env.PUERTO).timeout = 100000;
