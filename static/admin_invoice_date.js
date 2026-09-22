/* ZUARA APP · Fecha personalizada de facturación para administradores.
   La tasa siempre se obtiene del día del sistema desde el backend.
   Los usuarios normales no pueden alterar la fecha de facturación.
*/
(function () {
    'use strict';

    function fechaHoyLocal() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    }

    function asegurarSelectorFecha() {
        const modulo = document.getElementById('modulo-ventas');
        if (!modulo || document.getElementById('v_fecha_facturacion_wrap')) return;

        const admin = typeof esAdministrador === 'function' && esAdministrador();
        const encabezado = modulo.querySelector('.nota-entrega-header');
        if (!encabezado) return;

        const wrap = document.createElement('div');
        wrap.id = 'v_fecha_facturacion_wrap';
        wrap.className = 'mb-3 mb-md-0';
        wrap.innerHTML = admin
            ? '<span class="fw-bold text-muted text-uppercase small letter-spacing">Fecha a facturar</span>' +
              '<input type="date" id="v_fecha_facturacion" class="form-control fw-bolder text-theme-solid mt-1" required>' +
              '<small class="text-muted d-block mt-1"><i class="fa-solid fa-shield-halved me-1"></i>Fecha editable por administrador. La tasa sigue siendo la del día del sistema.</small>'
            : '<input type="hidden" id="v_fecha_facturacion">';

        encabezado.insertBefore(wrap, encabezado.firstElementChild);
        const campo = document.getElementById('v_fecha_facturacion');
        if (campo) {
            campo.value = fechaHoyLocal();
            campo.addEventListener('change', function () {
                if (typeof actualizarNomenclatura === 'function') actualizarNomenclatura();
            });
        }
    }

    const generarNENOriginal = window.generarNEN;
    window.generarNEN = function () {
        const campo = document.getElementById('v_fecha_facturacion');
        const fecha = campo && campo.value ? campo.value : fechaHoyLocal();
        const tipoEnvio = document.getElementById('v_env_tip')?.value || 'Nacional';
        const letra = tipoEnvio === 'Local' ? 'L' : 'N';
        const [yy, mm, dd] = fecha.split('-');
        const consec = (dataGlobal.ventas.length + 1).toString().padStart(4, '0');
        return `NE${letra}${consec}_${dd}${mm}${String(yy).slice(-2)}`;
    };

    const prepararVentaOriginal = window.prepararVenta;
    window.prepararVenta = async function () {
        const resultado = await prepararVentaOriginal.apply(this, arguments);
        asegurarSelectorFecha();
        const campo = document.getElementById('v_fecha_facturacion');
        if (campo) {
            campo.value = fechaHoyLocal();
            if (typeof actualizarNomenclatura === 'function') actualizarNomenclatura();
        }
        return resultado;
    };

    const procesarVentaOriginal = window.procesarVenta;
    window.procesarVenta = async function () {
        if (!document.getElementById('v_fecha_facturacion')) asegurarSelectorFecha();
        const campo = document.getElementById('v_fecha_facturacion');
        if (typeof esAdministrador === 'function' && esAdministrador()) {
            if (!campo?.value) return alert('Selecciona la fecha a facturar.');
        } else if (campo) {
            campo.value = fechaHoyLocal();
        }
        return procesarVentaOriginal.apply(this, arguments);
    };

    function refrescarCuandoAbreVentas() {
        if (document.getElementById('modulo-ventas') && !document.getElementById('modulo-ventas').classList.contains('d-none')) {
            asegurarSelectorFecha();
        }
    }

    const showModuleOriginal = window.showModule;
    window.showModule = function () {
        const r = showModuleOriginal.apply(this, arguments);
        if (arguments[0] === 'ventas') setTimeout(refrescarCuandoAbreVentas, 0);
        return r;
    };

    window.addEventListener('load', () => setTimeout(refrescarCuandoAbreVentas, 0));
})();
