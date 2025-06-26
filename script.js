// script.js (Código COMPLETO y ACTUALIZADO)

document.addEventListener('DOMContentLoaded', () => {
    // MODIFICADO: Lógica para resaltar el elemento activo del menú
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const currentPathname = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href').split('/').pop();
        if (linkHref === currentPathname) {
            link.closest('.nav-item').classList.add('active');
        } else if (currentPathname === '' && linkHref === 'index.html') {
            link.closest('.nav-item').classList.add('active');
        }
    });

    // === Lógica general de formularios (reutilizada y unificada) ===

    const comentariosTextarea = document.getElementById('comentarios');
    const charCounter = document.querySelector('.char-counter');
    if (comentariosTextarea && charCounter) {
        const maxChars = comentariosTextarea.getAttribute('maxlength');
        comentariosTextarea.addEventListener('input', () => {
            const currentLength = comentariosTextarea.value.length;
            charCounter.textContent = `${currentLength} caracter(es) ingresado(s) - ${maxChars} caracteres permitidos en los comentarios`;
        });
        comentariosTextarea.dispatchEvent(new Event('input'));
    }

    const documentoPrincipalToggle = document.getElementById('documentoPrincipalToggle');
    const documentoPrincipalUpload = document.getElementById('documentoPrincipalUpload');
    if (documentoPrincipalToggle && documentoPrincipalUpload) {
        if (!documentoPrincipalToggle.checked) {
            documentoPrincipalUpload.style.display = 'block';
        }
        documentoPrincipalToggle.addEventListener('change', () => {
            documentoPrincipalUpload.style.display = documentoPrincipalToggle.checked ? 'none' : 'block';
        });
    }

    const btnSelectArchivoPrincipal = document.getElementById('btnSelectArchivoPrincipal');
    const selectArchivoPrincipal = document.getElementById('selectArchivoPrincipal');
    const fileNamePrincipal = document.getElementById('fileNamePrincipal');
    if (btnSelectArchivoPrincipal && selectArchivoPrincipal && fileNamePrincipal) {
        btnSelectArchivoPrincipal.addEventListener('click', () => {
            selectArchivoPrincipal.click();
        });
        selectArchivoPrincipal.addEventListener('change', () => {
            fileNamePrincipal.textContent = selectArchivoPrincipal.files.length > 0 ? `Archivo seleccionado: ${selectArchivoPrincipal.files[0].name}` : '';
        });
    }

    const agregarAnexoToggle = document.getElementById('agregarAnexoToggle');
    const anexosUpload = document.getElementById('anexosUpload');
    if (agregarAnexoToggle && anexosUpload) {
        if (!agregarAnexoToggle.checked) {
            anexosUpload.style.display = 'none';
        }
        agregarAnexoToggle.addEventListener('change', () => {
            anexosUpload.style.display = agregarAnexoToggle.checked ? 'block' : 'none';
        });
    }

    const sinNumeroCheckbox = document.getElementById('sinNumero');
    const numeroDocumentoInput = document.getElementById('numeroDocumento');
    if (sinNumeroCheckbox && numeroDocumentoInput) {
        sinNumeroCheckbox.addEventListener('change', () => {
            if (sinNumeroCheckbox.checked) {
                numeroDocumentoInput.value = '';
                numeroDocumentoInput.readOnly = true;
                numeroDocumentoInput.removeAttribute('required');
            } else {
                numeroDocumentoInput.readOnly = false;
                numeroDocumentoInput.setAttribute('required', 'required');
            }
        });
    }

    const nuevoTramiteForm = document.getElementById('nuevoTramiteForm');
    if (nuevoTramiteForm) {
        nuevoTramiteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(nuevoTramiteForm);
            try {
                const response = await fetch('http://127.0.0.1:5000/api/tramites/nuevo', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    alert(`Trámite registrado con éxito. Su número de expediente es: ${result.numero_expediente}`);
                    nuevoTramiteForm.reset();
                } else {
                    alert(`Error al registrar trámite: ${result.message || 'Error desconocido'}`);
                }
            } catch (error) {
                console.error('Error al conectar con el servidor:', error);
                alert('No se pudo conectar con el servidor o hubo un problema al procesar la respuesta. Intente de nuevo más tarde.');
            }
        });
    }

    const btnBuscarExpediente = document.getElementById('btnBuscarExpediente');
    const numeroExpedienteInputReingresar = document.getElementById('numeroExpediente');
    const asuntoPrincipalTextarea = document.getElementById('asuntoPrincipal');
    const reingresarTramiteForm = document.getElementById('reingresarTramiteForm');

    if (btnBuscarExpediente && numeroExpedienteInputReingresar && asuntoPrincipalTextarea) {
        btnBuscarExpediente.addEventListener('click', async () => {
            const numeroExpediente = numeroExpedienteInputReingresar.value.trim();
            if (!numeroExpediente) {
                alert('Por favor, ingrese un número de expediente para buscar.');
                return;
            }

            try {
                const encodedExpediente = encodeURIComponent(numeroExpediente);
                const response = await fetch(`http://127.0.0.1:5000/api/tramites/buscar/${encodedExpediente}`);
                const result = await response.json();

                if (response.ok) {
                    asuntoPrincipalTextarea.value = result.asuntoPrincipal;
                    alert(result.message);
                } else {
                    asuntoPrincipalTextarea.value = '';
                    alert(result.message || 'Expediente no encontrado.');
                }
            } catch (error) {
                console.error('Error al conectar con el servidor de búsqueda:', error);
                alert('Ocurrió un error al buscar el expediente. Verifique la conexión con el servidor.');
            }
        });
    }

    const verEjemploLinks = document.querySelectorAll('[id^="verEjemploLink"]');
    verEjemploLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('id').replace('Link', '');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                if (targetId === 'numeroExpediente') {
                    targetInput.value = 'MPD/2025-ABCDE12';
                } else if (targetId === 'numeroExpedienteBusqueda') {
                    targetInput.value = 'MPD/2025-EXT-0602964';
                }
                alert('Se ha pre-llenado el campo con un número de ejemplo.');
            }
        });
    });

    const reingresarForm = document.getElementById('reingresarTramiteForm');
    if (reingresarForm) {
        reingresarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reingresarForm);
            if (!document.getElementById('leidoTerminos').checked || !document.getElementById('declaracionJurada').checked) {
                alert('Debe aceptar los términos y condiciones y la declaración jurada.');
                return;
            }
            try {
                const response = await fetch('http://127.0.0.1:5000/api/tramites/reingresar', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    alert(`Documento reingresado con éxito para el expediente: ${result.numero_expediente}`);
                    reingresarTramiteForm.reset();
                } else {
                    alert(`Error al reingresar el documento: ${result.message || 'Error desconocido'}`);
                }
            } catch (error) {
                console.error('Error al conectar con el servidor de reingreso:', error);
                alert('No se pudo conectar con el servidor. Intente de nuevo más tarde.');
            }
        });
    }

    // MODIFICADO: Lógica para la sección de búsqueda de Seguimiento de Trámite
    const btnBuscarSeguimiento = document.querySelector('.seguimiento-form .btn-primary');
    const btnMostrarTodos = document.querySelector('.seguimiento-form .btn-secondary');
    const searchResultsSection = document.getElementById('searchResults');
    const numeroExpedienteBusquedaInput = document.getElementById('numeroExpedienteBusqueda');
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');
    const entidadSelect = document.getElementById('seleccionarEntidadBusqueda');
    const tercerosCheckbox = document.getElementById('expedientesTerceros');

    // NUEVO: Lógica para hacer clic en el ícono del calendario
    const calendarIcons = document.querySelectorAll('.calendar-icon');
    calendarIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            if (input) {
                input.focus();
            }
        });
    });

    // MODIFICADO: Función para renderizar los resultados en HTML
    function renderResults(tramites) {
        const resultsContent = document.getElementById('results-content');
        resultsContent.innerHTML = '';

        if (tramites.length === 0) {
            resultsContent.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">No se encontraron resultados para los criterios de búsqueda.</p>';
            searchResultsSection.style.display = 'block';
            return;
        }

        tramites.forEach(tramite => {
            const fechaIngreso = new Date(tramite.fecha_creacion).toLocaleString('es-LA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');
            
            const card = document.createElement('div');
            card.classList.add('result-card');
            card.innerHTML = `
                <p class="result-expediente">No. de Expediente: ${tramite.numero_expediente}</p>
                <p class="result-ingreso">Ingreso: ${fechaIngreso}</p>
                <p class="result-asunto">Asunto: ${tramite.asunto}</p>
                <div class="result-actions">
                    <a href="#" class="result-action-link" data-action="adjuntos" data-expediente="${tramite.numero_expediente}">Adjuntos</a>
                    <span class="action-separator">|</span>
                    <a href="#" class="result-action-link" data-action="detalle" data-expediente="${tramite.numero_expediente}">Detalle</a>
                    <span class="action-separator">|</span>
                    <a href="#" class="result-action-link" data-action="reingresar" data-expediente="${tramite.numero_expediente}">Reingresar</a>
                    <span class="action-separator">|</span>
                    <a href="#" class="result-action-link" data-action="constancia" data-expediente="${tramite.numero_expediente}">Constancia</a>
                </div>
            `;
            resultsContent.appendChild(card);
        });

        searchResultsSection.style.display = 'block';
    }

    // MODIFICADO: Event Listener para los botones de acción dentro de los resultados
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('result-action-link')) {
            e.preventDefault();
            const action = e.target.getAttribute('data-action');
            const expediente = e.target.getAttribute('data-expediente');

            if (action === 'reingresar') {
                window.location.href = `reingresar-tramite.html?expediente=${expediente}`;
            } else if (action === 'adjuntos' || action === 'detalle') {
                // MODIFICADO: Llamamos a la función de detalle, pasando la acción
                await showExpedienteDetails(expediente, action);
            } else if (action === 'constancia') {
                alert(`Generando constancia para el expediente ${expediente}. (Lógica de descarga o visualización)`);
            }
        }
    });

    // MODIFICADO: Función para mostrar los detalles del expediente (ahora modular)
    async function showExpedienteDetails(expediente, action) {
        const detalleSection = document.getElementById('detalleExpedienteSection');
        const searchResultsSection = document.getElementById('searchResults');
        const detalleInfoContainer = document.getElementById('detalleInfoContainer');
        const adjuntosInfoContainer = document.getElementById('adjuntosInfoContainer');
        const detalleTitle = document.getElementById('detalleTitle');

        // Ocultar la sección de resultados
        searchResultsSection.style.display = 'none';
        
        try {
            const encodedExpediente = encodeURIComponent(expediente);
            const response = await fetch(`http://127.0.0.1:5000/api/tramites/detalle/${encodedExpediente}`);
            const data = await response.json();

            if (response.ok) {
                // Rellenar la sección de detalles
                document.getElementById('detalleExpedienteNumero').textContent = data.numero_expediente;
                document.getElementById('detalleEntidad').textContent = data.entidad_destino;
                document.getElementById('detalleOficina').textContent = data.oficina_destino;
                document.getElementById('detalleTipoDocumento').textContent = data.tipo_documento;
                document.getElementById('detalleNumeroDocumento').textContent = data.numero_documento_remitente || 'N/A';
                document.getElementById('detalleAsunto').textContent = data.asunto;
                document.getElementById('detalleComentarios').textContent = data.comentarios || 'Sin comentarios.';
                document.getElementById('detalleFechaCreacion').textContent = new Date(data.fecha_creacion).toLocaleString('es-LA');
                document.getElementById('detalleEstado').textContent = data.estado;

                // Rellenar la lista de adjuntos (esta lógica se ejecuta para ambos, Detalle y Adjuntos)
                const listaAdjuntos = document.getElementById('listaAdjuntos');
                listaAdjuntos.innerHTML = '';
                
                if (data.ruta_documento_principal) {
                    const adjuntoPrincipal = document.createElement('li');
                    adjuntoPrincipal.innerHTML = `<a href="http://127.0.0.1:5000/uploads/${data.nombre_documento_principal}" target="_blank">${data.nombre_documento_principal} (Principal)</a>`;
                    listaAdjuntos.appendChild(adjuntoPrincipal);
                }
                
                if (data.anexos_adjuntos && data.anexos_adjuntos.length > 0) {
                    data.anexos_adjuntos.forEach(anexo => {
                        const li = document.createElement('li');
                        li.innerHTML = `<a href="http://127.0.0.1:5000/uploads/${anexo.nombre_archivo}" target="_blank">${anexo.nombre_archivo}</a>`;
                        listaAdjuntos.appendChild(li);
                    });
                }
                
                // Si no hay adjuntos, mostramos un mensaje
                if (!data.ruta_documento_principal && (!data.anexos_adjuntos || data.anexos_adjuntos.length === 0)) {
                    listaAdjuntos.innerHTML = '<li>No hay documentos adjuntos.</li>';
                }


                // LÓGICA CLAVE: Mostrar u ocultar secciones según la acción
                if (action === 'detalle') {
                    detalleTitle.textContent = 'Detalles del Expediente';
                    detalleInfoContainer.style.display = 'block'; // Mostrar la info del trámite
                    adjuntosInfoContainer.style.display = 'none';  // Ocultar la lista de adjuntos
                } else if (action === 'adjuntos') {
                    detalleTitle.textContent = 'Documentos Adjuntos';
                    detalleInfoContainer.style.display = 'none';  // Ocultar la info del trámite
                    adjuntosInfoContainer.style.display = 'block'; // Mostrar la lista de adjuntos
                }

                // Mostrar la sección completa de detalles
                detalleSection.style.display = 'block';

            } else {
                alert(`Error al obtener detalles: ${data.message || 'Error desconocido'}`);
                // Si falla, ocultar la sección de detalles
                detalleSection.style.display = 'none';
                searchResultsSection.style.display = 'block';
            }

        } catch (error) {
            console.error('Error al obtener detalles del servidor:', error);
            alert('No se pudo obtener el detalle del expediente. Verifique la conexión.');
            detalleSection.style.display = 'none';
            searchResultsSection.style.display = 'block';
        }
    }

    // MODIFICADO: Lógica para el botón "Cerrar" en la sección de detalles
    const closeDetalleBtn = document.getElementById('closeDetalleBtn');
    if (closeDetalleBtn) {
        closeDetalleBtn.addEventListener('click', () => {
            const detalleSection = document.getElementById('detalleExpedienteSection');
            const searchResultsSection = document.getElementById('searchResults');
            detalleSection.style.display = 'none';
            searchResultsSection.style.display = 'block';
        });
    }

    if (btnBuscarSeguimiento) {
        btnBuscarSeguimiento.addEventListener('click', async (e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (numeroExpedienteBusquedaInput.value) {
                params.append('expediente', numeroExpedienteBusquedaInput.value);
            }
            if (fechaInicioInput.value) {
                params.append('fecha_inicio', fechaInicioInput.value);
            }
            if (fechaFinInput.value) {
                params.append('fecha_fin', fechaFinInput.value);
            }
            if (entidadSelect.value) {
                params.append('entidad', entidadSelect.value);
            }
            if (tercerosCheckbox.checked) {
                params.append('terceros', 'on');
            }
            
            const queryString = params.toString();
            const url = `http://127.0.0.1:5000/api/tramites/buscar_seguimiento?${queryString}`;

            try {
                const response = await fetch(url);
                const tramites = await response.json();
                if (response.ok) {
                    renderResults(tramites);
                } else {
                    renderResults([]);
                    alert(`Error en la búsqueda: ${tramites.message || 'Error desconocido'}`);
                }
            } catch (error) {
                console.error('Error al conectar con el servidor de búsqueda:', error);
                alert('No se pudo conectar con el servidor de seguimiento. Intente de nuevo más tarde.');
                renderResults([]);
            }
        });
    }

    if (btnMostrarTodos) {
        btnMostrarTodos.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = 'http://127.0.0.1:5000/api/tramites/buscar_seguimiento';
            
            try {
                const response = await fetch(url);
                const tramites = await response.json();
                if (response.ok) {
                    renderResults(tramites);
                    alert(`Se encontraron ${tramites.length} trámites.`);
                } else {
                    renderResults([]);
                    alert(`Error al mostrar todos los trámites: ${tramites.message || 'Error desconocido'}`);
                }
            } catch (error) {
                console.error('Error al conectar con el servidor:', error);
                alert('No se pudo conectar con el servidor. Intente de nuevo más tarde.');
                renderResults([]);
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const expedienteParam = urlParams.get('expediente');
    const reingresarExpedienteInput = document.getElementById('numeroExpediente');

    if (expedienteParam && reingresarExpedienteInput) {
        reingresarExpedienteInput.value = expedienteParam;
        const buscarButton = document.getElementById('btnBuscarExpediente');
        if (buscarButton) {
            buscarButton.click();
        }
    }
});