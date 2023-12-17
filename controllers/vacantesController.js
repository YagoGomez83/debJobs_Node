const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const shortid = require("shortid");
//******************************* */
exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el formulario y publica tu vacante",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

//Agrega las vacantes a la base de datos

exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  //usuario autor de la vacante
  vacante.autor = req.user._id;

  //Crear arreglos de habilidades (skills)
  vacante.skills = req.body.skills.split(",");
  //Almacenarlos en la base de datos
  const nuevaVacante = await vacante.save();

  //redireccionmamos

  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

// muestra una vacante

exports.mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url })
    .populate("autor")
    .lean();

  //Si no hay resultado

  if (!vacante) {
    return next();
  }

  res.render("vacante", {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true,
  });
};

exports.formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).lean();

  if (!vacante) return next();

  res.render("editar-vacante", {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

exports.editarVacante = async (req, res, next) => {
  const vacanteActualizada = req.body;

  vacanteActualizada.skills = req.body.skills.split(",");
  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true,
      runValidators: true,
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
};

//Validar y Sanitizar los campos de las nuevas vacantes

exports.validarVacante = async (req, res, next) => {
  const rules = [
    body("titulo")
      .not()
      .isEmpty()
      .withMessage("El titulo es obligatorio")
      .escape(),
    body("empresa")
      .not()
      .isEmpty()
      .withMessage("La empresa es obligatoria")
      .escape(),
    body("ubicacion")
      .not()
      .isEmpty()
      .withMessage("Agregue una Ubicación")
      .escape(),
    body("salario").not().isEmpty().withMessage("Ingrese un salario").escape(),
    body("contrato")
      .not()
      .isEmpty()
      .withMessage("Seleccione un contrato")
      .escape(),
    body("skills").not().isEmpty().withMessage("Seleccione Skills").escape(),
  ];
  await Promise.all(rules.map((validation) => validation.run(req)));
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // Recargar pagina con errores
    req.flash(
      "error",
      errores.array().map((error) => error.msg)
    );
    res.render("nueva-vacante", {
      nombrePagina: "Nueva Vacante",
      tagline: "Llena el formulario y publica tu vacante",
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
    });
    return;
  }
  next();
};

//Eliminar vacante

exports.eliminarVacante = async (req, res) => {
  const { id } = req.params;

  const vacante = await Vacante.findById(id);

  console.log(vacante);

  if (verificarAutor(vacante, req.user)) {
    //Todo bien eliminar usuario
    await vacante.deleteOne();
    res.status(200).send("Vacante Eliminada Correctamente");
  } else {
    //No permitido
    res.status(403).send("Error");
  }
};

// verificamos el autor

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  }
  return true;
};

//subir archivos en PDF

exports.subirCV = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      console.log(error);
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es muy grande, maximo 1000kb");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }

      res.redirect("back");
      return;
    } else {
      return next();
    }
  });
};

const configuracionMulter = {
  limits: { fileSize: 1000000 },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + "../../public/uploads/cv");
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      //El callback se ejecuta como true o false, true cuando la imagen se acepta
      cb(null, true);
    } else {
      cb(new Error("Formato No Válido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("cv");

//almacenar los candidatos ne la BD

exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  //Si no existe la vacante
  if (!vacante) return next();

  //Todo bein construimos el nuevo objeto

  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename,
  };

  //almacenar la vacante

  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  //mensaje flash y redireccion

  req.flash("correcto", "Se envió tu CV Correctamente");
  res.redirect("/");
};

exports.mostrarCandidatos = async (req, res, next) => {
  const vacante = await Vacante.findById(req.params.id).lean();

  if (vacante.autor != req.user._id.toString()) {
    return next();
  }

  if (!vacante) return next();

  res.render("candidatos", {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos,
  });
};

//Buscador de vacantes

exports.buscarVacante = async (req, res) => {
  const vacantes = await Vacante.find({
    $text: {
      $search: req.body.q,
    },
  }).lean();

  //mostrar las vacantes

  res.render("home", {
    nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
    barra: true,
    vacantes,
  });
};
