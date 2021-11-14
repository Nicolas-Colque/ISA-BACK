# Manage Project with Modules - Back-End

Proyecto creado para la asignatura de Ingeniería de Software Avanzada de la Universidad de Tarapacá. Este repositorio cuenta con la implementación del servidor Back-End del proyecto, el cual fue implementado mediante NodeJS y MySQL.

Las principales librerías utilizadas en NodeJS son las siguientes:

* express
* mysql2
* mysql-async-simple
* jsonwebtoken
* crypto

# Requerimientos

* Node v14.x o superior.
* MySQL community server V8.

# Instrucciones

Para instalar el servidor Back-End, es necesario montar la base de datos y el servidor Express.

1. Para iniciar la instalación debes clonar el repositorio en una dirección local. 

2. Montar la base de datos MySQL utilizando el script `/ISA-BACK/bd/bd_script.sql`, recomendamos utilizar un [contenedor mysql de docker](https://hub.docker.com/_/mysql), debido a su simplicidad y ejecutar el script correspondiente.

3. Es necesario crear una configuración inicial de las variables de entorno, para ello se debe crear un archivo `config.json` en la raiz, se debe utilizar como ejemplo el archivo `config.example.json`.

4. Dentro del repositorio, se debe ejecutar el comando`npm install --production`. Si quieres desarrollar y re-construir el código javascript y los otros archivos utiliza `npm install`.

5. Finalmente, utilizando el comando `node index.js` en `/ISA-BACK/src/` el servidor está listo para utilizarse mediante el Front-End del proyecto.

# CONTRIBUCIÓN

Todas las contribuciones son bienvenidas, sin embargo, este proyecto es un prototipo realizado para una asignatura de la universidad, así que no todas van a estar en la versión final...