import { PageFlip } from "page-flip";

// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// --- CORRECCIÓN CLAVE: Ruta dinámica para GitHub Pages ---
const url = `${import.meta.env.BASE_URL}catalogo.pdf`; 

const bookElement = document.getElementById("book");
const overlay = document.getElementById("zoom-overlay");
const pageNumEl = document.getElementById("page-num");
const pageCountEl = document.getElementById("page-count");
const progressBar = document.getElementById("progress-bar");
const nextHint = document.getElementById("next-hint");
const prevHint = document.getElementById("prev-hint");
const zoomBtn = document.getElementById("zoomBtn");

async function initCatalog() {
    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const totalPages = pdf.numPages;
        pageCountEl.textContent = totalPages;
        
        const pagesContainer = [];
        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            
            // Alta resolución para evitar borrosidad en productos
            const viewport = page.getViewport({ scale: 3.0 }); 
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { 
                alpha: false, 
                desynchronized: true 
            });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ 
                canvasContext: context, 
                viewport: viewport,
                intent: 'print' 
            }).promise;

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/jpeg', 0.95); 
            img.classList.add('page-img');

            const pageDiv = document.createElement('div');
            pageDiv.classList.add('page');
            pageDiv.appendChild(img);
            pagesContainer.push(pageDiv);
        }

        pagesContainer.forEach(page => bookElement.appendChild(page));

        const pageFlip = new PageFlip(bookElement, {
            width: 550, height: 800,
            size: "stretch",
            minWidth: 300, maxWidth: 600,
            minHeight: 400, maxHeight: 1000,
            showCover: false,
            mobileScrollSupport: false,
            useContainerDimensions: true 
        });

        pageFlip.loadFromHTML(document.querySelectorAll('.page'));

        const updateUI = (currentPage) => {
            const pageIndex = currentPage + 1;
            pageNumEl.textContent = pageIndex;
            progressBar.style.width = `${(pageIndex / totalPages) * 100}%`;
            nextHint.style.opacity = pageIndex >= totalPages ? "0" : "1";
            nextHint.style.pointerEvents = pageIndex >= totalPages ? "none" : "auto";
            prevHint.style.opacity = pageIndex <= 1 ? "0" : "1";
            prevHint.style.pointerEvents = pageIndex <= 1 ? "none" : "auto";
        };

        pageFlip.on('flip', (e) => updateUI(e.data));
        updateUI(0);

        nextHint.addEventListener('click', () => pageFlip.flipNext());
        prevHint.addEventListener('click', () => pageFlip.flipPrev());

        // --- LÓGICA DE ZOOM ---
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        const ZOOM_LEVEL = 3.0;

        const zoomExitFloating = document.getElementById("zoom-exit-floating");

        zoomBtn.addEventListener('click', () => {
            const isZoomed = bookElement.classList.toggle('zoomed');
            overlay.style.display = isZoomed ? "block" : "none"; 
            if(zoomExitFloating) zoomExitFloating.style.display = isZoomed ? "flex" : "none";
            
            zoomBtn.textContent = isZoomed ? "❌ Salir Zoom" : "🔍 Zoom";
            
            if (!isZoomed) {
                translateX = 0; translateY = 0;
                bookElement.style.transform = `translate(0px, 0px) scale(1)`;
            } else {
                bookElement.style.transform = `scale(${ZOOM_LEVEL})`;
            }
        });

        if(zoomExitFloating) {
            zoomExitFloating.addEventListener('click', () => zoomBtn.click());
        }

        const startDrag = (e) => {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX - translateX;
            startY = clientY - translateY;
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            translateX = clientX - startX;
            translateY = clientY - startY;
            bookElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${ZOOM_LEVEL})`;
        };

        const stopDrag = () => { isDragging = false; };

        overlay.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('mouseup', stopDrag);
        overlay.addEventListener('touchstart', startDrag, {passive: false});
        window.addEventListener('touchmove', doDrag, {passive: false});
        window.addEventListener('touchend', stopDrag);

    } catch (error) { 
        console.error("Error cargando el catálogo:", error); 
    }
}

document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } 
    else { document.exitFullscreen(); }
});

initCatalog();

