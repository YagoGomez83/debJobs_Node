const express = require("express");

const router = express.Router();
//homeController
const homeController = require("../controllers/homeController");
//Vacantes Controller
const vacantesController = require("../controllers/vacantesController");
// Usuarios Controller
const usuariosController = require("../controllers/usuariosController");

//authController

const authController = require("../controllers/authController");

//**************Routers************************* */
module.exports = () => {
  router.get("/", homeController.mostrarTrabajos);

  //Crear Vacantes
  router.get(
    "/vacantes/nueva",
    authController.verificarUsuario,
    vacantesController.formularioNuevaVacante
  );
  router.post(
    "/vacantes/nueva",
    authController.verificarUsuario,
    vacantesController.validarVacante,
    vacantesController.agregarVacante
  );

  // mostrar vacante (singular)

  router.get("/vacantes/:url", vacantesController.mostrarVacante);

  //editar vacante
  router.get(
    "/vacantes/editar/:url",
    authController.verificarUsuario,
    vacantesController.formEditarVacante
  );
  router.post(
    "/vacantes/editar/:url",
    authController.verificarUsuario,
    vacantesController.validarVacante,
    vacantesController.editarVacante
  );

  //Eliminar vacante

  router.delete(
    "/vacantes/eliminar/:id",

    vacantesController.eliminarVacante
  );

  //Crear Cuentas

  router.get("/crear-cuenta", usuariosController.formCrearCuenta);
  router.post(
    "/crear-cuenta",
    usuariosController.validarRegistro,
    usuariosController.crearUsuario
  );

  //Autenticar

  router.get("/iniciar-sesion", usuariosController.formInisiarSesion);
  router.post("/iniciar-sesion", authController.autenticarUsuario);
  //Cerrar sesión
  router.get(
    "/cerrar-sesion",
    authController.verificarUsuario,
    authController.cerrarSesion
  );

  //resetear password(emails)

  router.get("/reestablecer-password", authController.formReestablecerPassword);

  router.post("/reestablecer-password", authController.enviarToken);

  //Resetear el password
  router.get(
    "/reestablecer-password/:token",
    authController.reetablecerPassword
  );

  router.post("/reestablecer-password/:token", authController.guardarPassword);

  //Panel de administración

  router.get(
    "/administracion",
    authController.verificarUsuario,
    authController.mostrarPanel
  );

  //Editar Perfil

  router.get(
    "/editar-perfil",
    authController.verificarUsuario,
    usuariosController.formEditarPerfil
  );
  router.post(
    "/editar-perfil",
    authController.verificarUsuario,
    // usuariosController.validarPerfil,
    usuariosController.subirImagen,
    usuariosController.editarPerfil
  );

  //Recibir Mensajes de Candidatos

  router.post(
    "/vacante/:url",
    vacantesController.subirCV,
    vacantesController.contactar
  );

  //Muestra los candidatos por vacantes

  router.get(
    "/candidatos/:id",
    authController.verificarUsuario,
    vacantesController.mostrarCandidatos
  );

  //Buscador de vacantes

  router.post("/buscador", vacantesController.buscarVacante);

  return router;
};
