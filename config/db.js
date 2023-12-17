const mongosse = require("mongoose");
require("dotenv").config({ path: ".env" });

mongosse.connect(process.env.DATABASE);

mongosse.connection.on("error", (error) => {
  console.log(error.message);
});

//Importamos los modelos
require("../models/Vacantes.js");
require("../models/Usuarios.js");
