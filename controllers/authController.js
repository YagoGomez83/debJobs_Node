const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require("crypto");
const enviarEmail = require("../handlers/email");

exports.autenticarUsuario = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMessage: "Ambos campos son obligatorios",
});
//revisar si el usuario esta autenticado

exports.verificarUsuario = (req, res, next) => {
  //revisar el usuario

  if (req.isAuthenticated()) return next();

  res.redirect("/iniciar-sesion");
};

exports.mostrarPanel = async (req, res, next) => {
  //consultar el usuario autenticado

  const vacantes = await Vacante.find({ autor: req.user._id }).lean();
  console.log(vacantes);

  res.render("administracion", {
    nombrePagina: "Panel de Administracion",
    tagline: "Crea y Administra tus vacantes desde aquí",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes,
  });
};

exports.cerrarSesion = (req, res) => {
  // Verifica si estás usando una versión de Passport que requiere un callback

  // Si es así, proporciona un callback
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.flash("correcto", "Cerraste Sesión Correctamente");
    // Hacer algo después del logout
    return res.redirect("/iniciar-sesion"); // Redirigir a la página principal u otra página después del logout
  });
};

/*Formulario para resetar el password */

exports.formReestablecerPassword = (req, res) => {
  res.render("reestablecer-password", {
    nombrePagina: "Restablece tu Contraseña",
    tagline:
      "Si ya tienes una cuenta pero olvidaste tu contraseña, coloca tu correo",
  });
};

//Genera el Token en la tabla del usuario

exports.enviarToken = async (req, res) => {
  const usuario = await Usuarios.findOne({ email: req.body.email });

  if (!usuario) {
    req.flash("error", "No existe esa cuenta");
    return res.redirect("/iniciar-sesion");
  }

  //El usuario existe, generar token
  usuario.token = crypto.randomBytes(20).toString("hex");
  usuario.expira = Date.now() + 3600000;
  //Guardar el usuario

  await usuario.save();

  const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

  console.log(resetUrl);

  // Enviar notificacion por email

  await enviarEmail.enviar({
    usuario,
    subject: "Password Reset",
    resetUrl,
    archivo: "reset",
  });

  //todo correcto
  req.flash("correcto", "Revisa tu email para las indicaciones");
  res.redirect("iniciar-sesion");
};

//valida si el token es valido y el usuario existe, muestra la vista

exports.reetablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now(),
    },
  });
  if (!usuario) {
    req.flash("error", "El formulario ya no es valido, intenta de nuevo");
    return res.redirect("/reestablecer-password");
  }

  //Todo bien, mostrar el formulario
  res.render("nuevo-password", {
    nombrePagina: "Nuevo password",
  });
};

//almacena el nuevo password en la base de datos

exports.guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now(),
    },
  });

  //No existe el usuario o el token ya expiro o es invalido

  if (!usuario) {
    req.flash("error", "El formulario ya no es valido, intenta de nuevo");
    return res.redirect("/reestablecer-password");
  }

  //guardar en la base de datos

  //Asignar el nuevo password y limpiar token y expira
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  //agregar y almacenar el nuevo objeto

  await usuario.save();

  //redirigir
  req.flash("correcto", "Password Modificado Correctamente");
  res.redirect("/iniciar-sesion");
};
