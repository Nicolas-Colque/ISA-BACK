const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const config = require('./config')
const bd = require('./consultas.js');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Iniciando servidor Express
app.listen(config.express.port, () => {
    console.log('Server on port ', config.express.port);
});


app.use((req, res, next) => {
    console.log("Quién es: ", req.headers.origin);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DEvarE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DEvarE');
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.use(bodyParser.json());

app.post('/login', async (req, res) => {
    try
    {   console.log("Recieving ('/login') request: ", req.body);
        var username = req.body.username;
        var password = req.body.password;

        var resultado = await bd.validar_usuario(username, password);

        if(resultado)
        {   const token = jwt.sign({username: req.body.username}, config.jwt.secret_token);
            res.send({message: "Login correcto!", token: token});
        }
        else
        {  res.status(400).json({message: "Login incorrecto!"});;
        }
    }
    catch(err)
    {   console.log("Error en la función (app.post('/login', ...)) módulo index: ", err);
    }
})

app.post('/register', async (req, res) => {
    try
    {   console.log("Recieving (/register) request: ", req.body);
        var username = req.body.username;
        var password = req.body.password;
        var email = req.body.email;

        var resultado = await bd.insertar_usuario(username, password, email);
        if(resultado)
        {   res.status(200).json({"message": "El usuario se ha registrado correctamente."});
        }
        else
        {   res.status(400).json([]);;
        }
    }
    catch(err)
    {   console.log("Error en la función (app.post('/register', ...)) módulo index: ", err)
    }
})

app.post('/create-project', async (req, res) => {
    try
    {   console.log("Recieving (/create-project) request: ", req.body);

        var username = await jwt_get_username(req.body.token);
        var name = req.body.name;
        var description = req.body.description;
        if(username != undefined)
        {   if (req.body.visibility) visibility = 1;
            else visibility = 0;
            id_proyecto = await bd.crear_proyecto(name, description, visibility)
            await bd.agregar_miembro(username, 1, id_proyecto);
            res.status(200).json({"message": "Proyecto creado correctamente."});
            bd.set_historial(id_proyecto, "Se ha creado el proyecto.");
        } 
        else res.status(400).json({"message": "Token invalido"});
    }
    catch(err)
    {   console.log("Error en la función (app.post('/create-project', ...)) módulo index: ", err);
        res.status(400).json(err);
    }
})

app.post('/add-member', async (req, res) => {
    try
    {   var responsable = await jwt_get_username(req.body.token);
        var id_rol = req.body.id_rol;
        var id_proyecto = req.body.id_proyecto;
        var username = req.body.username;
        if(responsable != undefined) 
        {   if(await bd.agregar_miembro(username, id_rol, id_proyecto))
            {   res.status(200).json({"message": "Miembro agregado correctamente."});
                bd.set_historial(id_proyecto, "El usuario "+responsable+" ha agregado al miembro "+username+".");
            }
            else
            {   res.status(200).json({"message": "Error al agregar miembro."});
            }
        }
        else res.status(400).json({"message": "Token invalido"});
    }
    catch(err)
    {   console.log("Error en la función (/add-member) en el módulo index: ", err);
    }
})

app.post('/get-proyectos-usuario', async (req, res) => {
    try
    {   console.log("request get-proyectos-usuarios: ", req.body);
        username = await jwt_get_username(req.body.token);
        if(username != undefined) res.status(200).json(await bd.listar_proyectos_usuario(username));
        else res.status(400).json({"message": "Token invalido"});
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get_proyectos', ...)) módulo index: ", err);
        res.status(400).json(err);
    }
})

app.get('/get-proyectos-publicos', async (req, res) => {
    try
    {  res.status(200).json(await bd.listar_proyectos_publicos());
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get_proyectos', ...)) módulo index: ", err);
    }
})

app.post('/get-members', async (req, res) => {
    try
    {   var id_proyecto = req.body.id_proyecto;
        var visibility = await bd.get_visibility(id_proyecto);
        
        if(visibility == "1")
        {   res.status(200).json(await bd.listar_miembros_proyecto_publico(id_proyecto));
        }
        else if (visibility == "0")
        {   var username = await jwt_get_username(req.body.token);
            if(username != undefined) 
            {   var validacion;
                validacion = await bd.validar_miembro_proyecto(username, id_proyecto);
                if(validacion) res.status(200).json(await bd.listar_miembros_proyecto_publico(id_proyecto));
                else res.status(400).json({"message": "No tienes permisos para ver este proyecto."});
            }
            else res.status(400).json({"message": "Token de sesión invalido."});
        }
        else res.status(400).json({"message": "No se puede mostrar o no existe el proyecto."});   
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-members', ...)) módulo index: ", err);
    }
})

app.post('/set-tarea', async (req, res) => {
    try 
    {   console.log("Request de (/set-tarea): ", req.body);
        var id_proyecto = req.body.id_proyecto;
        var username = await jwt_get_username(req.body.token);
        var responsables = req.body.responsables;
        var name = req.body.name;
        var description = req.body.description;
        var id_estado = req.body.id_estado;

        if(await bd.validar_miembro_editor(username, id_proyecto)) 
        {   res.status(200).json(await bd.insertar_tarea(username, name, description, id_proyecto, id_estado, responsables));
            bd.set_historial(id_proyecto, "Se ha creado la tarea "+name+".");
        }
        else res.status(200).json({"message": "Él usuario no tiene permisos para editar."})
    }
    catch (err)
    {   console.log("Error en la función (app.post('/set-tarea', ...)) módulo index: ", err);
    }
})

app.post('/get-tareas', async (req, res) => {
    try
    {   var id_proyecto = req.body.id_proyecto;
        var visibility = await bd.get_visibility(id_proyecto);
        if(visibility == "1")
        {   res.status(200).json(await bd.listar_tareas(id_proyecto));
        }
        else if (visibility == "0")
        {   var username = await jwt_get_username(req.body.token);
            if(username != undefined) 
            {   var validacion;
                validacion = await bd.validar_miembro_proyecto(username, id_proyecto);
                if(validacion) res.status(200).json(await bd.listar_tareas(id_proyecto));
                else res.status(400).json({"message": "No tienes permisos para ver este proyecto."});
            }
            else res.status(400).json({"message": "Token de sesión invalido."});
        }
        else res.status(400).json({"message": "No se puede mostrar o no existe el proyecto."});
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-tareas', ...)) módulo index: ", err);
    }
})

app.post('/get-historial', async (req, res) => {
    try
    {   var id_proyecto = req.body.id_proyecto;
        var username = await jwt_get_username(req.body.token);
        if(username != undefined)
        {   if(await bd.validar_miembro_proyecto(username, id_proyecto)) res.status(200).json(await bd.listar_historial(id_proyecto));
            else res.status(400).json({"message": "No tienes permisos para ver este proyecto."});
        }
        else res.status(400).json({"message": "Token de sesión invalido."});
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-historial', ...)) módulo index: ", err);
    }
})

app.post('/get-members-task', async (req, res) => {
    try
    {   var id_proyecto = req.body.id_proyecto;
        var username = await jwt_get_username(req.body.token);
        if(await bd.validar_miembro_proyecto(username, id_proyecto)) res.status(200).json(await bd.listar_miembros_asignacion(id_proyecto));
        else res.status(200).json({"message": "Él usuario no tiene permisos para editar."})
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-members-task', ...)) módulo index: ", err);
    }
})

app.post('/jwt-token', async (req, res) => {
    try
    {   console.log("Recieving (/jwt-token) request: ", req.body);
        var token = req.body.token;
        res.status(200).json(await verify_jwt_token(token));
    }
    catch(err)
    {   console.log("Error en la función (app.post('/jwt-token', ...)) módulo index: ", err);
    }
})

app.post('/jwt-token-editor', async (req, res) => {
    try
    {   console.log("Recieving (/jwt-token-editor) request: ", req.body);
        var token = req.body.token;
        var id_proyecto = req.body.id_proyecto;
        var username = await jwt_get_username(token);
        if (await bd.validar_miembro_editor(username, id_proyecto)) res.status(200).json({message: "true"});
        else res.status(200).json({message: "false"});
    }
    catch(err)
    {   console.log("Error en la función (app.post('/jwt-token-editor', ...)) módulo index: ", err);
    }
})

app.get('/get-estados', async (req, res) => {
    try
    {   res.status('200').json(await bd.get_estados());
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-estados', ...)) módulo index: ", err);
    }
})

app.get('/get-roles', async (req, res) => {
    try
    {   res.status('200').json(await bd.listar_roles());
    }
    catch(err)
    {   console.log("Error en la función (app.post('/get-estados', ...)) módulo index: ", err);
    }
})


/** Función que permite verificar un token de usuario y validarlo a través
 *  de la base de datos.
 * @param  {} token
 */
async function verify_jwt_token(token)
{   try
    {   console.log(jwt.verify(token, config.jwt.secret_token));
        return bd.validar_username(jwt.verify(token, config.jwt.secret_token).username);
    }
    catch(err)
    {   console.log("Error en la función (verify_jwt_token) módulo index: ", err);
        return ({message: "false"});
    }
}
/** Función que permite obtener el nombre de usuario a través del token que es 
 *  entregado por el usuario.
 * @param  {} token
 */
async function jwt_get_username(token)
{   try
    {   return jwt.verify(token, config.jwt.secret_token).username;
    }
    catch(err)
    {   console.log("Error en la función (verify_jwt_token) módulo index: ", err);
    }
}