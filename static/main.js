let dataGlobal = { clientes: [], proveedores: [], almacenes: [], categorias: [], productos: [], existencias: [], kardex: [], ventas: [], tasas: [], lista_precios_dinamica: [], notas_credito: [], coberturas: [] };
let configPag = { clientes: { pag: 1, filas: 10 }, proveedores: { pag: 1, filas: 10 }, almacenes: { pag: 1, filas: 10 }, categorias: { pag: 1, filas: 10 }, productos: { pag: 1, filas: 10 }, existencias: { pag: 1, filas: 10 }, kardex: { pag: 1, filas: 10 }, historial_ventas: { pag: 1, filas: 10 } };
let carritoVentas = [];
let tasaActualEur = 0;
let stockPorAlmacenTemp = [];
let notificacionesGlobales = {};
let configSis = { permitir_descuentos: 'true', font_size: '14' };
let idTasaPendienteBorrar = null;
let itemsDevolucionTemporal = [];
let notasCreditoClienteActual = [];
let ncSeleccionadaParaPago = null;

const modulosUI = [
    { id: 'clientes', icono: 'fa-users', titulo: 'Clientes', headers: ['Cédula/RIF', 'Nombre', 'Celular', 'Correo', 'Registro', 'Acciones'] },
    { id: 'proveedores', icono: 'fa-handshake', titulo: 'Proveedores', headers: ['Nombre', 'Tipo', 'Correo', 'Teléfono', 'Registro', 'Acciones'] },
    { id: 'almacenes', icono: 'fa-warehouse', titulo: 'Almacenes', headers: ['Nombre', 'Ubicación', 'Registro', 'Acciones'] },
    { id: 'categorias', icono: 'fa-tags', titulo: 'Categorías', headers: ['Nombre', 'Descripción', 'Registro', 'Acciones'] },
    { id: 'productos', icono: 'fa-box-open', titulo: 'Productos', headers: ['Foto', 'Cód.', 'Descripción', 'Categoría', 'U. Medida', 'Precio Obj. USD', 'Mínimo', 'Estado', 'Acciones'] },
    { id: 'existencias', icono: 'fa-cubes', titulo: 'Existencias Físicas', headers: ['CÓD.', 'DESCRIPCIÓN', 'U. MEDIDA', 'STOCK MÍN.', 'TOTAL FÍSICO (A + B)', 'STOCK DISPONIBLE VENTA (A)', 'EN ALMACÉN DEVOLUCIONES (B)', 'COSTO UNIT.', 'TOTAL COSTO DE ADQUISICIÓN', 'ACCIÓN'] },
    { id: 'kardex', icono: 'fa-clipboard-list', titulo: 'Kardex General', headers: ['Consec.', 'Fecha', 'Movimiento', 'Producto', 'Cant.', 'Costo U.', 'Responsable', 'Detalles / Motivo'] },
    { id: 'historial_ventas', icono: 'fa-receipt', titulo: 'Historial de Notas de Entrega', headers: ['Nº Entrega', 'Fecha', 'Cliente', 'Teléfono', 'Total', 'Devoluciones', 'Acciones'] }
];

function inicializarUI() {
    const contenedor = document.getElementById('vistas-dinamicas');
    const contenedorModales = document.getElementById('modales-dinamicos');
         
    modulosUI.forEach(m => {
        let btnNuevo = m.id !== 'existencias' && m.id !== 'kardex' && m.id !== 'historial_ventas' ? `<button class="btn btn-theme rounded-pill shadow bounce-hover px-4 py-2 fw-bold" onclick="abrirModal('${m.id}')">+ Nuevo</button>` : '';
        let btnExtra = m.id === 'historial_ventas' ? `<button class="btn btn-danger rounded-pill shadow bounce-hover px-4 py-2 fw-bold ms-2" onclick="abrirModalDevoluciones()"><i class="fa-solid fa-rotate-left"></i> Devoluciones por Venta</button>` : '';
                 
        contenedor.innerHTML += `
            <div id="modulo-${m.id}" class="modulo-vista d-none">
                <div class="d-flex justify-content-between align-items-center mb-4"><h2 class="fw-bold titulo-modulo d-flex align-items-center"><span class="icon-bubble title-bubble shadow-sm me-3 text-theme-solid"><i class="fa-solid ${m.icono}"></i></span> ${m.titulo}</h2><div>${btnNuevo}${btnExtra}</div></div>
                <div class="card ios-card border-0"><div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4"><div class="d-flex align-items-center gap-2"><span class="small fw-bold text-muted">Mostrar</span><select class="form-select ios-input py-1 px-2 text-center fw-bold" id="filas-${m.id}" style="width: 80px;" onchange="cambiarFilas('${m.id}')"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="9999">Todas</option></select></div><input type="text" id="buscar-${m.id}" class="form-control ios-input w-50" placeholder="🔍 Buscar (por nombre, fecha, código)..." onkeyup="filtrarYPaginar('${m.id}')"></div>
                    <div class="table-responsive"><table class="table table-hover align-middle ios-table w-100 text-center" id="tabla-${m.id}"><thead><tr>${m.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
                    <div class="d-flex justify-content-between align-items-center mt-3"><span class="small fw-bold text-muted" id="info-pag-${m.id}"></span><div class="btn-group shadow-sm rounded-pill"><button class="btn btn-light border fw-bold px-3" onclick="cambiarPagina('${m.id}', -1)">Anterior</button><button class="btn btn-light border fw-bold px-3" onclick="cambiarPagina('${m.id}', 1)">Siguiente</button></div></div>
                </div></div>
            </div>`;
    });

    contenedorModales.innerHTML = `
        ${crearHTMLModal('clientes', 'Cliente', `<input type="text" id="c_doc" class="form-control ios-input mb-3 text-center" placeholder="Cédula / RIF (Opcional)"><input type="text" id="c_nom" class="form-control ios-input mb-3 text-center" placeholder="Nombre" required><div class="input-group mb-3 ios-input-group p-1"><select id="c_cod" class="form-select border-0 bg-transparent fw-bold text-muted text-center" style="max-width: 100px;"><option value="+58">🇻🇪 +58</option><option value="+57">🇨🇴 +57</option></select><input type="number" id="c_tel" class="form-control border-0 bg-transparent fw-bold text-center" placeholder="Celular" required></div><input type="email" id="c_cor" class="form-control ios-input mb-3 text-center" placeholder="Correo Electrónico (Opcional)"><h6 class="fw-bold mt-3 mb-2 border-bottom pb-1">Dirección de Envío</h6><div class="row g-2 mb-2"><div class="col-4"><input type="text" id="c_pais" class="form-control ios-input text-center" placeholder="País"></div><div class="col-4"><input type="text" id="c_est" class="form-control ios-input text-center" placeholder="Estado"></div><div class="col-4"><input type="text" id="c_mun" class="form-control ios-input text-center" placeholder="Municipio"></div></div><textarea id="c_dir_ent" class="form-control ios-input mb-2 text-center" rows="2" placeholder="Dirección Exacta de Entrega"></textarea><input type="text" id="c_ref" class="form-control ios-input mb-2 text-center" placeholder="Punto de Referencia"><input type="text" id="c_coo" class="form-control ios-input mb-2 text-center" placeholder="Coordenadas Google Maps"><input type="text" id="c_tipo_env" class="form-control ios-input mb-4 text-center" placeholder="Tipo de Envío (Agencia / Delivery)">`)}
        ${crearHTMLModal('proveedores', 'Proveedor', `<input type="text" id="p_nom" class="form-control ios-input mb-3 text-center" placeholder="Nombre" required><select id="p_tipo" class="form-select ios-input mb-3 text-center fw-bold" required><option value="" disabled selected>Selecciona Tipo</option><option value="Distribuidor/Mayorista">Distribuidor/Mayorista</option><option value="Fabricante">Fabricante</option><option value="Importador">Importador</option></select><input type="text" id="p_tel" class="form-control ios-input mb-3 text-center" placeholder="Teléfono" required><input type="email" id="p_cor" class="form-control ios-input mb-3 text-center" placeholder="Correo"><textarea id="p_dir" class="form-control ios-input mb-4 text-center" rows="2" placeholder="Dirección"></textarea>`)}
        ${crearHTMLModal('almacenes', 'Almacén', `<input type="text" id="a_nom" class="form-control ios-input mb-3 text-center" placeholder="Nombre del Almacén" required><textarea id="a_ubi" class="form-control ios-input mb-4 text-center" rows="2" placeholder="Ubicación / Referencia"></textarea>`)}
        ${crearHTMLModal('categorias', 'Categoría', `<input type="text" id="cat_nom" class="form-control ios-input mb-3 text-center" placeholder="Nombre de Categoría" required><textarea id="cat_des" class="form-control ios-input mb-4 text-center" rows="2" placeholder="Descripción"></textarea>`)}
        ${crearHTMLModal('productos', 'Producto', `<input type="text" id="prod_bar" class="form-control ios-input mb-3 text-center" placeholder="Código de Barras"><input type="text" id="prod_des" class="form-control ios-input mb-3 text-center" placeholder="Descripción del Producto" required><div class="row"><div class="col-6"><select id="prod_cat" class="form-select ios-input mb-3 text-center fw-bold" required><option value="">Categoría...</option></select></div><div class="col-6"><select id="prod_prov" class="form-select ios-input mb-3 text-center fw-bold" required><option value="">Proveedor...</option></select></div></div><div class="row"><div class="col-6"><select id="prod_uni" class="form-select ios-input mb-3 text-center fw-bold" required><option value="" disabled selected>U. Medida</option><option value="Unidades">Unidades</option><option value="Paquetes">Paquetes</option><option value="Sets">Sets</option><option value="Kg">Kg</option><option value="Gr">Gr</option></select></div><div class="col-6"><input type="number" step="0.01" id="prod_precio_usd" class="form-control ios-input mb-3 text-center bg-success-subtle fw-bold" placeholder="Precio Obj. USD ($)" required></div></div><input type="number" id="prod_min" class="form-control ios-input mb-3 text-center w-50 mx-auto" placeholder="Stock Mínimo" required><select id="prod_est" class="form-select ios-input mb-3 text-center fw-bold" required><option value="ACTIVO">🟢 ACTIVO</option><option value="NO DISPONIBLE">🔴 NO DISP.</option></select><input type="text" id="prod_foto" class="form-control ios-input mb-4 text-center" placeholder="Url Foto (Opcional)">`)}
        ${crearHTMLModal('tasas', 'Registrar Tasa del Día', `
            <div class="row g-2 mb-2">
              <div class="col-6"><input type="date" id="t_fecha" class="form-control ios-input text-center" required></div>
              <div class="col-6"><input type="number" step="0.01" id="t_dbcv" class="form-control ios-input text-center" placeholder="Dólar BCV"></div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6"><input type="number" step="0.01" id="t_bin" class="form-control ios-input text-center bg-warning-subtle fw-bold" placeholder="Binance P2P *" oninput="calcBrechaForm()" required></div>
              <div class="col-6"><input type="number" step="0.01" id="t_byb" class="form-control ios-input text-center" placeholder="Bybit P2P"></div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6"><input type="number" step="0.01" id="t_dpro" class="form-control ios-input text-center" placeholder="Dólar Promedio"></div>
              <div class="col-6"><input type="number" step="0.01" id="t_ebcv" class="form-control ios-input text-center bg-info-subtle fw-bold" placeholder="Euro BCV *" oninput="calcBrechaForm()" required></div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6"><input type="number" step="0.01" id="t_zel" class="form-control ios-input text-center" placeholder="Zelle"></div>
              <div class="col-6"><input type="number" step="0.01" id="t_pay" class="form-control ios-input text-center" placeholder="Paypal"></div>
            </div>
            <div class="row g-2 mb-4">
              <div class="col-6"><input type="time" step="1" id="t_hora" class="form-control ios-input text-center" required></div>
              <div class="col-6"><input type="text" id="t_brecha_print" class="form-control text-center bg-danger-subtle text-danger fw-bolder" placeholder="% Brecha Auto" readonly></div>
            </div>
        `)}
    `;

    document.getElementById('btn_confirmar_borrar_tasa').addEventListener('click', procesarEliminacionTasa);
}

function crearHTMLModal(id, titulo, campos) {
    return `<div class="modal fade" id="modal-${id}" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content ios-modal border-0 shadow-lg"><div class="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center"><h5 class="modal-title fw-bolder" id="titulo-modal-${id}">${titulo}</h5><button type="button" class="btn-close rounded-circle bg-light p-2 m-0" data-bs-dismiss="modal"></button></div><div class="modal-body p-4 pt-3"><form onsubmit="guardarFormulario(event, '${id}')"><input type="hidden" id="id-${id}">${campos}<button type="submit" class="btn btn-theme w-100 rounded-pill fw-bold py-2 shadow-sm bounce-hover fs-6">Guardar</button></form></div></div></div></div>`;
}

function calcBrechaForm() {
    let bin = parseFloat(document.getElementById('t_bin').value);
    let eur = parseFloat(document.getElementById('t_ebcv').value);
    if(bin && eur) { document.getElementById('t_brecha_print').value = (((bin/eur)-1)*100).toFixed(2) + '%'; }
}

function cargarConfiguracion() {
    const c1 = localStorage.getItem('themeC1') || '#af52de';
    const c2 = localStorage.getItem('themeC2') || '#5e5ce6';
    aplicarTemaCSS(c1, c2);
    const nom = localStorage.getItem('companyName') || 'Dashboard';
    document.getElementById('brand-name').innerText = nom;
    document.getElementById('input-nombre-empresa').value = nom;
    const fnt = localStorage.getItem('appFont') || "'Plus Jakarta Sans', sans-serif";
    document.getElementById('app-body').style.fontFamily = fnt;
    document.getElementById('selector-fuente').value = fnt;
}

function cambiarTema(c1, c2) { localStorage.setItem('themeC1', c1); localStorage.setItem('themeC2', c2); aplicarTemaCSS(c1, c2); }

function aplicarTemaCSS(c1, c2) {
    document.documentElement.style.setProperty('--theme-color-1', c1);
    document.documentElement.style.setProperty('--theme-color-2', c2);
    let h = c1.substring(1).split('');
    if(h.length==3) h=[h[0],h[0],h[1],h[1],h[2],h[2]];
    h='0x'+h.join('');
    document.documentElement.style.setProperty('--theme-light', 'rgba('+[(h>>16)&255,(h>>8)&255,h&255].join(',')+',0.1)');
}

function cambiarFuente() { document.getElementById('app-body').style.fontFamily = document.getElementById('selector-fuente').value; }
function cambiarTamanoFuente() {
    const val = document.getElementById('selector-tamano-fuente').value;
    document.documentElement.style.setProperty('--app-font-size', val + 'px');
    document.getElementById('lbl-tamano-fuente').innerText = val + 'px';
}

async function guardarConfiguracionesFull(e) {
    if(e) e.preventDefault();
    const n = document.getElementById('input-nombre-empresa').value;
    const f = document.getElementById('selector-fuente').value;
    const s = document.getElementById('selector-tamano-fuente').value;
    const desc = document.getElementById('switch-descuentos').checked ? 'true' : 'false';
    if(n.trim()!=="") { localStorage.setItem('companyName', n); document.getElementById('brand-name').innerText = n; }
    localStorage.setItem('appFont', f);
    await fetch('/api/configuracion', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({font_size: s, permitir_descuentos: desc}) });
    aplicarLogicaDescuentos(desc);
    let btn = e ? e.target : null;
    if(btn) { btn.innerText = "¡Guardado con éxito!"; setTimeout(() => { btn.innerText = "Guardar Configuraciones"; }, 2000); }
}

document.getElementById('menu-toggle').addEventListener('click', () => document.getElementById('wrapper').classList.toggle('toggled'));
setInterval(() => {
    document.getElementById('reloj-vivo').innerText = new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date());
}, 1000);

async function cargarTasasYConfig() {
    try {
        const res = await fetch('/api/configuracion');
        if(res.ok) {
            configSis = await res.json();
            let fSize = configSis.font_size || '14';
            document.getElementById('selector-tamano-fuente').value = fSize;
            document.documentElement.style.setProperty('--app-font-size', fSize + 'px');
            document.getElementById('lbl-tamano-fuente').innerText = fSize + 'px';
            document.getElementById('switch-descuentos').checked = (configSis.permitir_descuentos === 'true');
            aplicarLogicaDescuentos(configSis.permitir_descuentos);
        }
        let r = await fetch('/api/lista_precios_data');
        let data = await r.json();
        actualizarEstadoTasasHoy(data.tasas);
    } catch(e) { console.error(e); }
}

function actualizarEstadoTasasHoy(tasas) {
    let stat = document.getElementById('nav_tasa_status');
    let widg = document.getElementById('widget_tasas_hoy');
         
    if(!tasas.registrada_hoy) {
        stat.classList.remove('bg-white', 'text-dark');
        stat.classList.add('bg-danger', 'text-white');
        stat.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> FALTAN TASAS HOY';
        document.getElementById('nav_tasa_eur').innerText = '--';
        document.getElementById('nav_tasa_bin').innerText = '--';
                 
        widg.innerHTML = `<div class="col-12"><div class="alert alert-danger fw-bold border-0 shadow-sm"><i class="fa-solid fa-circle-exclamation fs-4 mb-2"></i><br>No se han registrado las tasas del día de hoy. Por favor, agregue un histórico de tasas de la jornada actual para poder emitir facturas.</div></div>`;
    } else {
        stat.classList.remove('bg-danger', 'text-white');
        stat.classList.add('bg-white', 'text-dark');
        stat.innerHTML = '<i class="fa-solid fa-check text-success"></i> AL DÍA';
        document.getElementById('nav_tasa_eur').innerText = tasas.euro_bcv.toFixed(2);
        document.getElementById('nav_tasa_bin').innerText = tasas.binance.toFixed(2);
        tasaActualEur = tasas.euro_bcv;
                 
        widg.innerHTML = `
            <div class="col-6 col-md-3"><div class="p-3 bg-white rounded-4 shadow-sm border"><span class="small text-muted fw-bold">FECHA</span><br><h5 class="fw-bolder mb-0 text-dark">${tasas.fecha}</h5></div></div>
            <div class="col-6 col-md-3"><div class="p-3 bg-white rounded-4 shadow-sm border"><span class="small text-muted fw-bold">HORA (Último Registro)</span><br><h5 class="fw-bolder mb-0 text-dark">${tasas.hora}</h5></div></div>
            <div class="col-6 col-md-3"><div class="p-3 bg-white rounded-4 shadow-sm border"><span class="small text-muted fw-bold text-truncate">BINANCE P2P (HOY)</span><br><h5 class="fw-bolder mb-0 text-theme-solid">${tasas.binance.toFixed(2)}</h5></div></div>
            <div class="col-6 col-md-3"><div class="p-3 bg-white rounded-4 shadow-sm border"><span class="small text-muted fw-bold text-truncate">BCV EURO (HOY)</span><br><h5 class="fw-bolder mb-0 text-theme-solid">${tasas.euro_bcv.toFixed(2)}</h5></div></div>
        `;
    }
}

function aplicarLogicaDescuentos(estado) {
    const permit = (estado === 'true');
    if(!permit) { document.getElementById('col-descuento-input').classList.add('d-none'); document.querySelectorAll('.col-desc-header, .col-desc-cell').forEach(el => el.classList.add('d-none')); }
    else { document.getElementById('col-descuento-input').classList.remove('d-none'); document.querySelectorAll('.col-desc-header, .col-desc-cell').forEach(el => el.classList.remove('d-none')); }
}

async function cargarDataTotal() {
    const endpoints = ['clientes', 'proveedores', 'almacenes', 'categorias', 'productos', 'existencias', 'kardex', 'ventas', 'tasas', 'notas_credito', 'coberturas'];
    for(let ep of endpoints) {
        try { let r = await fetch(`/api/${ep}`); if(r.ok) dataGlobal[ep] = await r.json(); } catch(err) { console.error(err); }
    }
    try {
        let res = await fetch('/api/resumen');
        if(res.ok) {
            let r = await res.json();
            document.getElementById('count-clientes').innerText = r.conteo.clientes || 0;
            document.getElementById('count-productos').innerText = r.conteo.productos || 0;
            document.getElementById('count-ventas').innerText = r.conteo.ventas || 0;
            notificacionesGlobales = r.notificaciones;
            actualizarCampanaNotificaciones();
        }
    } catch(e) {}

    let dl = document.getElementById('lista_clientes');
    if(dl) dl.innerHTML = dataGlobal.clientes.map(c => `<option value="${c.nombre}" data-id="${c.id}"></option>`).join('');

    let d2 = document.getElementById('lista_facturas_dev');
    if(d2) d2.innerHTML = dataGlobal.ventas.map(v => `<option value="${v.consecutivo}">${v.cliente_nombre}</option>`).join('');

    modulosUI.forEach(m => renderTabla(m.id));
    llenarSelectores();
    
    renderTablaTasas();
    cargarCoberturas();

    let r_tasas = await fetch('/api/lista_precios_data');
    actualizarEstadoTasasHoy((await r_tasas.json()).tasas);
}

// ----- FUNCIONES DE TASAS, COBERTURAS Y LISTA DE PRECIOS ----- //

function renderTablaTasas() {
    let tb = document.querySelector('#tabla-tasas tbody');
    if(!tb) return;
    tb.innerHTML = '';
    dataGlobal.tasas.forEach(t => {
        let btnAcc = `<button class="btn-action btn-edit me-1" onclick="llenarModalEditar('tasas', '${encodeURIComponent(JSON.stringify(t))}')"><i class="fa-solid fa-pen"></i></button><button class="btn-action btn-delete" onclick="eliminarRegistro('tasas', ${t.id})"><i class="fa-solid fa-trash"></i></button>`;
        tb.innerHTML += `<tr><td>${t.fecha} <br> <small class="text-muted">${t.hora}</small></td><td class="fw-bold">Bs ${parseFloat(t.dolar_bcv||0).toFixed(2)}</td><td class="fw-bold text-theme-solid">Bs ${parseFloat(t.euro_bcv||0).toFixed(2)}</td><td class="fw-bold text-warning">Bs ${parseFloat(t.binance||0).toFixed(2)}</td><td class="text-muted">Bs ${parseFloat(t.bybit||0).toFixed(2)}</td><td class="text-muted">Bs ${parseFloat(t.dolar_promedio||0).toFixed(2)}</td><td class="text-muted">Bs ${parseFloat(t.zelle||0).toFixed(2)}</td><td class="text-muted">Bs ${parseFloat(t.paypal||0).toFixed(2)}</td><td class="fw-bolder ${(t.brecha||0) > 0 ? 'text-danger':'text-success'}">${((t.brecha||0)*100).toFixed(2)}%</td><td>${btnAcc}</td></tr>`;
    });
}

function cargarCoberturas() {
    let tb = document.querySelector('#tabla-coberturas tbody');
    if(!tb) return;
    tb.innerHTML = '';
    dataGlobal.coberturas.forEach(c => {
        tb.innerHTML += `<tr><td>${c.fecha_registro}</td><td class="fw-bold">${c.rango_evaluado}</td><td>${c.fecha_pico_maximo}</td><td class="text-danger fw-bolder">${(c.porcentaje_cobertura*100).toFixed(2)}%</td><td class="text-success fw-bold">${c.factor_proteccion}</td><td><span class="badge bg-light text-dark border">${c.registrado_por}</span></td><td><span class="badge ${c.estado==='ACTIVO'?'bg-success':'bg-secondary'}">${c.estado}</span></td></tr>`;
    });
}

window.calcularCobertura = function() {
    let fIni = document.getElementById('q_fecha_ini').value;
    let fFin = document.getElementById('q_fecha_fin').value;
    if(!fIni || !fFin) return alert("Seleccione el rango de fechas.");
    let fTasas = dataGlobal.tasas.filter(t => t.fecha >= fIni && t.fecha <= fFin);
    if(fTasas.length === 0) return alert("No hay tasas en este rango.");
    
    let maxBin = Math.max(...fTasas.map(t => parseFloat(t.binance||0)));
    let maxEur = Math.max(...fTasas.map(t => parseFloat(t.euro_bcv||0)));
    let picos = fTasas.filter(t => parseFloat(t.binance||0) === maxBin);
    let fpico = picos.length > 0 ? picos[0].fecha : '--/--/----';
    let cob = (maxEur > 0) ? ((maxBin / maxEur) - 1) : 0;
    if(cob < 0) cob = 0;
    
    document.getElementById('res_fecha_pico').innerText = fpico;
    document.getElementById('res_max_bin').innerText = maxBin.toFixed(2);
    document.getElementById('res_max_eur').innerText = maxEur.toFixed(2);
    document.getElementById('res_cobertura').innerText = (cob * 100).toFixed(2) + '%';
    window.coberturaCalculadaTemp = { rango: `${fIni} a ${fFin}`, fecha_pico: fpico, cob: cob, factor: 1 + cob };
};

window.registrarCobertura = async function() {
    if(!window.coberturaCalculadaTemp) return alert("Calcule primero los parámetros.");
    let payload = { rango_evaluado: window.coberturaCalculadaTemp.rango, fecha_pico_maximo: window.coberturaCalculadaTemp.fecha_pico, porcentaje_cobertura: window.coberturaCalculadaTemp.cob, factor_proteccion: window.coberturaCalculadaTemp.factor, estado: 'ACTIVO' };
    let r = await fetch('/api/coberturas', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    if(r.ok) { alert("Cobertura registrada correctamente."); cargarDataTotal(); }
};

window.subirExcelTasas = async function() {
    let input = document.getElementById('excelTasas');
    if(!input.files[0]) return;
    let fd = new FormData();
    fd.append('file', input.files[0]);
    let r = await fetch('/api/tasas/upload', { method: 'POST', body: fd });
    if(r.ok) { alert("Tasas importadas con éxito."); cargarDataTotal(); }
    else { alert("Error importando Excel."); }
    input.value = '';
};

window.cargarListaPreciosDinamica = async function() {
    let r = await fetch('/api/lista_precios_data');
    let data = await r.json();
    actualizarEstadoTasasHoy(data.tasas);
    document.getElementById('lp_factor').innerText = (1 + data.tasas.cobertura_activa).toFixed(2);
    document.getElementById('lp_euro').innerText = "€ " + data.tasas.euro_bcv.toFixed(2);
    let tb = document.querySelector('#tabla-lista_precios_dinamica tbody');
    if(!tb) return;
    tb.innerHTML = '';
    data.productos.forEach((p, idx) => {
        let badge = p.estado_semaforo === 'MERCADO_VOLATIL' ? '<span class="badge bg-danger">MERCADO VOLTÁL</span>' : (p.estado_semaforo.includes('PRECAUCION') ? '<span class="badge bg-warning text-dark">PRECAUCIÓN</span>' : '<span class="badge bg-success">SEGURO</span>');
        tb.innerHTML += `<tr>
            <td class="text-muted fw-bold">${p.codigo||'-'}</td>
            <td><span class="badge bg-theme-light text-theme-solid">${p.categoria}</span></td>
            <td class="fw-bold text-start">${p.descripcion}</td>
            <td class="text-muted fw-bold">${p.unidad_medida}</td>
            <td class="fw-bold text-success">$${p.precio_usd.toFixed(2)}</td>
            <td class="fw-bolder">€ ${p.precio_eur.toFixed(2)}</td>
            <td class="fw-bold text-dark">Bs ${p.precio_bs.toFixed(2)}</td>
            <td>${badge}</td>
        </tr>`;
    });
};
// ------------------------------------------------------------- //

window.autoCompletarCliente = function() {
    let nom = document.getElementById('v_cli_nom').value;
    let cli = dataGlobal.clientes.find(c => c.nombre === nom);
    if(cli) {
        document.getElementById('v_cli_doc').value = cli.documento === 'PENDIENTE' ? '' : cli.documento;
        document.getElementById('v_cli_tel').value = cli.telefono;
        document.getElementById('v_cli_cor').value = cli.correo;
        document.getElementById('v_env_pais').value = cli.pais || 'Venezuela';
        document.getElementById('v_env_est').value = cli.estado;
        document.getElementById('v_env_ciu').value = cli.municipio;
        document.getElementById('v_env_dir').value = cli.direccion_entrega;
        document.getElementById('v_env_ref').value = cli.punto_referencia;
        document.getElementById('v_env_coo').value = cli.coordenadas;
        document.getElementById('v_env_tip').value = cli.tipo_envio || 'Nacional';
        actualizarNomenclatura();
    }
};

async function verificarNotasCreditoCliente() {
    let cliNombre = document.getElementById('v_cli_nom').value.trim();
    let selectPago = document.getElementById('v_metodo_pago').value;
    if(!cliNombre) return;

    let res = await fetch(`/api/clientes/notas_credito/${encodeURIComponent(cliNombre)}`);
    if(res.ok) {
        notasCreditoClienteActual = await res.json();
        if(selectPago === 'Aplicar Nota de Crédito') {
            poblarSelectNotasCredito();
        }
    }
}

function poblarSelectNotasCredito() {
    let sel = document.getElementById('v_select_nc');
    let html = '<option value="" disabled selected>Selecciona una NC a favor...</option>';
    if (notasCreditoClienteActual.length === 0) {
        html = '<option value="" disabled selected>El cliente no tiene NC disponibles</option>';
    } else {
        notasCreditoClienteActual.forEach(nc => {
            let disponible = parseFloat(nc.total_eur) - parseFloat(nc.saldo_usado_eur || 0);
            html += `<option value="${nc.id}" data-saldo="${disponible}" data-bs="${nc.total_bs}">${nc.consecutivo} - Saldo: €${disponible.toFixed(2)}</option>`;
        });
    }
    sel.innerHTML = html;
}

function calcularMontoNotaCredito() {
    let sel = document.getElementById('v_select_nc');
    let opt = sel.options[sel.selectedIndex];
    if(!opt || !opt.value) return;
    let saldoDispo = parseFloat(opt.getAttribute('data-saldo')) || 0;
    ncSeleccionadaParaPago = { id: opt.value, saldo: saldoDispo };
    document.getElementById('info_nc_saldo').innerText = `Saldo a favor disponible: €${saldoDispo.toFixed(2)}`;
}

function actualizarCampanaNotificaciones() {
    const totalPendientes = (notificacionesGlobales.clientes_pendientes || 0) + (notificacionesGlobales.stock_bajo || 0);
    const badge = document.getElementById('badge-notif');
    if (totalPendientes > 0) { badge.innerText = totalPendientes; badge.classList.remove('d-none'); } else { badge.classList.add('d-none'); }
}

function mostrarNotificaciones() {
    const cuerpo = document.getElementById('cuerpo-notificaciones');
    let html = '';
    if (notificacionesGlobales.clientes_pendientes > 0) html += `<div class="alert alert-warning border-0 rounded-4 shadow-sm mb-3 cursor-pointer" onclick="showModule('clientes'); bootstrap.Modal.getInstance(document.getElementById('modalNotificaciones')).hide();"><i class="fa-solid fa-user-clock me-2"></i> Tienes <strong>${notificacionesGlobales.clientes_pendientes} clientes</strong> pendientes por completar datos.</div>`;
    if (notificacionesGlobales.stock_bajo > 0) html += `<div class="alert alert-danger border-0 rounded-4 shadow-sm mb-0 cursor-pointer" onclick="showModule('existencias'); bootstrap.Modal.getInstance(document.getElementById('modalNotificaciones')).hide();"><i class="fa-solid fa-boxes-stacked me-2"></i> Hay <strong>${notificacionesGlobales.stock_bajo} productos</strong> por debajo del stock mínimo.</div>`;
    if (html === '') html = '<p class="text-muted text-center fw-bold">¡Todo al día! No hay tareas pendientes por ahora.</p>';
    cuerpo.innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalNotificaciones')).show();
}

function showModule(mId) {
    if(mId === 'panel' || mId === 'existencias' || mId === 'kardex' || mId === 'historial_ventas' || mId === 'parametros') cargarDataTotal();
    if(mId === 'lista_precios') cargarListaPreciosDinamica();
         
    document.querySelectorAll('.modulo-vista').forEach(el => { el.classList.add('d-none', 'animate-fade-up'); el.classList.remove('active'); });
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
         
    const v = document.getElementById(`modulo-${mId}`);
    if (v) {
        v.classList.remove('d-none');
        void v.offsetWidth;
        v.classList.add('active');
    }
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
}

function abrirModal(m) {
    if (m === 'productos') {
        if (dataGlobal.categorias.length === 0) { if(confirm("¡Falta Categoría!\n¿Crear una ahora?")) abrirModal('categorias'); return; }
        if (dataGlobal.proveedores.length === 0) { if(confirm("¡Falta Proveedor!\n¿Crear uno ahora?")) abrirModal('proveedores'); return; }
    }
    document.getElementById(`id-${m}`).value = '';
    const form = document.querySelector(`#modal-${m} form`);
    if(form) form.reset();
    
    if(m === 'tasas') {
        let n = new Date();
        let dd = String(n.getDate()).padStart(2, '0');
        let mm = String(n.getMonth() + 1).padStart(2, '0'); 
        let yy = n.getFullYear();
        document.getElementById('t_fecha').value = `${yy}-${mm}-${dd}`;
        document.getElementById('t_hora').value = n.toTimeString().substring(0,5);
    }
    document.getElementById(`titulo-modal-${m}`).innerText = 'Nuevo Registro';
    new bootstrap.Modal(document.getElementById(`modal-${m}`)).show();
}

function generarNEN() {
    let tipoEnvio = document.getElementById('v_env_tip').value;
    let letra = tipoEnvio === 'Local' ? 'L' : 'N';
    let now = new Date();
    let dd = String(now.getDate()).padStart(2, '0');
    let mm = String(now.getMonth() + 1).padStart(2, '0');
    let yy = String(now.getFullYear()).slice(-2);
    let consec = (dataGlobal.ventas.length + 1).toString().padStart(4, '0');
    return `NE${letra}${consec}_${dd}${mm}${yy}`;
}

window.actualizarNomenclatura = function() {
    document.getElementById('v_num_entrega').value = generarNEN();
};

window.toggleMetodoPago = function() {
    let s = document.getElementById('v_metodo_pago');
    let o = document.getElementById('v_metodo_pago_otro');
    let containerNc = document.getElementById('contenedor_nc_pago');
    
    if (s.value === 'Aplicar Nota de Crédito') {
        let cli = document.getElementById('v_cli_nom').value.trim();
        if(!cli) {
            alert("Primero debes ingresar el nombre del cliente para buscar sus Notas de Crédito.");
            s.value = '';
            return;
        }
        containerNc.classList.remove('d-none');
        o.classList.add('d-none');
        o.value = '';
        verificarNotasCreditoCliente().then(() => poblarSelectNotasCredito());
    } else if (s.value === 'Otro') {
        containerNc.classList.add('d-none');
        o.classList.remove('d-none');
        o.required = true;
    } else {
        containerNc.classList.add('d-none');
        o.classList.add('d-none');
        o.required = false;
        o.value = '';
    }
};

async function prepararVenta() {
    if (dataGlobal.productos.length === 0) {
        if(confirm("Aún no tienes productos para vender. ¿Ir al módulo a crear uno?")) { showModule('productos'); abrirModal('productos'); }
        return;
    }
         
    let r = await fetch('/api/lista_precios_data');
    let res = await r.json();
         
    if(!res.tasas.registrada_hoy) {
        alert("⚠️ IMPOSIBLE FACTURAR: No se han registrado las tasas oficiales del día de hoy.");
        showModule('parametros');
        return;
    }
         
    window.estadoSemaforo = res.tasas;
    dataGlobal.lista_precios_dinamica = res.productos;
         
    document.getElementById('v_tasa_print').innerText = res.tasas.euro_bcv.toFixed(2);
    document.getElementById('top_tasa_bin').innerText = res.tasas.binance.toFixed(2);
    document.getElementById('top_tasa_eur').innerText = res.tasas.euro_bcv.toFixed(2);
    document.getElementById('top_brecha_dia').innerText = (res.tasas.brecha * 100).toFixed(2) + '%';
         
    let el = document.getElementById('top_semaforo_txt');
    if (res.tasas.brecha > res.tasas.cobertura_activa) {
        el.innerHTML = `🚨 <span class="text-danger">MERCADO VOLTÁL (${(res.tasas.brecha*100).toFixed(2)}% / ${(res.tasas.cobertura_activa*100).toFixed(2)}%)</span>`;
        alert(`🚨 ALERTA DE MERCADO VOLTÁL: La brecha superó la cobertura activa. La facturación automática se pausa.`);
        document.getElementById('v_prod_sel').disabled = true;
    } else if (res.tasas.brecha > 0) {
        el.innerHTML = `⚠️ <span class="text-warning text-dark">PRECIO SEGURO (${(res.tasas.brecha*100).toFixed(2)}% / ${(res.tasas.cobertura_activa*100).toFixed(2)}%)</span>`;
        document.getElementById('v_prod_sel').disabled = false;
    } else {
        el.innerHTML = `🟢 <span class="text-success">PRECIO SEGURO</span>`;
        document.getElementById('v_prod_sel').disabled = false;
    }
         
    let prodsSeguros = res.productos.filter(p => p.estado_semaforo !== 'MERCADO_VOLATIL');
    let opcionesHTML = '<option value="" disabled selected>Seleccionar Producto...</option>';
    prodsSeguros.forEach(p => {
        let stockData = dataGlobal.existencias.find(e => e.id === p.id);
        let disp = stockData ? stockData.stock_disponible_venta : 0;
        if(disp > 0) {
            opcionesHTML += `<option value="${p.id}" data-max="${disp}">${p.descripcion} (Disp: ${disp} | €${p.precio_eur.toFixed(2)})</option>`;
        }
    });
    document.getElementById('v_prod_sel').innerHTML = opcionesHTML;
    await cargarDataTotal();
    document.getElementById('v_num_entrega').value = generarNEN();
    showModule('ventas');
}

function formatMoney(num, sim = '$') { return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(num).replace('USD', sim); }
function mostrarInfoModal(titulo, txt) { document.getElementById('titulo-ver-mas').innerHTML = `<i class="fa-solid fa-circle-info"></i> ${titulo}`; document.getElementById('ver_mas_texto').innerHTML = txt; new bootstrap.Modal(document.getElementById('modalVerMas')).show(); }
function mostrarImagenProducto(url) { document.getElementById('img_preview').src = url; new bootstrap.Modal(document.getElementById('modalImagen')).show(); }

window.abrirDetalleExistencia = async function(prodId) {
    let p = dataGlobal.existencias.find(e => e.id === prodId);
    if(!p) return;
    
    document.getElementById('de_descripcion').innerText = p.descripcion;
    document.getElementById('de_codigo').innerText = `CÓDIGO: ${p.codigo_barras || 'N/A'}`;
    document.getElementById('de_precio').innerText = `$${parseFloat(p.precio_usd || 0).toFixed(2)}`;
    document.getElementById('de_costo').innerText = `$${parseFloat(p.costo_unit || 0).toFixed(2)}`;
    document.getElementById('de_total').innerText = p.stock_fisico_total;
    document.getElementById('de_disp').innerText = p.stock_disponible_venta;

    let r = await fetch(`/api/stock_almacenes/${p.id}`);
    if(r.ok) {
        let almacenes = await r.json();
        let ul = document.getElementById('de_lista_almacenes');
        ul.innerHTML = '';
        almacenes.forEach(a => {
            let label = a.nombre;
            let alerta = '';
            if(a.id === 9999 || a.id === 9998) {
                alerta = ' <small class="text-danger d-block lh-1 mt-1">(No disponible para la venta)</small>';
            }
            ul.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center py-3" style="color: #000000 !important;">
                <span><span class="fw-bolder" style="color: #000000 !important;">${label}</span> ${alerta}</span>
                <span class="badge bg-secondary rounded-pill fs-6">${a.stock}</span>
            </li>`;
        });
        new bootstrap.Modal(document.getElementById('modalDetalleExistencia')).show();
    }
}


function renderTabla(m) {
    if(m === 'ventas' || m === 'parametros' || m === 'lista_precios' || m === 'reportes') return;
         
    const term = document.getElementById(`buscar-${m}`).value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let filt = (m === 'historial_ventas' ? dataGlobal.ventas : dataGlobal[m]).filter(item => Object.values(item).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term));
         
    const c = configPag[m];
    const totalPags = Math.ceil(filt.length / c.filas) || 1;
    if (c.pag > totalPags) c.pag = totalPags;
    const ini = (c.pag - 1) * c.filas;
    const fn = ini + parseInt(c.filas);
    const most = filt.slice(ini, fn);
    const tb = document.querySelector(`#tabla-${m} tbody`);
    tb.innerHTML = '';
         
    most.forEach((i, idx) => {
        let html = ''; const dly = idx * 0.05; const dataStr = encodeURIComponent(JSON.stringify(i));
        const btnAcc = `<button class="btn-action btn-edit me-1" onclick="llenarModalEditar('${m}', '${dataStr}')"><i class="fa-solid fa-pen"></i></button><button class="btn-action btn-delete" onclick="eliminarRegistro('${m}', ${i.id})"><i class="fa-solid fa-trash"></i></button>`;
                 
        if(m === 'clientes') {
            const isPendiente = i.documento === 'PENDIENTE' || i.documento === '';
            const badgeDoc = isPendiente ? `<span class="badge bg-warning text-dark"><i class="fa-solid fa-triangle-exclamation"></i> Pendiente</span>` : `<span class="fw-bold">${i.documento}</span>`;
            html = `<tr><td>${badgeDoc}</td><td class="fw-bold text-theme-solid">${i.nombre}</td><td><a href="https://wa.me/${(i.telefono||'').replace(/\D/g, '')}" target="_blank" class="text-decoration-none text-dark fw-bold"><i class="fa-brands fa-whatsapp text-success fs-5"></i> ${i.telefono||'-'}</a></td><td class="text-muted text-truncate" style="max-width: 100px;">${i.correo||'-'}</td><td class="text-muted small">${i.fecha_registro}</td><td>${btnAcc}</td></tr>`;
        }
        else if(m === 'proveedores') { html = `<tr><td class="fw-bold text-theme-solid">${i.nombre}</td><td><span class="badge bg-theme-light text-theme-solid">${i.tipo||'N/A'}</span></td><td class="text-muted fw-bold">${i.correo||'-'}</td><td class="fw-bold">${i.telefono}</td><td class="text-muted small">${i.fecha_registro}</td><td>${btnAcc}</td></tr>`; }
        else if(m === 'almacenes' || m === 'categorias') { html = `<tr><td class="fw-bold text-theme-solid">${i.nombre}</td><td class="text-muted">${i.ubicacion || i.descripcion || '-'}</td><td class="text-muted small">${i.fecha_registro}</td><td>${btnAcc}</td></tr>`; }
        else if(m === 'productos') {
            let btnFoto = i.foto ? `<button class="btn btn-sm btn-light border rounded-circle text-theme-solid" onclick="mostrarImagenProducto('${i.foto}')"><i class="fa-solid fa-camera"></i></button>` : '-';
            html = `<tr><td>${btnFoto}</td><td class="text-muted">${i.codigo_barras||'-'}</td><td class="fw-bold text-theme-solid">${i.descripcion}</td><td><span class="badge bg-theme-light text-theme-solid">${i.categoria_nombre||'N/A'}</span></td><td class="fw-bold">${i.unidad_medida}</td><td class="fw-bolder text-success" style="cursor:pointer;" title="Haz click en Editar para cambiar el Precio Objetivo">$${parseFloat(i.precio_usd||0).toFixed(2)}</td><td class="text-danger fw-bold">${i.stock_minimo}</td><td>${i.estado === 'ACTIVO' ? '<span class="badge bg-success">ACTIVO</span>' : '<span class="badge bg-danger">NO DISP.</span>'}</td><td>${btnAcc}</td></tr>`;
        }
        else if(m === 'existencias') {
            const disp = i.stock_disponible_venta;
            const alerta = disp <= i.stock_minimo ? 'text-danger fw-bolder fs-5' : 'text-success fw-bolder fs-5';
            html = `<tr>
                <td class="text-muted">${i.codigo_barras||'-'}</td>
                <td class="fw-bold text-theme-solid text-start ps-3">${i.descripcion}</td>
                <td class="fw-bold text-muted">${i.unidad_medida}</td>
                <td>${i.stock_minimo}</td>
                <td class="fw-bold text-dark bg-light">${i.stock_fisico_total}</td>
                <td class="${alerta}">${disp}</td>
                <td class="text-danger fw-bolder">${i.stock_devoluciones}</td>
                <td class="fw-bold">${formatMoney(i.costo_unit)}</td>
                <td class="fw-bold text-theme-solid">${formatMoney(i.total_costo)}</td>
                <td><button class="btn btn-sm btn-info text-white shadow-sm bounce-hover rounded-circle" onclick="abrirDetalleExistencia(${i.id})"><i class="fa-solid fa-eye"></i></button></td>
            </tr>`;
        }
        else if(m === 'kardex') {
            let tipoBadge = 'bg-secondary';
            if(['Inventario Inicial', 'Compra'].includes(i.tipo)) tipoBadge = 'bg-success';
            else if(['Venta', 'Descarga por daño/motivo', 'Devolución por compra'].includes(i.tipo)) tipoBadge = 'bg-danger';
            else if(i.tipo === 'Traspaso') tipoBadge = 'bg-primary';
            else if(i.tipo === 'Devolución por venta') tipoBadge = 'bg-info text-dark';
                         
            let txtDetalle = "";
            if (i.documento) txtDetalle += `<b>Doc/Factura:</b> ${i.documento}<br><br>`;
            if (i.motivo) txtDetalle += `<b>Motivo:</b> ${i.motivo}<br><br>`;
            if (i.almacen_origen_nombre) txtDetalle += `<b>Almacén Origen:</b> ${i.almacen_origen_nombre}<br>`;
            if (i.almacen_destino_nombre) txtDetalle += `<b>Almacén Destino:</b> ${i.almacen_destino_nombre}<br>`;
            if (txtDetalle === "") txtDetalle = "Sin detalles adicionales.";
                         
            let htmlDetalle = `<button class="btn btn-sm btn-theme rounded-pill px-3 py-1 fw-bold fs-7 shadow-sm bounce-hover" onclick="mostrarInfoModal('Detalles de Operación', '${txtDetalle.replace(/'/g, "\\'")}')">Ver más</button>`;
            html = `<tr><td class="fw-bold">${i.consecutivo}</td><td class="small text-muted fw-bold">${i.fecha_registro}</td><td><span class="badge ${tipoBadge}">${i.tipo}</span></td><td class="fw-bold text-theme-solid text-truncate" style="max-width:150px;">${i.producto_nombre}</td><td class="fw-bolder fs-6">${i.cantidad}</td><td class="fw-bold">${formatMoney(i.costo_unitario)}</td><td><span class="badge bg-light text-dark border">${i.registrado_por}</span></td><td>${htmlDetalle}</td></tr>`;
        }
        else if(m === 'historial_ventas') {
            let bC = i.estado.includes('DEVUELTO') ? 'bg-danger' : 'bg-success';
            let badgeSemaforo = `<span class="badge ${bC}">${i.estado}</span>`;
            
            // AGREGAMOS EL BOTON DE VER NOTA DE CREDITO SI FUE DEVUELTA
            let ncBtn = '';
            if(i.estado.includes('DEVUELTO')) {
                let nc = dataGlobal.notas_credito.find(n => n.consecutivo_origen === i.consecutivo);
                if(nc) {
                    // AQUÍ ESTÁ EL CAMBIO PARA HACER EL BOTÓN MÁS VISIBLE (Fondo rojo, icono de factura)
                    ncBtn = `<button class="btn-action bg-danger text-white me-1 shadow-sm" style="border:none; width: 34px; height: 34px; border-radius: 6px;" onclick="llenarYMostrarModalNC('${nc.consecutivo}')" title="Descargar Nota de Crédito"><i class="fa-solid fa-file-invoice"></i></button>`;
                }
            }
            const btnVenta = `<button class="btn-action btn-edit me-1 text-primary shadow-sm" onclick="verPreviewNota('${i.consecutivo}', ${i.id})" title="Ver PDF Factura Original"><i class="fa-solid fa-file-pdf"></i></button>${ncBtn}<button class="btn-action btn-delete text-danger shadow-sm" onclick="eliminarRegistro('ventas', ${i.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`;
            
            html = `<tr><td class="fw-bold">${i.consecutivo} ${badgeSemaforo}</td><td class="small text-muted fw-bold">${i.fecha_registro}</td><td class="fw-bold text-theme-solid">${i.cliente_nombre||'-'}</td><td class="fw-bold text-muted">${i.cliente_telefono||'-'}</td><td class="fw-bolder fs-5 text-theme-solid">€ ${parseFloat(i.total_eur).toFixed(2)}</td><td><span class="badge bg-warning text-dark fw-bold">Asociada</span></td><td>${btnVenta}</td></tr>`;
        }
        tb.innerHTML += `<tr style="animation-delay: ${dly}s">${html}</tr>`;
    });
    document.getElementById(`info-pag-${m}`).innerText = `Mostrando ${ini + (most.length>0?1:0)} a ${ini + most.length} de ${filt.length} reg.`;
}

function filtrarYPaginar(m) { configPag[m].pag = 1; renderTabla(m); }
function cambiarFilas(m) { configPag[m].filas = parseInt(document.getElementById(`filas-${m}`).value); configPag[m].pag = 1; renderTabla(m); }
function cambiarPagina(m, dir) {
    const term = document.getElementById(`buscar-${m}`).value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filt = (m === 'historial_ventas' ? dataGlobal.ventas : dataGlobal[m]).filter(item => Object.values(item).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term));
    const nPag = configPag[m].pag + dir;
    if(nPag >= 1 && nPag <= Math.ceil(filt.length / configPag[m].filas)) { configPag[m].pag = nPag; renderTabla(m); }
}

function llenarSelectores() {
    document.getElementById('prod_cat').innerHTML = dataGlobal.categorias.length > 0 ? '<option value="" disabled selected>Categoría...</option>' + dataGlobal.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('') : '<option value="" disabled selected>⚠️ Faltan Categorías</option>';
    document.getElementById('prod_prov').innerHTML = dataGlobal.proveedores.length > 0 ? '<option value="" disabled selected>Proveedor...</option>' + dataGlobal.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('') : '<option value="" disabled selected>⚠️ Faltan Proveedores</option>';
}

function llenarModalEditar(m, encodedStr) {
    const d = JSON.parse(decodeURIComponent(encodedStr));
    document.getElementById(`id-${m}`).value = d.id;
    document.getElementById(`titulo-modal-${m}`).innerText = 'Editar Registro';
         
    if(m === 'clientes') {
        document.getElementById('c_doc').value = d.documento === 'PENDIENTE' ? '' : d.documento;
        document.getElementById('c_nom').value = d.nombre; document.getElementById('c_cor').value = d.correo;
        document.getElementById('c_pais').value = d.pais; document.getElementById('c_est').value = d.estado;
        document.getElementById('c_mun').value = d.municipio; document.getElementById('c_dir_ent').value = d.direccion_entrega;
        document.getElementById('c_ref').value = d.punto_referencia; document.getElementById('c_coo').value = d.coordenadas;
        document.getElementById('c_tipo_env').value = d.tipo_envio;
        let tel = d.telefono || '';
        if(tel.startsWith('+58') || tel.startsWith('+57')) { document.getElementById('c_cod').value = tel.substring(0, 3); document.getElementById('c_tel').value = tel.substring(3); }
        else { document.getElementById('c_cod').value = "+58"; document.getElementById('c_tel').value = tel; }
    }
    else if (m === 'proveedores') { document.getElementById('p_nom').value = d.nombre; document.getElementById('p_tipo').value = d.tipo; document.getElementById('p_tel').value = d.telefono; document.getElementById('p_cor').value = d.correo; document.getElementById('p_dir').value = d.direccion; }
    else if (m === 'almacenes') { document.getElementById('a_nom').value = d.nombre; document.getElementById('a_ubi').value = d.ubicacion; }
    else if (m === 'categorias') { document.getElementById('cat_nom').value = d.nombre; document.getElementById('cat_des').value = d.descripcion; }
    else if (m === 'productos') {
        document.getElementById('prod_bar').value = d.codigo_barras; document.getElementById('prod_des').value = d.descripcion;
        document.getElementById('prod_cat').value = d.categoria_id; document.getElementById('prod_prov').value = d.proveedor_id;
        document.getElementById('prod_uni').value = d.unidad_medida; document.getElementById('prod_precio_usd').value = d.precio_usd;
        document.getElementById('prod_min').value = d.stock_minimo; document.getElementById('prod_est').value = d.estado;
        document.getElementById('prod_foto').value = d.foto;
    }
    else if (m === 'tasas') {
        document.getElementById('t_fecha').value = d.fecha; 
        document.getElementById('t_hora').value = d.hora;
        document.getElementById('t_dbcv').value = d.dolar_bcv; document.getElementById('t_ebcv').value = d.euro_bcv;
        document.getElementById('t_bin').value = d.binance; document.getElementById('t_byb').value = d.bybit;
        document.getElementById('t_dpro').value = d.dolar_promedio; document.getElementById('t_zel').value = d.zelle;
        document.getElementById('t_pay').value = d.paypal;
    }
    new bootstrap.Modal(document.getElementById(`modal-${m}`)).show();
}

async function guardarFormulario(e, m) {
    e.preventDefault();
    const id = document.getElementById(`id-${m}`).value;
    let payload = {};
         
    if(m === 'clientes') payload = { documento: document.getElementById('c_doc').value, nombre: document.getElementById('c_nom').value, telefono: document.getElementById('c_cod').value + document.getElementById('c_tel').value, correo: document.getElementById('c_cor').value, pais: document.getElementById('c_pais').value, estado: document.getElementById('c_est').value, municipio: document.getElementById('c_mun').value, direccion_entrega: document.getElementById('c_dir_ent').value, punto_referencia: document.getElementById('c_ref').value, coordenadas: document.getElementById('c_coo').value, tipo_envio: document.getElementById('c_tipo_env').value };
    else if(m === 'proveedores') payload = { nombre: document.getElementById('p_nom').value, tipo: document.getElementById('p_tipo').value, telefono: document.getElementById('p_tel').value, correo: document.getElementById('p_cor').value, direccion: document.getElementById('p_dir').value };
    else if(m === 'almacenes') payload = { nombre: document.getElementById('a_nom').value, ubicacion: document.getElementById('a_ubi').value };
    else if(m === 'categorias') payload = { nombre: document.getElementById('cat_nom').value, descripcion: document.getElementById('cat_des').value };
    else if(m === 'productos') payload = { codigo_barras: document.getElementById('prod_bar').value, descripcion: document.getElementById('prod_des').value, categoria_id: document.getElementById('prod_cat').value, proveedor_id: document.getElementById('prod_prov').value, unidad_medida: document.getElementById('prod_uni').value, precio_usd: document.getElementById('prod_precio_usd').value, stock_minimo: document.getElementById('prod_min').value, estado: document.getElementById('prod_est').value, foto: document.getElementById('prod_foto').value };
    else if(m === 'tasas') {
        let horaFormat = document.getElementById('t_hora').value;
        if(horaFormat.length === 5) horaFormat += ":00";
        payload = { fecha: document.getElementById('t_fecha').value, hora: horaFormat, dolar_bcv: document.getElementById('t_dbcv').value, binance: document.getElementById('t_bin').value, bybit: document.getElementById('t_byb').value, dolar_promedio: document.getElementById('t_dpro').value, euro_bcv: document.getElementById('t_ebcv').value, zelle: document.getElementById('t_zel').value, paypal: document.getElementById('t_pay').value };
    }
         
    let res = await fetch(id ? `/api/${m}/${id}` : `/api/${m}`, { method: id ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) { alert("Hubo un error al guardar. Revisa que llenaste todos los campos."); return; }
    bootstrap.Modal.getInstance(document.getElementById(`modal-${m}`)).hide();
    cargarDataTotal();
}

function eliminarRegistro(m, id) {
    if (m === 'tasas') {
        idTasaPendienteBorrar = id;
        new bootstrap.Modal(document.getElementById('modalConfirmarBorrarTasa')).show();
    } else {
        if(confirm(`¿Estás seguro de eliminar permanentemente este registro? (Si es una nota de entrega, se borrarán sus movimientos).`)) {
            ejecutarBorrado(m, id);
        }
    }
}

async function procesarEliminacionTasa() {
    if(idTasaPendienteBorrar) {
        await ejecutarBorrado('tasas', idTasaPendienteBorrar);
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmarBorrarTasa')).hide();
        idTasaPendienteBorrar = null;
    }
}

async function ejecutarBorrado(m, id) {
    let res = await fetch(`/api/${m}/${id}`, { method: 'DELETE' });
    if(res.ok) { 
         if(m!=='tasas') alert("Eliminado exitosamente."); 
         cargarDataTotal(); 
    }
    else { alert("Hubo un error al eliminar. Verifica si hay dependencias de base de datos."); }
}

function abrirModalMovimiento() {
    const form = document.getElementById('form-movimiento');
    if(form) form.reset();
    document.getElementById('campos_dinamicos_mov').innerHTML = '';
         
    let dispSelect = '<option value="" disabled selected>Selecciona Producto...</option>';
    dataGlobal.productos.forEach(p => {
        let sd = dataGlobal.existencias.find(e=>e.id===p.id);
        dispSelect += `<option value="${p.id}">${p.descripcion} (Total Disp Venta: ${sd ? sd.stock_disponible_venta : 0})</option>`;
    });
         
    document.getElementById('mov_prod').innerHTML = dispSelect;
    new bootstrap.Modal(document.getElementById('modalMovimiento')).show();
}

async function actualizarCamposMovimiento() {
    const prodId = document.getElementById('mov_prod').value;
    const t = document.getElementById('mov_tipo').value;
    const c = document.getElementById('campos_dinamicos_mov');
    if(!prodId || !t) return;
         
    if (dataGlobal.almacenes.length === 0) return alert("Faltan almacenes.");
         
    const res = await fetch(`/api/stock_almacenes/${prodId}`);
    stockPorAlmacenTemp = await res.json();
         
    let almOri = '<option value="" disabled selected>Descargar de...</option>' + stockPorAlmacenTemp.map(a => `<option value="${a.id}">${a.nombre} (${a.stock})</option>`).join('');
    let almDest = '<option value="" disabled selected>Cargar en...</option>' + stockPorAlmacenTemp.map(a => `<option value="${a.id}">${a.nombre} (${a.stock})</option>`).join('');
         
    let h = `<input type="number" step="0.01" id="mov_cant" class="form-control ios-input mb-3 text-center fw-bolder fs-5 text-theme-solid" placeholder="Cantidad" required>`;
    let inputPrecioUsd = `<div class="col-12"><input type="number" step="0.01" id="mov_precio_usd" class="form-control ios-input mb-3 text-center fw-bold bg-success-subtle" placeholder="Asignar / Actualizar Precio Objetivo en USD ($) (Opcional)"></div>`;
         
    if (t === 'Inventario Inicial') h += `<div class="row"><div class="col-6"><input type="number" step="0.01" id="mov_costo" class="form-control ios-input mb-3 text-center fw-bold" placeholder="Costo Adq. Unitario ($)" required></div><div class="col-6"><select id="mov_alm_dest" class="form-select ios-input mb-3 text-center fw-bold" required>${almDest}</select></div>${inputPrecioUsd}</div><input type="date" id="mov_fecha" class="form-control ios-input mb-3 text-center fw-bold text-muted" required><input type="text" id="mov_doc" class="form-control ios-input mb-4 text-center" placeholder="Doc/Factura" required>`;
    else if (t === 'Compra') h += `<div class="row"><div class="col-6"><input type="number" step="0.01" id="mov_costo" class="form-control ios-input mb-3 text-center fw-bold" placeholder="Costo Adq. Unitario ($)" required></div><div class="col-6"><select id="mov_alm_dest" class="form-select ios-input mb-3 text-center fw-bold" required>${almDest}</select></div>${inputPrecioUsd}</div><input type="text" id="mov_doc" class="form-control ios-input mb-4 text-center" placeholder="Nro. de Factura de Compra" required>`;
    else if (t === 'Descarga por daño/motivo') h += `<select id="mov_alm_ori" class="form-select ios-input mb-3 text-center fw-bold" required>${almOri}</select><textarea id="mov_motivo" class="form-control ios-input mb-4 text-center" rows="3" placeholder="Detalla el motivo de la descarga" required></textarea>`;
    else if (t === 'Traspaso') h += `<div class="row"><div class="col-6"><select id="mov_alm_ori" class="form-select ios-input mb-4 text-center fw-bold" required>${almOri}</select></div><div class="col-6"><select id="mov_alm_dest" class="form-select ios-input mb-4 text-center fw-bold" required>${almDest}</select></div></div><p class="small text-muted text-center mt-2">Permite traspasar desde el almacén de devoluciones (9999) hacia un almacén normal para liberarlos, o hacia Merma (9998).</p>`;
    else if (t === 'Devolución por compra') h += `<select id="mov_alm_ori" class="form-select ios-input mb-3 text-center fw-bold" required>${almOri}</select><input type="text" id="mov_doc" class="form-control ios-input mb-3 text-center" placeholder="Nro. Factura afectada" required><textarea id="mov_motivo" class="form-control ios-input mb-4 text-center" rows="3" placeholder="Motivo de la devolución" required></textarea>`;
         
    c.innerHTML = h;
}

async function guardarMovimiento(e) {
    e.preventDefault();
    const t = document.getElementById('mov_tipo').value;
    let p = { producto_id: document.getElementById('mov_prod').value, tipo: t, cantidad: document.getElementById('mov_cant').value };
         
    if (t === 'Inventario Inicial') { 
         p.costo_unitario = document.getElementById('mov_costo').value; 
         p.almacen_destino_id = document.getElementById('mov_alm_dest').value; 
         p.documento = document.getElementById('mov_doc').value; 
         p.fecha_registro = document.getElementById('mov_fecha').value + " 12:00:00"; 
         p.precio_usd = document.getElementById('mov_precio_usd').value;
    }
    else if (t === 'Compra') { 
         p.costo_unitario = document.getElementById('mov_costo').value; 
         p.almacen_destino_id = document.getElementById('mov_alm_dest').value; 
         p.documento = document.getElementById('mov_doc').value; 
         p.precio_usd = document.getElementById('mov_precio_usd').value;
    }
    else if (t === 'Descarga por daño/motivo') { p.almacen_origen_id = document.getElementById('mov_alm_ori').value; p.motivo = document.getElementById('mov_motivo').value; }
    else if (t === 'Traspaso') { p.almacen_origen_id = document.getElementById('mov_alm_ori').value; p.almacen_destino_id = document.getElementById('mov_alm_dest').value; }
    else if (t === 'Devolución por compra') { p.almacen_origen_id = document.getElementById('mov_alm_ori').value; p.documento = document.getElementById('mov_doc').value; p.motivo = document.getElementById('mov_motivo').value; }
         
    let res = await fetch('/api/movimientos', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(p) });
    if(!res.ok) { alert("Error al registrar movimiento."); return; }
    if(t === 'Inventario Inicial') { alert("Guardado."); document.getElementById('mov_doc').value = ''; document.getElementById('mov_cant').value = ''; cargarDataTotal(); }
    else { bootstrap.Modal.getInstance(document.getElementById('modalMovimiento')).hide(); cargarDataTotal(); }
}

function agregarAlCarrito() {
    const sel = document.getElementById('v_prod_sel');
    const prodId = sel.value;
    const cant = parseFloat(document.getElementById('v_prod_cant').value);
    let desc = 0;
    if(configSis.permitir_descuentos === 'true') { desc = parseFloat(document.getElementById('v_prod_desc').value) || 0; }
         
    if(!prodId || isNaN(cant)) return alert("Completa producto y cantidad.");
    if(window.estadoSemaforo.euro_bcv === 0) return alert("Falta la tasa oficial Euro de hoy.");
         
    let max = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-max'));
    if(cant > max) return alert(`Stock insuficiente. Solo hay ${max} disponibles para venta.`);
         
    const prod = dataGlobal.lista_precios_dinamica.find(p => p.id == prodId);
    if (!prod) return;
         
    const precioBaseEuro = prod.precio_eur;
    const precioBs = prod.precio_bs;
         
    let subTotalEur = cant * precioBaseEuro;
    let totalEur = subTotalEur * (1 - (desc / 100));
    let subTotalBs = cant * precioBs;
    let totalBs = subTotalBs * (1 - (desc / 100));
         
    carritoVentas.push({
        producto_id: prod.id, codigo: prod.codigo, descripcion: prod.descripcion, cantidad: cant,
        descuento: desc, precio_eur: precioBaseEuro, sub_eur: subTotalEur, total_eur: totalEur,
        pre_bs: precioBs, sub_bs: subTotalBs, tot_bs: totalBs
    });
         
    document.getElementById('v_prod_sel').value = '';
    document.getElementById('v_prod_cant').value = '1';
    document.getElementById('v_prod_desc').value = '0';
    renderCarrito();
}

function renderCarrito() {
    const tb = document.querySelector('#tabla-carrito tbody');
    tb.innerHTML = '';
    let gTotEur = 0; let gTotBs = 0;
    const permitDesc = configSis.permitir_descuentos === 'true';
         
    carritoVentas.forEach((i, idx) => {
        gTotEur += i.total_eur; gTotBs += i.tot_bs;
                 
        let preBsClass = window.estadoSemaforo.brecha > window.estadoSemaforo.cobertura_activa ? 'text-danger' : 'text-muted';
        let totBsClass = window.estadoSemaforo.brecha > window.estadoSemaforo.cobertura_activa ? 'text-danger fw-bolder' : 'text-theme-solid fw-bold';
                 
        tb.innerHTML += `<tr class="animate-fade-up text-center">
            <td class="fw-bold">${i.codigo || '-'}</td>
            <td class="text-start ps-3 fw-bold">${i.descripcion}</td>
            <td class="fw-bolder">${i.cantidad}</td>
            <td class="col-desc-cell text-danger fw-bold ${permitDesc?'':'d-none'}">${i.descuento}%</td>
            <td>€ ${i.precio_eur.toFixed(2)}</td>
            <td>€ ${i.sub_eur.toFixed(2)}</td>
            <td class="fw-bold text-theme-solid">€ ${i.total_eur.toFixed(2)}</td>
            <td class="${preBsClass}">Bs ${i.pre_bs.toFixed(2)}</td>
            <td class="${preBsClass}">Bs ${i.sub_bs.toFixed(2)}</td>
            <td class="${totBsClass}">Bs ${i.tot_bs.toFixed(2)}</td>
            <td><button class="btn btn-sm text-danger shadow-sm border" onclick="quitarDelCarrito(${idx})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
         
    if(carritoVentas.length > 0) { 
         tb.innerHTML += `<tr class="fw-bolder fs-6"><td colspan="${permitDesc?6:5}" class="text-end text-theme pe-4">TOTALES GLOBALES:</td><td class="text-theme-solid bg-light text-center">€ ${gTotEur.toFixed(2)}</td><td colspan="2"></td><td class="text-theme-solid bg-light text-center">Bs ${gTotBs.toFixed(2)}</td><td></td></tr>`; 
    }
         
    document.getElementById('v_total_eur').innerText = `€ ${gTotEur.toFixed(2)}`;
    document.getElementById('v_total_bs_print').innerText = `Bs ${gTotBs.toFixed(2)}`;
    aplicarLogicaDescuentos(configSis.permitir_descuentos);
}

window.quitarDelCarrito = function(idx) { carritoVentas.splice(idx, 1); renderCarrito(); };

async function procesarVenta() {
    const cli_nombre = document.getElementById('v_cli_nom').value.trim();
    if(!cli_nombre) return alert("Por favor, ingresa el Nombre o Razón Social del cliente.");
    if(carritoVentas.length === 0) return alert("¡No puedes generar una nota vacía! Agrega al menos un producto.");
         
    let selPago = document.getElementById('v_metodo_pago').value;
    let pago = selPago;
    let nc_id = null;

    if (selPago === 'Aplicar Nota de Crédito') {
        if(!ncSeleccionadaParaPago) return alert("Seleccione una Nota de Crédito válida.");
        nc_id = ncSeleccionadaParaPago.id;
        pago = `NC Aplicada / ID: #${nc_id}`;
    } else if (selPago === 'Otro') {
        pago = document.getElementById('v_metodo_pago_otro').value.trim();
        if(!pago) return alert("Por favor, especifique el método de pago alternativo.");
    }

    const payload = {
        consecutivo: document.getElementById('v_num_entrega').value,
        cliente_nombre: cli_nombre,
        cliente_doc: document.getElementById('v_cli_doc').value,
        cliente_telefono: document.getElementById('v_cli_tel').value,
        cliente_correo: document.getElementById('v_cli_cor').value,
        env_pais: document.getElementById('v_env_pais').value,
        env_estado: document.getElementById('v_env_est').value,
        env_ciudad: document.getElementById('v_env_ciu').value,
        env_direccion: document.getElementById('v_env_dir').value,
        env_referencia: document.getElementById('v_env_ref').value,
        env_coordenadas: document.getElementById('v_env_coo').value,
        env_tipo: document.getElementById('v_env_tip').value,
        total_eur: carritoVentas.reduce((acc, val) => acc + val.total_eur, 0),
        total_bs: carritoVentas.reduce((acc, val) => acc + val.tot_bs, 0),
        detalles: carritoVentas,
        tasa_bcv_euro: window.estadoSemaforo.euro_bcv,
        tasa_binance: window.estadoSemaforo.binance,
        brecha_dia: window.estadoSemaforo.brecha,
        estado_semaforo: document.getElementById('top_semaforo_txt').innerText.split(' ')[1] || 'EMITIDA',
        metodo_pago: pago || 'No especificado',
        nc_id: nc_id
    };
         
    const res = await fetch('/api/ventas', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) { alert("Hubo un error al generar la nota."); return; }
         
    const data = await res.json();
    alert(`¡Nota de Entrega Generada con éxito!\nConsecutivo: ${data.consecutivo}`);
         
    carritoVentas = [];
    renderCarrito();
    document.querySelectorAll('.input-nota').forEach(i => i.value = '');
    document.getElementById('v_env_pais').value = 'Venezuela';
    document.getElementById('v_env_tip').value = 'Nacional';
    document.getElementById('v_metodo_pago').value = '';
    document.getElementById('v_metodo_pago_otro').classList.add('d-none');
    document.getElementById('contenedor_nc_pago').classList.add('d-none');
         
    await cargarDataTotal();
    document.getElementById('v_num_entrega').value = generarNEN();
    showModule('historial_ventas');
}

// ---------------- DEVOLUCIONES Y NOTAS DE CRÉDITO ---------------- //
function abrirModalDevoluciones() {
    document.getElementById('dev_buscar_factura').value = '';
    document.getElementById('dev_contenido_nota').classList.add('d-none');
    itemsDevolucionTemporal = [];
    new bootstrap.Modal(document.getElementById('modalDevolucionesVenta')).show();
}

async function buscarNotaParaDevolucion() {
    let consec = document.getElementById('dev_buscar_factura').value;
    let venta = dataGlobal.ventas.find(v => v.consecutivo === consec);
         
    if(!venta) return alert("Factura no encontrada. Revisa el consecutivo.");
         
    document.getElementById('dev_factura_num').innerText = venta.consecutivo;
    document.getElementById('dev_factura_fecha').innerText = venta.fecha_registro;
    document.getElementById('dev_factura_cliente').innerText = venta.cliente_nombre;
         
    const res = await fetch(`/api/ventas/detalles/${venta.consecutivo}`);
    itemsDevolucionTemporal = await res.json();
         
    let tb = document.querySelector('#tabla_dev_productos tbody');
    tb.innerHTML = '';
    itemsDevolucionTemporal.forEach((i, idx) => {
        tb.innerHTML += `<tr>
            <td class="fw-bold">${i.producto_nombre}</td>
            <td>${i.cantidad}</td>
            <td class="text-muted fw-bold">0</td>
            <td>
                <input type="number" class="form-control text-center mx-auto" style="max-width:80px;" min="0" max="${i.cantidad}" value="0" id="dev_cant_${idx}">
            </td>
        </tr>`;
    });
         
    document.getElementById('dev_contenido_nota').classList.remove('d-none');
}

async function procesarDevolucionDefinitiva() {
    let motivo = document.getElementById('dev_motivo').value.trim();
    if(!motivo) return alert("Debe especificar el motivo de la devolución.");
         
    let total_eur = 0; let total_bs = 0;
    let detalles_dev = [];
         
    itemsDevolucionTemporal.forEach((i, idx) => {
        let cant_dev = parseFloat(document.getElementById(`dev_cant_${idx}`).value) || 0;
        if(cant_dev > 0) {
            total_eur += cant_dev * i.precio_unitario_euro_snapshot;
            total_bs += cant_dev * i.precio_unitario_bs_snapshot;
            detalles_dev.push({ producto_id: i.producto_id, cantidad_devolver: cant_dev, precio_eur: i.precio_unitario_euro_snapshot, precio_bs: i.precio_unitario_bs_snapshot });
        }
    });
         
    if(detalles_dev.length === 0) return alert("Debe seleccionar al menos un producto a devolver.");
         
    let payload = {
        consecutivo_origen: document.getElementById('dev_factura_num').innerText,
        cliente_nombre: document.getElementById('dev_factura_cliente').innerText,
        motivo: motivo,
        total_eur: total_eur,
        total_bs: total_bs,
        detalles: detalles_dev
    };
         
    let res = await fetch('/api/devoluciones', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(res.ok) {
        let d = await res.json();
        alert(`¡Devolución exitosa!\nSe generó la Nota de Crédito: ${d.consecutivo}`);
        bootstrap.Modal.getInstance(document.getElementById('modalDevolucionesVenta')).hide();
        await cargarDataTotal();
        llenarYMostrarModalNC(d.consecutivo);
    } else {
        alert("Error procesando devolución.");
    }
}

window.verPreviewNota = async function(consecutivo, id) {
    let venta = dataGlobal.ventas.find(v => v.id === id);
    if(!venta) return;
    document.getElementById('pdf_empresa').innerText = document.getElementById('brand-name').innerText;
    document.getElementById('pdf_consecutivo').innerText = venta.consecutivo;
    document.getElementById('pdf_tasa_eur').innerText = venta.tasa_bcv_euro_aplicada ? venta.tasa_bcv_euro_aplicada.toFixed(2) : '0.00';
    document.getElementById('pdf_fecha').innerText = venta.fecha_registro.split(' ')[0];
    document.getElementById('pdf_hora').innerText = venta.fecha_registro.split(' ')[1] || '';
    document.getElementById('pdf_cli_nom').innerText = venta.cliente_nombre;
    document.getElementById('pdf_cli_tel').innerText = venta.cliente_telefono;
    document.getElementById('pdf_cli_doc').innerText = venta.cliente_doc || '-';
    document.getElementById('pdf_env_dir').innerText = venta.direccion_entrega;
    document.getElementById('pdf_tot_eur').innerText = `€ ${parseFloat(venta.total_eur).toFixed(2)}`;
    document.getElementById('pdf_tot_bs').innerText = `Bs ${parseFloat(venta.total_bs||0).toFixed(2)}`;
    document.getElementById('pdf_metodo_pago').innerText = venta.metodo_pago || 'No especificado';
    
    let tb = document.getElementById('pdf_tabla_body');
    tb.innerHTML = '';
    let res = await fetch(`/api/ventas/detalles/${consecutivo}`);
    if(res.ok) {
        let items = await res.json();
        items.forEach(it => {
            tb.innerHTML += `<tr>
                <td style="padding:5px; border-bottom:1px solid #000;">${it.codigo||'-'}</td>
                <td style="padding:5px; border-bottom:1px solid #000;">${it.producto_nombre}</td>
                <td style="padding:5px; text-align:center; border-bottom:1px solid #000;">${it.cantidad}</td>
                <td style="padding:5px; text-align:center; border-bottom:1px solid #000;">${it.descuento||0}%</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${parseFloat(it.precio_unitario_euro_snapshot).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${parseFloat(it.subtotal_euro_snapshot).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${parseFloat(it.total_euro_snapshot).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${parseFloat(it.precio_unitario_bs_snapshot).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${parseFloat(it.subtotal_bs_snapshot).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${parseFloat(it.total_bs_snapshot).toFixed(2)}</td>
            </tr>`;
        });
    }
    new bootstrap.Modal(document.getElementById('modalPreviewNota')).show();
};

window.descargarPDFNota = function() {
    const element = document.getElementById('contenido-pdf-nota');
    const filename = `Nota_Entrega_${document.getElementById('pdf_consecutivo').innerText}.pdf`;
    var opt = { margin: 0.5, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' } };
    html2pdf().set(opt).from(element).save();
};

// AQUÍ ESTÁ EL CAMBIO PARA QUE SE VEA A QUÉ FACTURA AFECTA LA NOTA DE CRÉDITO
window.llenarYMostrarModalNC = async function(consecutivoNc) {
    let nc = dataGlobal.notas_credito.find(n => n.consecutivo === consecutivoNc);
    if(!nc) return alert("Nota de crédito no encontrada.");

    let venta = dataGlobal.ventas.find(v => v.consecutivo === nc.consecutivo_origen);
    let cli = dataGlobal.clientes.find(c => c.nombre === nc.cliente_nombre);

    document.getElementById('nc_pdf_empresa').innerText = document.getElementById('brand-name').innerText;
    document.getElementById('nc_pdf_consecutivo').innerText = nc.consecutivo;
    
    // SE AGREGA AL PDF LA REFERENCIA DE LA FACTURA ORIGEN
    document.getElementById('nc_pdf_origen').innerText = nc.consecutivo_origen;

    document.getElementById('nc_pdf_tasa').innerText = venta && venta.tasa_bcv_euro_aplicada ? venta.tasa_bcv_euro_aplicada.toFixed(2) : '0.00';
    document.getElementById('nc_pdf_fecha').innerText = nc.fecha_registro.split(' ')[0];
    document.getElementById('nc_pdf_hora').innerText = nc.fecha_registro.split(' ')[1] || '';

    document.getElementById('nc_pdf_cli_nom').innerText = nc.cliente_nombre;
    document.getElementById('nc_pdf_cli_doc').innerText = cli ? (cli.documento==='PENDIENTE'?'-':cli.documento) : '-';
    document.getElementById('nc_pdf_cli_tel').innerText = cli ? cli.telefono : (venta ? venta.cliente_telefono : '-');
    document.getElementById('nc_pdf_cli_cor').innerText = cli ? cli.correo : '-';

    document.getElementById('nc_pdf_env_pais').innerText = cli ? cli.pais : '-';
    document.getElementById('nc_pdf_env_est').innerText = cli ? cli.estado : '-';
    document.getElementById('nc_pdf_env_dir').innerText = cli ? cli.direccion_entrega : (venta ? venta.direccion_entrega : '-');
    document.getElementById('nc_pdf_env_ref').innerText = cli ? cli.punto_referencia : '-';
    document.getElementById('nc_pdf_env_coo').innerText = cli ? cli.coordenadas : '-';
    document.getElementById('nc_pdf_env_tip').innerText = cli ? cli.tipo_envio : '-';

    document.getElementById('nc_pdf_metodo_pago').innerText = venta ? venta.metodo_pago : '-';
    document.getElementById('nc_pdf_motivo').innerText = nc.motivo;
    document.getElementById('nc_pdf_tot_eur').innerText = `€ ${parseFloat(nc.total_eur).toFixed(2)}`;
    document.getElementById('nc_pdf_tot_bs').innerText = `Bs ${parseFloat(nc.total_bs).toFixed(2)}`;

    let tbody = document.getElementById('nc_pdf_tabla_body');
    tbody.innerHTML = '';

    // Extraemos detalles de la venta original para cruzar la información del descuento exacto en la NC
    let rOrig = await fetch(`/api/ventas/detalles/${nc.consecutivo_origen}`);
    let origItems = rOrig.ok ? await rOrig.json() : [];

    let rDet = await fetch(`/api/notas_credito/detalles/${nc.consecutivo}`);
    if(rDet.ok) {
        let items = await rDet.json();
        items.forEach(it => {
            let oItem = origItems.find(x => x.producto_id === it.producto_id) || {};
            let desc = oItem.descuento || 0;
            let sub_eur = it.cantidad * it.precio_eur;
            let tot_eur = it.subtotal_eur;
            let sub_bs = it.cantidad * it.precio_bs;
            let tot_bs = it.subtotal_bs;

            tbody.innerHTML += `<tr>
                <td style="padding:5px; border-bottom:1px solid #000;">${it.codigo || '-'}</td>
                <td style="padding:5px; border-bottom:1px solid #000;">${it.producto_nombre}</td>
                <td style="padding:5px; text-align:center; border-bottom:1px solid #000;">${it.cantidad}</td>
                <td style="padding:5px; text-align:center; border-bottom:1px solid #000;">${desc}%</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${parseFloat(it.precio_eur).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${sub_eur.toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">€ ${tot_eur.toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${parseFloat(it.precio_bs).toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${sub_bs.toFixed(2)}</td>
                <td style="padding:5px; text-align:right; border-bottom:1px solid #000;">Bs ${tot_bs.toFixed(2)}</td>
            </tr>`;
        });
    }
    new bootstrap.Modal(document.getElementById('modalPreviewNC')).show();
}

window.descargarPDFNC = function() {
    const element = document.getElementById('contenido-pdf-nc');
    const filename = `Nota_Credito_${document.getElementById('nc_pdf_consecutivo').innerText}.pdf`;
    var opt = { margin: 0.5, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' } };
    html2pdf().set(opt).from(element).save();
}

// ---------------- REPORTES EXCEL Y VISTA PREVIA ---------------- //
window.configurarFiltrosReporte = function() {
    let t = document.getElementById('rep_tipo').value;
    if(t === 'kardex') document.getElementById('col_rep_mov').style.display = 'block';
    else document.getElementById('col_rep_mov').style.display = 'none';
}

window.generarVistaPreviaReporte = function() {
    let tipo = document.getElementById('rep_tipo').value;
    let desde = new Date(document.getElementById('rep_desde').value + "T00:00:00");
    let hasta = new Date(document.getElementById('rep_hasta').value + "T23:59:59");
         
    if(isNaN(desde) || isNaN(hasta)) return alert("Selecciona fechas válidas para el reporte.");
         
    let th = document.querySelector('#tabla-reporte-dinamica thead');
    let tb = document.querySelector('#tabla-reporte-dinamica tbody');
    th.innerHTML = ''; tb.innerHTML = '';
         
    document.getElementById('rep_resultados_card').classList.remove('d-none');
    document.getElementById('rep_titulo_tabla').innerText = `Reporte de ${tipo.toUpperCase().replace('_', ' ')}`;
         
    if(tipo === 'ventas') {
        th.innerHTML = `<tr><th>Fecha / Hora</th><th>Nº Factura</th><th>Cliente</th><th>Monto EUR</th><th>Monto BS</th><th>Método de Pago</th><th>Usuario</th></tr>`;
        let filtrado = dataGlobal.ventas.filter(v => { let d = new Date(v.fecha_registro); return d >= desde && d <= hasta; });
        filtrado.forEach(v => {
            tb.innerHTML += `<tr><td>${v.fecha_registro}</td><td class="fw-bold">${v.consecutivo}</td><td>${v.cliente_nombre}</td><td>€ ${parseFloat(v.total_eur).toFixed(2)}</td><td>Bs ${parseFloat(v.total_bs || 0).toFixed(2)}</td><td>${v.metodo_pago||'-'}</td><td>${v.registrado_por}</td></tr>`;
        });
    }
    else if(tipo === 'devoluciones_venta') {
        th.innerHTML = `<tr><th>Fecha</th><th>Consecutivo</th><th>Movimiento</th><th>Producto</th><th>Cant. Devuelta</th><th>Doc. Afectado</th><th>Resp.</th></tr>`;
        let filtrado = dataGlobal.kardex.filter(k => { let d = new Date(k.fecha_registro); return d >= desde && d <= hasta && k.tipo === 'Devolución por venta'; });
        filtrado.forEach(k => { tb.innerHTML += `<tr><td>${k.fecha_registro}</td><td class="fw-bold">${k.consecutivo}</td><td>${k.tipo}</td><td>${k.producto_nombre}</td><td>${k.cantidad}</td><td>${k.documento}</td><td>${k.registrado_por}</td></tr>`; });
    }
    else if(tipo === 'devoluciones_compra') {
        th.innerHTML = `<tr><th>Fecha</th><th>Consecutivo</th><th>Movimiento</th><th>Producto</th><th>Cant. Devuelta</th><th>Doc. Afectado</th><th>Resp.</th></tr>`;
        let filtrado = dataGlobal.kardex.filter(k => { let d = new Date(k.fecha_registro); return d >= desde && d <= hasta && k.tipo === 'Devolución por compra'; });
        filtrado.forEach(k => { tb.innerHTML += `<tr><td>${k.fecha_registro}</td><td class="fw-bold">${k.consecutivo}</td><td>${k.tipo}</td><td>${k.producto_nombre}</td><td>${k.cantidad}</td><td>${k.documento}</td><td>${k.registrado_por}</td></tr>`; });
    }
    else if(tipo === 'notas_credito') {
        th.innerHTML = `<tr><th>Fecha</th><th>Nota de Crédito</th><th>Factura Origen</th><th>Cliente</th><th>Motivo</th><th>Estado</th><th>Monto EUR</th></tr>`;
        let filtrado = dataGlobal.notas_credito.filter(n => { let d = new Date(n.fecha_registro); return d >= desde && d <= hasta; });
        filtrado.forEach(n => { tb.innerHTML += `<tr><td>${n.fecha_registro}</td><td class="fw-bold">${n.consecutivo}</td><td>${n.consecutivo_origen}</td><td>${n.cliente_nombre}</td><td>${n.motivo}</td><td>${n.estado}</td><td>€ ${parseFloat(n.total_eur).toFixed(2)}</td></tr>`; });
    }
    else if(tipo === 'clientes') {
        th.innerHTML = `<tr><th>Registro</th><th>Documento</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Ubicación</th></tr>`;
        dataGlobal.clientes.forEach(c => { tb.innerHTML += `<tr><td>${c.fecha_registro}</td><td class="fw-bold">${c.documento}</td><td>${c.nombre}</td><td>${c.telefono}</td><td>${c.correo}</td><td>${c.estado}, ${c.municipio}</td></tr>`; });
    }
    else if(tipo === 'proveedores') {
        th.innerHTML = `<tr><th>Registro</th><th>Nombre</th><th>Tipo</th><th>Teléfono</th><th>Correo</th><th>Dirección</th></tr>`;
        dataGlobal.proveedores.forEach(p => { tb.innerHTML += `<tr><td>${p.fecha_registro}</td><td class="fw-bold">${p.nombre}</td><td>${p.tipo}</td><td>${p.telefono}</td><td>${p.correo}</td><td>${p.direccion}</td></tr>`; });
    }
    else if(tipo === 'productos') {
        th.innerHTML = `<tr><th>Código</th><th>Descripción</th><th>Unidad</th><th>Stock Mínimo</th><th>Precio USD</th><th>Estado</th></tr>`;
        dataGlobal.productos.forEach(p => { tb.innerHTML += `<tr><td class="fw-bold">${p.codigo_barras||'-'}</td><td>${p.descripcion}</td><td>${p.unidad_medida}</td><td>${p.stock_minimo}</td><td>$${parseFloat(p.precio_usd).toFixed(2)}</td><td>${p.estado}</td></tr>`; });
    }
    else if(tipo === 'kardex') {
        th.innerHTML = `<tr><th>Fecha / Hora</th><th>Consec.</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Origen</th><th>Destino</th><th>Resp.</th></tr>`;
        let tipoMov = document.getElementById('rep_mov_tipo').value;
        let filtrado = dataGlobal.kardex.filter(k => { 
             let d = new Date(k.fecha_registro); 
             return d >= desde && d <= hasta && (tipoMov === 'TODOS' || k.tipo === tipoMov); 
        });
        filtrado.forEach(k => {
            tb.innerHTML += `<tr><td>${k.fecha_registro}</td><td class="fw-bold">${k.consecutivo}</td><td>${k.tipo}</td><td class="text-truncate" style="max-width:100px;">${k.producto_nombre}</td><td>${k.cantidad}</td><td>${k.almacen_origen_nombre||'-'}</td><td>${k.almacen_destino_nombre||'-'}</td><td>${k.registrado_por}</td></tr>`;
        });
    }
    else if(tipo === 'lista_precios') {
        th.innerHTML = `<tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Precio Obj USD</th><th>Precio Euro</th><th>Precio BS (Día)</th></tr>`;
        dataGlobal.lista_precios_dinamica.forEach(p => {
            tb.innerHTML += `<tr><td>${p.codigo||'-'}</td><td>${p.descripcion}</td><td>${p.categoria}</td><td>$${p.precio_usd.toFixed(2)}</td><td>€ ${p.precio_eur.toFixed(2)}</td><td>Bs ${p.precio_bs.toFixed(2)}</td></tr>`;
        });
    }
    else if(tipo === 'existencias') {
        th.innerHTML = `<tr><th>Código</th><th>Producto</th><th>Total Físico</th><th>Disp. para Venta</th><th>Costo Unit.</th><th>Total Invertido</th></tr>`;
        dataGlobal.existencias.forEach(e => {
            tb.innerHTML += `<tr><td>${e.codigo_barras||'-'}</td><td>${e.descripcion}</td><td>${e.stock_fisico_total}</td><td>${e.stock_disponible_venta}</td><td>$${parseFloat(e.costo_unit).toFixed(2)}</td><td>$${parseFloat(e.total_costo).toFixed(2)}</td></tr>`;
        });
    }
    else if(tipo === 'tasas') {
        th.innerHTML = `<tr><th>Fecha</th><th>Hora</th><th>Dólar BCV</th><th>Euro BCV</th><th>Binance</th><th>Brecha</th></tr>`;
        let filtrado = dataGlobal.tasas.filter(t => { let d = new Date(t.fecha+"T00:00:00"); return d >= desde && d <= hasta; });
        filtrado.forEach(t => { tb.innerHTML += `<tr><td>${t.fecha}</td><td>${t.hora}</td><td>${t.dolar_bcv}</td><td>${t.euro_bcv}</td><td>${t.binance}</td><td>${(t.brecha*100).toFixed(2)}%</td></tr>`; });
    }
    else if(tipo === 'coberturas') {
        th.innerHTML = `<tr><th>Fecha de Registro</th><th>Pico Máximo</th><th>% Cobertura</th><th>Factor</th><th>Estado</th></tr>`;
        dataGlobal.coberturas.forEach(c => { tb.innerHTML += `<tr><td>${c.fecha_registro}</td><td>${c.fecha_pico_maximo}</td><td>${(c.porcentaje_cobertura*100).toFixed(2)}%</td><td>${c.factor_proteccion}</td><td>${c.estado}</td></tr>`; });
    }
}

window.exportarReporte = function(formato) {
    let tipo = document.getElementById('rep_tipo').value;
    let filename = `Reporte_${tipo}_${new Date().toLocaleDateString()}.` + (formato==='excel'?'xlsx':'pdf');
         
    if(formato === 'excel') {
        let table = document.getElementById("tabla-reporte-dinamica");
        let wb = XLSX.utils.table_to_book(table, {sheet: "Reporte"});
        
        let ws = wb.Sheets["Reporte"];
        const range = XLSX.utils.decode_range(ws['!ref']);
        const wscols = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let max_width = 12; 
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
                if (!cell || !cell.v) continue;
                const len = cell.v.toString().length;
                if (len > max_width) max_width = len;
            }
            wscols.push({wch: max_width + 2});
        }
        ws['!cols'] = wscols;
        
        XLSX.writeFile(wb, filename);
    } 
    else if(formato === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(document.getElementById('rep_titulo_tabla').innerText, 14, 15);
        doc.autoTable({ html: '#tabla-reporte-dinamica', startY: 20 });
        doc.save(filename);
    }
}

// ---------------- RESTO DEL CÓDIGO (Consulta Histórica) ---------------- //
window.buscarListaPreciosHistorica = async function() {
    let fecha = document.getElementById('busqueda_fecha_lista').value;
    if(!fecha) return alert("Selecciona una fecha.");
         
    try {
        let res = await fetch(`/api/historico_precios/${fecha}`);
        if(!res.ok) return alert(`No hay registro de precios guardado en el sistema para la fecha ${fecha}.`);
        let data = await res.json();
                 
        document.getElementById('lp_factor').innerText = (1 + data.tasas.cobertura_activa).toFixed(2);
        document.getElementById('lp_euro').innerText = "€ " + data.tasas.euro_bcv.toFixed(2);
                 
        let tb = document.querySelector('#tabla-lista_precios_dinamica tbody');
        tb.innerHTML = '';
        data.productos.forEach((p, idx) => {
            tb.innerHTML += `<tr>
                <td class="text-muted fw-bold">${p.codigo||'-'}</td>
                <td><span class="badge bg-theme-light text-theme-solid">${p.categoria}</span></td>
                <td class="fw-bold text-start">${p.descripcion}</td>
                <td class="text-muted fw-bold">${p.unidad_medida}</td>
                <td class="fw-bold text-success">$${p.precio_usd.toFixed(2)}</td>
                <td class="fw-bolder">€ ${p.precio_eur.toFixed(2)}</td>
                <td class="fw-bold text-dark">Bs ${p.precio_bs.toFixed(2)}</td>
                <td><span class="badge bg-secondary">HISTÓRICO ${fecha}</span></td>
            </tr>`;
        });
    } catch(e) {
        alert("Error de conexión al buscar.");
    }
}

window.onload = () => { inicializarUI(); cargarConfiguracion(); cargarTasasYConfig(); cargarDataTotal(); };