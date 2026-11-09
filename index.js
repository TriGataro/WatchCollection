/**
 * ==============================================================================
 * Aplicación de Colección de Relojes
 * Archivo: index.js
 * Descripción: Maneja la lógica de la interfaz, el carrusel interactivo, la selección
 *              y renderizado de imágenes completas, la ficha técnica detallada, el
 *              sistema de temas de color y la funcionalidad de compartir.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------------------------
    // 1. Constantes y Variables Globales del Estado
    // --------------------------------------------------------------------------
    const STORAGE_THEME_KEY = 'watch_theme_preference';
    const STORAGE_SELECTED_KEY = 'watch_selected_index';

    // Instancias de componentes de Bootstrap
    let carouselInstance = null;
    let imageModalInstance = null;
    let notificationToastInstance = null;

    // Índice del reloj actualmente seleccionado en la vista de detalle
    let currentSelectedIndex = 0;

    // --------------------------------------------------------------------------
    // 2. Referencias a Elementos del DOM
    // --------------------------------------------------------------------------
    // Elementos del tema
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    // Elementos del carrusel y selección
    const carouselElement = document.getElementById('watchesCarousel');
    const carouselInner = document.getElementById('carouselInner');
    const carouselIndicators = document.getElementById('carouselIndicators');
    const thumbnailsTrack = document.getElementById('thumbnailsTrack');
    const watchesCountBadge = document.getElementById('watchesCountBadge');
    const randomWatchBtn = document.getElementById('randomWatchBtn');

    // Elementos de la sección de detalle
    const watchDetailSection = document.getElementById('watchDetailSection');
    const detailFullImage = document.getElementById('detailFullImage');
    const detailBadgeModelo = document.getElementById('detailBadgeModelo');
    const detailTitleModelo = document.getElementById('detailTitleModelo');
    const detailMarcaBadge = document.getElementById('detailMarcaBadge');
    const detailTipoBadge = document.getElementById('detailTipoBadge');
    const detailMovimientoBadge = document.getElementById('detailMovimientoBadge');
    const detailObservacionesContainer = document.getElementById('detailObservacionesContainer');
    const detailObservaciones = document.getElementById('detailObservaciones');
    const detailPros = document.getElementById('detailPros');
    const detailContras = document.getElementById('detailContras');
    const detailFuncionesGrid = document.getElementById('detailFuncionesGrid');
    const modalZoomBtn = document.getElementById('modalZoomBtn');

    // Elementos del Modal y Compartir
    const modalFullImage = document.getElementById('modalFullImage');
    const imageModalLabel = document.getElementById('imageModalLabel');
    const shareBtn = document.getElementById('shareBtn');
    const detailShareBtn = document.getElementById('detailShareBtn');
    const toastElement = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');

    // --------------------------------------------------------------------------
    // 3. Manejo Seguro de LocalStorage
    // --------------------------------------------------------------------------
    /**
     * Guarda datos en localStorage de manera segura capturando posibles excepciones.
     * @param {string} key - Clave del elemento
     * @param {string} value - Valor a almacenar
     * @returns {boolean} True si se guardó con éxito, False en caso de error
     */
    function safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`No se pudo guardar la clave "${key}" en localStorage:`, error);
            return false;
        }
    }

    /**
     * Obtiene un valor desde localStorage de manera segura.
     * @param {string} key - Clave del elemento
     * @returns {string|null} Valor obtenido o null
     */
    function safeLocalStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn(`No se pudo leer la clave "${key}" desde localStorage:`, error);
            return null;
        }
    }

    // --------------------------------------------------------------------------
    // 4. Mapeo de Iconos de Bootstrap para Funciones
    // --------------------------------------------------------------------------
    /**
     * Devuelve la clase de Bootstrap Icons correspondiente a cada nombre de función.
     * @param {string} functionName - Nombre de la función técnica
     * @returns {string} Clase del icono de Bootstrap
     */
    function getFunctionIconClass(functionName) {
        const lower = functionName.toLowerCase();
        if (lower.includes('luz')) return 'bi-lightbulb-fill';
        if (lower.includes('calendario')) return 'bi-calendar3';
        if (lower.includes('dual') || lower.includes('time') || lower.includes('world')) return 'bi-globe-americas';
        if (lower.includes('cronógrafo') || lower.includes('cronografo')) return 'bi-stopwatch-fill';
        if (lower.includes('temporizador') || lower.includes('timer')) return 'bi-hourglass-split';
        if (lower.includes('alarma')) return 'bi-bell-fill';
        if (lower.includes('mute')) return 'bi-volume-mute-fill';
        if (lower.includes('dst') || lower.includes('saving')) return 'bi-brightness-high-fill';
        if (lower.includes('water') || lower.includes('resist') || lower.includes('agua')) return 'bi-droplet-half';
        return 'bi-check2-circle';
    }

    // --------------------------------------------------------------------------
    // 5. Gestión del Tema (Claro / Oscuro)
    // --------------------------------------------------------------------------
    /**
     * Aplica el tema seleccionado (dark o light) actualizando el DOM y los textos.
     * @param {string} theme - 'dark' o 'light'
     */
    function applyTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        safeLocalStorageSet(STORAGE_THEME_KEY, theme);

        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill';
            themeText.textContent = 'Modo Claro';
            themeToggleBtn.setAttribute('title', 'Cambiar a modo claro');
        } else {
            themeIcon.className = 'bi bi-moon-stars-fill';
            themeText.textContent = 'Modo Oscuro';
            themeToggleBtn.setAttribute('title', 'Cambiar a modo oscuro');
        }
    }

    /**
     * Inicializa el tema según la preferencia guardada o la preferencia del sistema.
     */
    function initTheme() {
        const savedTheme = safeLocalStorageGet(STORAGE_THEME_KEY);
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Detección automática por sistema operativo
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        }

        // Listener del botón para alternar el tema
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // --------------------------------------------------------------------------
    // 6. Notificaciones Toast y Compartir
    // --------------------------------------------------------------------------
    /**
     * Muestra una notificación emergente tipo Toast.
     * @param {string} message - Mensaje a mostrar
     */
    function showNotification(message) {
        if (!notificationToastInstance && toastElement) {
            notificationToastInstance = new bootstrap.Toast(toastElement, { delay: 3500 });
        }
        toastMessage.textContent = message;
        notificationToastInstance.show();
    }

    /**
     * Ejecuta la acción de compartir usando la Web Share API o copiando al portapapeles.
     * @param {object} watch - Objeto del reloj opcional
     */
    async function shareCollection(watch = null) {
        const shareTitle = watch ? `Reloj ${watch.Marca} ${watch.Modelo}` : 'Mi Colección de Relojes';
        const shareDesc = watch
            ? `Echa un vistazo al reloj ${watch.Marca} ${watch.Modelo} (${watch.Tipo}): ${watch.Pros || 'Gran pieza'}`
            : 'Explora mi colección personal de relojes con fotos y especificaciones completas.';
        const shareUrl = window.location.href;

        // Si el navegador soporta Web Share API (celulares y navegadores modernos)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareDesc,
                    url: shareUrl
                });
                return;
            } catch (err) {
                // Si el usuario canceló el diálogo de compartir, no hacemos nada
                if (err.name === 'AbortError') return;
            }
        }

        // Respaldo para computadores y navegadores sin navigator.share
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showNotification('¡Enlace de la colección copiado al portapapeles!');
            } catch (clipboardErr) {
                prompt('Copia este enlace para compartir la colección:', shareUrl);
            }
        } else {
            prompt('Copia este enlace para compartir la colección:', shareUrl);
        }
    }

    // --------------------------------------------------------------------------
    // 7. Corrección de rutas de imágenes
    // --------------------------------------------------------------------------
    /**
     * Configura el manejo de error de carga para una imagen (soporte case-sensitive).
     * @param {HTMLImageElement} imgElement - Elemento de imagen
     * @param {string} originalSrc - Ruta original configurada
     */
    function setupImageFallback(imgElement, originalSrc) {
        imgElement.src = originalSrc;
        imgElement.addEventListener('error', function onImgError() {
            // Intentar ruta en minúsculas en servidores Linux donde las mayúsculas importan
            const lowerSrc = originalSrc.toLowerCase();
            if (imgElement.src !== lowerSrc) {
                imgElement.src = lowerSrc;
            }
        }, { once: true });
    }

    // --------------------------------------------------------------------------
    // 8. Renderizado del Detalle del Reloj Seleccionado
    // --------------------------------------------------------------------------
    /**
     * Muestra la imagen completa y toda la información técnica del reloj seleccionado.
     * @param {number} index - Índice del reloj en la colección
     * @param {boolean} shouldScroll - Indica si debe desplazarse a la vista de detalle
     */
    function displayWatchDetail(index, shouldScroll = false) {
        if (!Array.isArray(watchCollection) || !watchCollection[index]) {
            return;
        }

        currentSelectedIndex = index;
        safeLocalStorageSet(STORAGE_SELECTED_KEY, index.toString());
        const watch = watchCollection[index];

        // Efecto visual de transición
        watchDetailSection.classList.remove('fade-in-content');
        void watchDetailSection.offsetWidth; // Forzar reflujo para reiniciar la animación
        watchDetailSection.classList.add('fade-in-content');

        // 1. Imagen Completa
        setupImageFallback(detailFullImage, watch.Foto);
        detailFullImage.alt = `${watch.Marca} ${watch.Modelo} en tamaño completo`;
        detailBadgeModelo.textContent = `${watch.Marca} ${watch.Modelo}`;

        // 2. Información General
        detailTitleModelo.textContent = `${watch.Marca} ${watch.Modelo}`;
        detailMarcaBadge.textContent = watch.Marca || 'Marca Desconocida';
        detailTipoBadge.textContent = watch.Tipo ? `Tipo: ${watch.Tipo}` : 'General';
        detailMovimientoBadge.textContent = watch.Movimiento ? `Movimiento: ${watch.Movimiento}` : 'Sin datos';

        // 3. Observaciones
        if (watch.Observaciones && watch.Observaciones.trim() !== '') {
            detailObservaciones.textContent = watch.Observaciones;
            detailObservacionesContainer.classList.remove('d-none');
        } else {
            detailObservacionesContainer.classList.add('d-none');
        }

        // 4. Pros y Contras
        detailPros.textContent = (watch.Pros && watch.Pros.trim() !== '')
            ? watch.Pros
            : 'Sin puntos destacados registrados.';

        detailContras.textContent = (watch.Contras && watch.Contras.trim() !== '')
            ? watch.Contras
            : 'No se registran puntos en contra.';

        // 5. Funciones y Especificaciones Técnicas Dinámicas
        detailFuncionesGrid.innerHTML = '';
        if (watch.Funciones && typeof watch.Funciones === 'object') {
            const entries = Object.entries(watch.Funciones);

            entries.forEach(([key, value]) => {
                const col = document.createElement('div');
                col.className = 'col-12 col-sm-6 col-lg-4';

                // Definir diseño de insignia según el valor (Sí / No / Especificación textual)
                let badgeClass = 'text-bg-primary';
                const lowerVal = String(value).toLowerCase().trim();
                if (lowerVal === 'si' || lowerVal === 'sí') {
                    badgeClass = 'text-bg-success';
                } else if (lowerVal === 'no') {
                    badgeClass = 'text-bg-secondary';
                }

                col.innerHTML = `
                    <div class="function-item-card h-100">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi ${getFunctionIconClass(key)} text-primary fs-5"></i>
                            <span class="function-name">${key}</span>
                        </div>
                        <span class="badge ${badgeClass} function-value">${value}</span>
                    </div>
                `;
                detailFuncionesGrid.appendChild(col);
            });
        }

        // 6. Actualizar miniatura activa en la barra de navegación rápida
        const allThumbs = thumbnailsTrack.querySelectorAll('.thumb-item');
        allThumbs.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                thumb.classList.remove('active');
            }
        });

        // 7. Preparar imagen ampliada para el Modal de pantalla completa
        setupImageFallback(modalFullImage, watch.Foto);
        modalFullImage.alt = `${watch.Marca} ${watch.Modelo} ampliado`;
        imageModalLabel.textContent = `${watch.Marca} ${watch.Modelo}`;

        // 8. Desplazamiento suave si fue accionado por clic directo del usuario
        if (shouldScroll) {
            watchDetailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --------------------------------------------------------------------------
    // 9. Inicialización y Construcción del Carrusel
    // --------------------------------------------------------------------------
    /**
     * Construye dinámicamente las diapositivas del carrusel y las miniaturas.
     */
    function buildCarousel() {
        if (!Array.isArray(watchCollection) || watchCollection.length === 0) {
            carouselInner.innerHTML = `
                <div class="p-5 text-center text-body-secondary">
                    <i class="bi bi-exclamation-circle fs-1 d-block mb-3"></i>
                    No se encontraron relojes en la fuente de datos.
                </div>
            `;
            return;
        }

        watchesCountBadge.textContent = `${watchCollection.length} modelos`;
        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';
        thumbnailsTrack.innerHTML = '';

        watchCollection.forEach((watch, index) => {
            const isActive = index === 0;

            // Indicador de Bootstrap para el carrusel
            const indicator = document.createElement('button');
            indicator.type = 'button';
            indicator.setAttribute('data-bs-target', '#watchesCarousel');
            indicator.setAttribute('data-bs-slide-to', index.toString());
            indicator.setAttribute('aria-label', `Reloj ${watch.Modelo}`);
            if (isActive) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            }
            carouselIndicators.appendChild(indicator);

            // Diapositiva del Carrusel
            const slide = document.createElement('div');
            slide.className = `carousel-item ${isActive ? 'active' : ''}`;

            const slideContent = document.createElement('div');
            slideContent.className = 'carousel-slide-content';
            slideContent.setAttribute('role', 'button');
            slideContent.setAttribute('tabindex', '0');
            slideContent.setAttribute('aria-label', `Seleccionar reloj ${watch.Marca} ${watch.Modelo}`);

            const img = document.createElement('img');
            img.className = 'carousel-watch-img';
            img.alt = `${watch.Marca} ${watch.Modelo}`;
            setupImageFallback(img, watch.Foto);

            // Información flotante de la diapositiva
            const caption = document.createElement('div');
            caption.className = 'carousel-caption-custom';
            caption.innerHTML = `
                <div class="carousel-caption-info">
                    <span class="badge text-bg-primary me-1">${watch.Marca}</span>
                    <strong class="fs-6">${watch.Modelo}</strong>
                </div>
            `;

            slideContent.appendChild(img);
            slideContent.appendChild(caption);

            // Al hacer clic en la diapositiva del carrusel, seleccionar y abrir el detalle
            slideContent.addEventListener('click', () => {
                displayWatchDetail(index, true);
            });

            // Accesibilidad: permitir selección mediante teclado (Enter o Espacio)
            slideContent.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    displayWatchDetail(index, true);
                }
            });

            slide.appendChild(slideContent);
            carouselInner.appendChild(slide);

            // Miniatura para la barra inferior de selección rápida
            const thumb = document.createElement('div');
            thumb.className = `thumb-item ${isActive ? 'active' : ''}`;
            thumb.setAttribute('role', 'button');
            thumb.setAttribute('tabindex', '0');
            thumb.setAttribute('title', `${watch.Marca} ${watch.Modelo}`);

            const thumbImg = document.createElement('img');
            thumbImg.className = 'thumb-img';
            thumbImg.alt = `${watch.Modelo}`;
            setupImageFallback(thumbImg, watch.Foto);

            thumb.appendChild(thumbImg);

            // Al hacer clic en la miniatura, cambiar el carrusel y cargar el detalle
            thumb.addEventListener('click', () => {
                if (carouselInstance) {
                    carouselInstance.to(index);
                }
                displayWatchDetail(index, true);
            });

            thumb.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (carouselInstance) {
                        carouselInstance.to(index);
                    }
                    displayWatchDetail(index, true);
                }
            });

            thumbnailsTrack.appendChild(thumb);
        });

        // Inicializar componente Carousel de Bootstrap
        carouselInstance = new bootstrap.Carousel(carouselElement, {
            interval: false,
            wrap: true,
            keyboard: true
        });

        // Escuchar el evento de cambio de diapositiva del carrusel para sincronizar el detalle
        carouselElement.addEventListener('slide.bs.carousel', (event) => {
            const targetIndex = event.to;
            displayWatchDetail(targetIndex, false);
        });

        // Recuperar último reloj visto desde localStorage si existe
        const savedIndex = safeLocalStorageGet(STORAGE_SELECTED_KEY);
        const initialIndex = (savedIndex && watchCollection[Number(savedIndex)]) ? Number(savedIndex) : 0;

        if (initialIndex !== 0 && carouselInstance) {
            carouselInstance.to(initialIndex);
        }
        displayWatchDetail(initialIndex, false);
    }

    // --------------------------------------------------------------------------
    // 10. Modal para Visualización de Imagen Completa en Pantalla Grande
    // --------------------------------------------------------------------------
    const imageModalEl = document.getElementById('imageModal');
    if (imageModalEl) {
        imageModalInstance = new bootstrap.Modal(imageModalEl);

        // Abrir modal al hacer clic en la imagen de detalle o en el botón de ampliar
        detailFullImage.addEventListener('click', () => {
            imageModalInstance.show();
        });

        modalZoomBtn.addEventListener('click', () => {
            imageModalInstance.show();
        });
    }

    // --------------------------------------------------------------------------
    // 11. Eventos de Compartir
    // --------------------------------------------------------------------------
    shareBtn.addEventListener('click', () => {
        shareCollection(null);
    });

    detailShareBtn.addEventListener('click', () => {
        if (watchCollection && watchCollection[currentSelectedIndex]) {
            shareCollection(watchCollection[currentSelectedIndex]);
        } else {
            shareCollection(null);
        }
    });

    // --------------------------------------------------------------------------
    // 12. Selección de Reloj al Azar
    // --------------------------------------------------------------------------
    /**
     * Elige un reloj al azar de la colección y sincroniza el carrusel y la vista de detalle.
     */
    function selectRandomWatch() {
        if (!Array.isArray(watchCollection) || watchCollection.length === 0) {
            return;
        }

        // Si hay más de un reloj, seleccionar uno diferente al actualmente visible
        let randomIndex = Math.floor(Math.random() * watchCollection.length);
        if (watchCollection.length > 1 && randomIndex === currentSelectedIndex) {
            randomIndex = (randomIndex + 1 + Math.floor(Math.random() * (watchCollection.length - 1))) % watchCollection.length;
        }

        // Desplazar el carrusel al reloj elegido al azar
        if (carouselInstance) {
            carouselInstance.to(randomIndex);
        }

        // Actualizar datos de detalle y miniatura activa sin desplazar la pantalla
        displayWatchDetail(randomIndex, false);
    }

    if (randomWatchBtn) {
        randomWatchBtn.addEventListener('click', selectRandomWatch);
    }

    // --------------------------------------------------------------------------
    // 13. Inicialización General de la Página
    // --------------------------------------------------------------------------
    initTheme();
    buildCarousel();

});
