const mongoose = require("mongoose");
const Usuarios = require("../models/Usuarios");
const Usuario = mongoose.model("Usuarios");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const shortid = require("shortid");

exports.subirImagen = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es muy grande, maximo 100kb");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }

      res.redirect("/administracion");
      return;
    } else {
      return next();
    }
  });
};

//Configuramos multer

const configuracionMulter = {
  limits: { fileSize: 100000 },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + "../../public/uploads/perfiles");
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      //El callback se ejecuta como true o false, true cuando la imagen se acepta
      cb(null, true);
    } else {
      cb(new Error("Formato No Válido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("imagen");

//***************** */
exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crea una cuenta en devJobs",
    tagline:
      "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta",
  });
};

exports.validarRegistro = async (req, res, next) => {
  //sanitizar los campos

  const rules = [
    body("nombre")
      .not()
      .isEmpty()
      .withMessage("El nombre es obligatorio")
      .escape(),
    body("email")
      .isEmail()
      .withMessage("El email es obligatorio")
      .normalizeEmail(),
    body("password")
      .not()
      .isEmpty()
      .withMessage("El password es obligatorio")
      .escape(),
    body("confirmar")
      .not()
      .isEmpty()
      .withMessage("Confirmar password es obligatorio")
      .escape(),
    body("confirmar")
      .equals(req.body.password)
      .withMessage("Los passwords no son iguales"),
  ];

  await Promise.all(rules.map((validation) => validation.run(req)));
  const errores = validationResult(req);
  console.log(errores);
  //si hay errores
  if (!errores.isEmpty()) {
    req.flash(
      "error",
      errores.array().map((error) => error.msg)
    );
    res.render("crear-cuenta", {
      nombrePagina: "Crea una cuenta en Devjobs",
      tagline:
        "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta",
      mensajes: req.flash(),
    });
    return;
  }

  //si toda la validacion es correcta
  next();
};

exports.crearUsuario = async (req, res, next) => {
  //crear el usuario
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
  } catch (error) {
    console.log(error);
    req.flash("error", error);
    res.redirect("crear-cuenta");
  }
};

exports.formInisiarSesion = (req, res) => {
  res.render("iniciar-sesion", {
    nombrePagina: "Iniciar Sesión devJobs",
  });
};

//Form, editar perfil

exports.formEditarPerfil = async (req, res, next) => {
  const usuario = req.user.toObject();
  console.log(usuario);
  res.render("editar-perfil", {
    nombrePagina: "Edita tu perfil en devJobs",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    usuario,
  });
};

//Guardar cambios editar perfil

exports.editarPerfil = async (req, res) => {
  const usuario = await Usuarios.findById(req.user._id);
  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;

  if (req.body.password) {
    usuario.password = req.body.password;
  }

  if (req.file) {
    usuario.imagen = req.file.filename;
  }

  await usuario.save();
  req.flash("correcto", "Cambios Guardados Correctamente");
  res.redirect("administracion");
};

//Sanitizar y validadar el formulario de editar perfiles

exports.validarPerfil = async (req, res, next) => {
  const usuario = req.user.toObject();
  const rules = [
    body("nombre")
      .not()
      .isEmpty()
      .withMessage("El nombre es obligatorio")
      .escape(),
    body("empresa").isEmail().withMessage("El correo es obligatorio").escape(),
    body("password").escape(),
  ];
  await Promise.all(rules.map((validation) => validation.run(req)));
  const errores = validationResult(req);
  if (errores) {
    // Recargar pagina con errores
    req.flash(
      "error",
      errores.array().map((error) => error.msg)
    );
    res.render("editar-perfil", {
      nombrePagina: "Edita tu perfil en devJobs",
      cerrarSesion: true,
      nombre: req.user.nombre,
      usuario,
      imagen: req.user.imagen,
      mensajes: req.flash(),
    });
    return;
  }
  next();
};
