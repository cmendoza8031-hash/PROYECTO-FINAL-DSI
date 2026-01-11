const API_URL = "https://dsi-backend-lcqa.onrender.com";

// --- NAVEGACIÓN ---
window.cambiarVista = (vista) => {
    const ids = ['seccionUsuarios', 'seccionAsignatura', 'seccionPerfil', 'seccionInscripciones'];
    ids.forEach(id => document.getElementById(id)?.classList.add('d-none'));
    const mapa = { 'usuarios': 'seccionUsuarios', 'asignatura': 'seccionAsignatura', 'perfil': 'seccionPerfil', 'inscripciones': 'seccionInscripciones' };
    document.getElementById(mapa[vista]).classList.remove('d-none');
    if (vista === 'usuarios') cargarUsuarios();
    if (vista === 'asignatura') cargarAsignaturas();
};

// --- LOGIN ---
document.getElementById("formLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: document.getElementById("loginCedula").value, clave: document.getElementById("loginClave").value })
    });
    if (res.ok) {
        const data = await res.json();
        document.getElementById("perfilNombre").innerText = data.usuario.nombre;
        document.getElementById("perfilCedula").innerText = "Cédula: " + data.usuario.cedula;
        document.getElementById("vistaLogin").classList.add("d-none");
        document.getElementById("vistaDashboard").classList.remove("d-none");
        cargarUsuarios();
    } else alert("Acceso Denegado");
});

// --- USUARIOS ---
async function cargarUsuarios() {
    const res = await fetch(`${API_URL}/usuarios`);
    const data = await res.json();
    document.getElementById("tablaUsuarios").innerHTML = data.map(u => `<tr><td>${u.cedula}</td><td>${u.nombre}</td><td><button class="btn btn-danger btn-sm" onclick="eliminarU(${u.id})">Eliminar</button></td></tr>`).join('');
}

document.getElementById("formUsuario").addEventListener("submit", async e => {
    e.preventDefault();
    await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cedula: document.getElementById("userCedula").value,
            nombre: document.getElementById("userNombre").value,
            clave: document.getElementById("userClave").value
        })
    });
    bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
    e.target.reset();
    cargarUsuarios();
});

window.eliminarU = async (id) => { if(confirm("¿Eliminar?")) { await fetch(`${API_URL}/usuarios/${id}`, {method:'DELETE'}); cargarUsuarios(); } };

// --- ASIGNATURAS ---
async function cargarAsignaturas() {
    const res = await fetch(`${API_URL}/asignaturas`);
    const data = await res.json();
    document.getElementById("tablaAsignatura").innerHTML = data.map(a => `
        <tr><td>${a.codigo}</td><td>${a.nombre}</td><td>${a.creditos}</td>
        <td>
            <button class="btn btn-info btn-sm text-white" onclick="abrirInscripcion(${a.id}, '${a.nombre}')">Inscribir</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarA(${a.id})">Borrar</button>
        </td></tr>`).join('');
}

document.getElementById("formAsignatura").addEventListener("submit", async e => {
    e.preventDefault();
    await fetch(`${API_URL}/asignaturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            codigo: document.getElementById("asigCodigo").value,
            nombre: document.getElementById("asigNombre").value,
            creditos: document.getElementById("asigCreditos").value
        })
    });
    bootstrap.Modal.getInstance(document.getElementById('modalAsignatura')).hide();
    e.target.reset();
    cargarAsignaturas();
});

window.eliminarA = async (id) => { if(confirm("¿Borrar?")) { await fetch(`${API_URL}/asignaturas/${id}`, {method:'DELETE'}); cargarAsignaturas(); } };

// --- LÓGICA DE INSCRIPCIÓN DEFINITIVA ---
window.abrirInscripcion = (id, nombre) => {
    cambiarVista('inscripciones');
    document.getElementById("materiaTitulo").innerText = nombre;
    document.getElementById("insIdAsig").value = id;
    cargarListaInscritos(id);
};

async function cargarListaInscritos(idAsig) {
    const res = await fetch(`${API_URL}/notas`);
    const notas = await res.json();
    const filtrados = notas.filter(n => n.asignatura_id == idAsig);
    document.getElementById("tablaInscritos").innerHTML = filtrados.map(n => `
        <tr>
            <td><strong>${n.estudiante_nombre}</strong><br><small>${n.estudiante_cedula}</small></td>
            <td>${n.periodo}</td>
            <td><span class="badge bg-primary">${n.nota_final}</span></td>
        </tr>`).join('');
}

document.getElementById("formNuevaInsc").addEventListener("submit", async e => {
    e.preventDefault();
    const idAsig = document.getElementById("insIdAsig").value;
    const datosEst = {
        cedula: document.getElementById("insCedulaEst").value,
        nombre: document.getElementById("insNombreEst").value
    };

    try {
        // 1. Asegurar Estudiante
        const resEst = await fetch(`${API_URL}/estudiantes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosEst)
        });
        const est = await resEst.json();

        // 2. Inscribir
        const resInsc = await fetch(`${API_URL}/inscripciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                estudiante_id: est.id,
                asignatura_id: idAsig,
                periodo: document.getElementById("insPeriodo").value,
                nota_final: document.getElementById("insNota").value
            })
        });

        if(resInsc.ok) {
            alert("✅ Inscrito con éxito");
            document.getElementById("insCedulaEst").value = "";
            document.getElementById("insNombreEst").value = "";
            cargarListaInscritos(idAsig);
        } else {
            alert("❌ Error en el servidor al inscribir");
        }
    } catch (err) {
        console.error(err);
        alert("Fallo de conexión");
    }
});