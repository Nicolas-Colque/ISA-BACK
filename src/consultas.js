const fs = require('fs');
const { makeDb } = require('mysql-async-simple');
const { JsonWebTokenError } = require('jsonwebtoken');
const { Interface } = require('readline');
const mysql = require('mysql2');
let config = require('./config'); 

const connection = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port
  });

  const bd = makeDb();
  bd.connect(connection);
  
  module.exports = {
      insertar_usuario, validar_usuario, crear_proyecto, agregar_miembro, validar_username, listar_proyectos_usuario,
      get_visibility, validar_miembro_proyecto, listar_miembros_proyecto, listar_proyectos_publicos, validar_miembro_editor,
      get_estados, listar_miembros_asignacion, insertar_tarea, listar_tareas, listar_historial, set_historial, listar_roles
  }
  
  /** 
   * Función que permite insertar un usuario en la base de datos a través de la consulta:
   ** insert into usuario (username, password, email)
   * values ('@username', '@password', '@email')
   * @param  {} username Nombre del usuario
   * @param  {} password Contraseña
   * @param  {} email Correo eléctronico
   */
  async function insertar_usuario(username, password, email)
  { try
    {   await bd.query(connection, "insert into usuario (username, password, email) values ('"+username+"', '"+password+"', '"+email+"')");
        return(true);
    }
    catch(err)
    {   console.log("Error en la función (insertar_usuario) módulo de consultas: "+ err);  
        return(false);      
    }
  }
  /** Función que permite validar la existencia de un usuario específico en la base de datos a través de la consulta:
   ** select 1 from usuario
   * where username='@username' AND password='@password'
   * @param  {} username Usuario
   * @param  {} password Contraseña
   */
  async function validar_usuario(username, password)
  {try
    {   res = await bd.query(connection, "select 1 from usuario where username= '"+username+"' AND password='"+password+"'");
        if(JSON.stringify(res) != "[]") return true;
        else return false;
       
    }
    catch
    {   console.log("Error en la función (validar_usuario) módulo de consultas: "+ err);        
        return false;
    }
  }

/** Función que permite la creación de un proyecto a través de la siguiente consulta:
 ** insert into proyecto (name, description, creation_date,visibility)
 * values ('@name', '@description',     ,'@visibility')
 * @param  {} name Nombre del proyecto
 * @param  {} description Descripción
 * @param  {} visibility Visibilidad
 * @return {} ID del proyecto
 */
async function crear_proyecto(name, description, visibility)
{   try
    {   res = await bd.query(connection, "insert into proyecto (name, description, creation_date, visibility) values ('"+name+"', '"+description+"', CURRENT_TIMESTAMP() ,'"+visibility+"')");
        return res['insertId'];
    }
    catch(err)
    { console.log("Error en la función (crear_proyecto) módulo de consultas: "+ err);
    }
}

/** Función que permite agregar un miembro al proyecto a través de la siguiente consulta:
 ** insert into miembro (id_usuario, id_rol, id_proyecto) values ('**id_usuario', '@id_rol', '@id_proyecto')
 * Está función utiliza los roles:
 * 1-Creador 
 * 2-Editor
 * 3-Lector
 * @param  {} username nombre del usuario
 * @param  {} id_rol identificación del rol del miembro
 * @param  {} id_proyecto identificación del proyecto
 */
async function agregar_miembro(username, id_rol, id_proyecto)
{   id_usuario = await obtener_id_usuario(username);
    try
    {   res = await bd.query(connection, "select 1 from miembro where id_usuario = "+id_usuario+" and id_proyecto = '"+id_proyecto+"'");
        
        if(JSON.stringify(res) == "[]")
        {   await bd.query(connection, "insert into miembro (id_usuario, id_rol, id_proyecto) values ('"+id_usuario+"', '"+id_rol+"', '"+id_proyecto+"')");       
            return true;
        }   
        else return false;
    }
    catch(err)
    {   console.log("Error en la función (agregar_miembro) módulo de consultas: ", err);
        return false;
    }
}
/** Función que permite listar los proyectos del usuario mediante la siguiente consulta:
 ** select proyecto.id_proyecto, proyecto.name, rol.name, proyecto.description
 * from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario
 * inner join rol on rol.id_rol = miembro.id_rol
 * inner join proyecto on proyecto.id_proyecto = miembro.id_proyecto
 * where username = '@username'
 * @param  {} username
 */
async function listar_proyectos_usuario(username)
{   try
    {   res = await bd.query(connection, "select proyecto.id_proyecto, proyecto.name, rol.name as role_name, proyecto.description from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario inner join rol on rol.id_rol = miembro.id_rol inner join proyecto on proyecto.id_proyecto = miembro.id_proyecto where username = '"+username+"' order by creation_date desc");
        console.log(res);
        return(res);
    }
    catch(err)
    {   console.log("Error en la función (listar_proyectos_usuario) módulo de consultas: ", err);
    }
}
/**Función para listar los proyectos visibles públicamente
 ** select id_proyecto, name, description
 * from proyecto
 * where visibility = '1'
 */
async function listar_proyectos_publicos()
{   try
    {   res = await bd.query(connection, "select id_proyecto, name, description from proyecto where visibility = '1' order by creation_date desc");
        return(res);
    }
    catch(err)
    {   console.log("Error en la función (listar_proyectos_publicos) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }

}
/**Función que permite listar los miembros de un proyecto proyecto con su respectivo rol, a través de la siguiente consulta:
 ** select username, rol.name
 * from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario
 * inner join rol on rol.id_rol = miembro.id_rol
 * where username = '@username'
 * @param  {} id_proyecto
 */
async function listar_miembros_proyecto(id_proyecto)
{   try
    {   res = await bd.query(connection, "select username, rol.name from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario inner join rol on rol.id_rol = miembro.id_rol where id_proyecto = '"+id_proyecto+"'");
        console.log(res);
        return(res);
    }
    catch(err)
    {   console.log("Error en la función (listar_miembros) módulo de consultas: ", err);
    }
}
/** Función que permite la inserción de una tarea, a través de las siguientes consultas:
 ** Consulta para encontrar la ID del miembro del proyecto:
 * select id_miembro from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario
 * where username = '@username' and id_proyecto = '@id_proyecto@'
 ** Consulta para insertar la tarea:
 * insert into tarea(name, description, id_proyecto, creation_date, id_estado, id_miembro)
 * values ('@name', CURRENT_TIMESTAMP(), '@id_estado', '**id_miembro')
 * @param  {} name
 * @param  {} description
 * @param  {} id_proyecto
 * @param  {} creation_date
 * @param  {} id_estado
 */
async function insertar_tarea(username, name, description, id_proyecto, id_estado, responsables)
{   try
    {   id_miembro = await bd.query(connection, "select id_miembro from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario where username = '"+username+"' and id_proyecto = '"+id_proyecto+"'");
        res = await bd.query(connection, "insert into tarea(name, description, id_proyecto, creation_date, id_estado, id_miembro) values ('"+name+"', '"+description+"', '"+id_proyecto+"', CURRENT_TIMESTAMP(), '"+id_estado+"', '"+id_miembro[0]['id_miembro']+"')");
        id_tarea = res['insertId'];

        responsables.forEach(user => 
        {   bd.query(connection, "insert into responsable (id_miembro, id_tarea) values ('"+user+"', '"+id_tarea+"')");
        });
        return({message: "La operación se hizo correctamente."});
    }
    catch(err)
    {   console.log("Error en la función (insertar_tarea) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}

/** Función que permite listar los miembros que pueden ser asignados para el proyecto, mandando el username y su id de miembro
 * @param  {} id_proyecto
 */
async function listar_miembros_asignacion(id_proyecto)
{   try
    {   res = bd.query(connection, "select id_miembro, username, rol.name as rol from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario inner join proyecto on proyecto.id_proyecto = miembro.id_proyecto inner join rol on rol.id_rol = miembro.id_rol where proyecto.id_proyecto = '"+id_proyecto+"'");
        return res;
    }
    catch(err)
    {   console.log("Error en la función (listar_miembros_asignacion) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}
/**Función que permite listar las tareas del proyecto en específico a través de la siguiente consulta:
 ** select tarea.name, tarea.description, estado.name from proyecto
 * inner join tarea on proyecto.id_proyecto = tarea.id_proyecto
 * inner join estado on estado.id_estado = tarea.id_estado
 * where proyecto.id_proyecto = '+"id_proyecto"+'
 * @param  {} id_proyecto
 */
async function listar_tareas(id_proyecto)
{   try 
    {   return bd.query(connection, "select tarea.name as name_tarea, tarea.description, estado.name from proyecto inner join tarea on proyecto.id_proyecto = tarea.id_proyecto inner join estado on estado.id_estado = tarea.id_estado where proyecto.id_proyecto = '"+id_proyecto+"' order by tarea.creation_date desc");
    } 
    catch(err)
    {   console.log("Error en la función (listar_tareas) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}

async function set_historial(id_proyecto, description)
{   try
    {   await bd.query(connection, "insert into historial (description, exchange_date, id_proyecto) values ('"+description+"', CURRENT_TIMESTAMP(), '"+id_proyecto+"')");
    }
    catch(err)
    {   console.log("Error en la función (set_historial) módulo de consultas: ", err); 
    }
}

async function listar_historial(id_proyecto)
{   try
    {   return bd.query(connection, "select exchange_date, description from historial where id_proyecto = '"+id_proyecto+"' order by exchange_date desc");
    }
    catch(err)
    {   console.log("Error en la función (listar_historial) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}

async function listar_roles()
{   try
    {   return await bd.query(connection, "select * from rol where id_rol != '1'");
    }
    catch(err)
    {   console.log("Error en la función (listar_roles) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}

//-----------------------------------------------------------------------------------------------------------------------------------------------------------
// Funciones para apoyar a las principales

/**Función que permite obtener la id del usuario a través de la consulta:
 * select id_usuario from usuario where username = '@username'
 * @param  {} username
 */

async function obtener_id_usuario(username)
{   try
    {   res = await bd.query(connection, "select id_usuario from usuario where username = '"+username+"'");
        if(JSON.stringify(res) != "[]")
        {   return res[0]['id_usuario'];
        }
    }
    catch(err)
    {   console.log("Error en la función (obtener_id_usuario) módulo de consultas: "+ err);        
    }
}

async function validar_username(username) 
{   try
    {   res = await bd.query(connection, "select id_usuario from usuario where username = '"+username+"'");
        if(JSON.stringify(res) != "[]")
        {   return {message: "true"};
        }
        else
        {   return{message: "false"};
        }
    }
    catch(err)
    {   console.log("Error en la función (validar_username) módulo de consultas: "+ err);     
        return({message: "Error en la base de datos."}); 
    }
}

async function get_visibility(id_proyecto)
{   try
    {   res = await bd.query(connection, "select visibility from proyecto where id_proyecto = '"+id_proyecto+"'");
        if(JSON.stringify(res) != "[]")
        {   return res[0]['visibility'];
        }
        else
        {  return JSON.stringify(res);
        }
    }
    catch(err)
    {   console.log("Error en la función (validar_username) módulo de consultas: "+ err);     
        return{message: "Error en la base de datos."};   
    }
}

async function get_estados()
{   try
    {   return (await bd.query(connection, "select * from estado"));
    }
    catch(err)
    {   console.log("Error en la función (get_estado_name) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}

/** Función que permite validar si un usuario es miembro de un determinado proyecto, a través de la siguiente función:
 * select 1 from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario
 * where username = '"@username"' and id_proyecto = '@id_proyecto'
 * @param  {} username
 * @param  {} id_proyecto
 */
async function validar_miembro_proyecto(username, id_proyecto)
{   try 
    {   res = await bd.query(connection, "select 1 from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario where username = '"+username+"' and id_proyecto = '"+id_proyecto+"'");
        if(JSON.stringify(res) != "[]") return(true);
        else return(false);
    } 
    catch (err) 
    {   console.log("Error en la función (validar_username) módulo de consultas: "+ err);  
        return({message: "Error en la base de datos."});
    }
}

async function validar_miembro_editor(username, id_proyecto)
{   try 
    {   res = await bd.query(connection, "select 1 from usuario inner join miembro on usuario.id_usuario = miembro.id_usuario where username = '"+username+"' and id_proyecto = '"+id_proyecto+"' and (id_rol = '1' or id_rol = '2')");
        if(JSON.stringify(res) != "[]") return(true);
        else return(false);
    } 
    catch (err) 
    {   console.log("Error en la función (validar_miembro_editor) módulo de consultas: ", err);
        return({message: "Error en la base de datos."});
    }
}
