const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Usuarios = mongoose.model("Usuarios");

// Configurar la estrategia local para Passport
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Buscar al usuario por su dirección de correo electrónico
        const usuario = await Usuarios.findOne({ email });

        if (!usuario) {
          // Si el usuario no existe, devolver un mensaje de error
          return done(null, false, {
            message: "El Email no está registrado",
          });
        }

        // El usuario existe, verificamos la contraseña
        const verificarPass = await usuario.compararPassword(password);

        if (!verificarPass) {
          // Si la contraseña no es correcta, devolver un mensaje de error
          return done(null, false, {
            message: "La contraseña no es correcta",
          });
        }

        // Usuario existe y la contraseña es correcta
        return done(null, usuario);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serializar al usuario para almacenar en la sesión
passport.serializeUser((usuario, done) => {
  done(null, usuario._id);
});

// Deserializar al usuario para obtener detalles de la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuarios.findById(id).exec();
    return done(null, usuario);
  } catch (error) {
    return done(error);
  }
});

module.exports = passport;
