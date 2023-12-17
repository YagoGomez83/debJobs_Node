import axios from "axios";
import Swal from "sweetalert2";
document.addEventListener("DOMContentLoaded", () => {
  const skillsContainer = document.querySelector(".lista-conocimientos");

  //Limpiar las alertas
  let alertas = document.querySelector(".alertas");
  if (alertas) {
    limpiarAlertas();
  }

  if (skillsContainer) {
    skillsContainer.addEventListener("click", agregarSkills);

    //una vez que estamos en editar, llamar la función

    skillsSeleccionados();
  }

  const vacantesListado = document.querySelector(".panel-administracion");

  if (vacantesListado) {
    vacantesListado.addEventListener("click", accionesListado);
  }
});
const skills = new Set();
const agregarSkills = (e) => {
  // Declare the 'skills' set inside the function to encapsulate it

  if (e.target.tagName === "LI") {
    if (e.target.classList.contains("activo")) {
      // Remove the class and remove the skill from the set
      e.target.classList.remove("activo");
      skills.delete(e.target.textContent);
    } else {
      // Add the class and add the skill to the set
      e.target.classList.add("activo");
      skills.add(e.target.textContent);
    }
  }

  const skillsArray = [...skills];
  document.querySelector("#skills").value = skillsArray;
};

const skillsSeleccionados = () => {
  const seleccionadas = Array.from(
    document.querySelectorAll(".lista-conocimientos .activo")
  );

  seleccionadas.forEach((seleccionada) => {
    skills.add(seleccionada.textContent);
  });
  //inyectar en el hidden
  const skillsArray = [...skills];
  document.querySelector("#skills").value = skillsArray;
};

const limpiarAlertas = () => {
  let alertas = document.querySelector(".alertas");
  const interval = setInterval(() => {
    if (alertas.children.length > 0) {
      alertas.removeChild(alertas.children[0]);
    } else if (alertas.children.length === 0) {
      alertas.parentElement.removeChild(alertas);
      clearInterval(interval);
    }
  }, 2000);
};

//Eliminar vacantes

const accionesListado = (e) => {
  e.preventDefault();
  if (e.target.dataset.eliminar) {
    //Eliminar por axios
    Swal.fire({
      title: "¿Desea Elminar esta vacante?",
      text: "¡Si tu eliminas esta vacante no podras recuperarla!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "¡Eliminar!",
      cancelButtonText: "No, cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        //Enviar la petición con axios
        const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;
        //Axios

        axios
          .delete(url, { params: { url } })
          .then(function (respuesta) {
            if (respuesta.status === 200) {
              Swal.fire({
                title: "Eliminada!",
                text: respuesta.data,
                icon: "success",
              });
            }
          })
          .catch(() => {
            Swal.fire({
              type: "error",
              title: "Hubo un error",
              text: "No se pudo eliminar",
              icon: "error",
            });
          });

        //TODO: Eliminar del DOM

        e.target.parentElement.parentElement.parentElement.removeChild(
          e.target.parentElement.parentElement
        );
      }
    });
  } else if (e.target.tagName === "A") {
    window.location.href = e.target.href;
  }
};
