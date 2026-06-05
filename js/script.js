const url = "catalogo.pdf";

let pdfDoc = null;
let pageNum = 1;
let isRendering = false;

const canvas = document.getElementById("pdf-render");
const ctx = canvas.getContext("2d");

const pageNumEl = document.getElementById("page-num");
const pageCountEl = document.getElementById("page-count");

function getScale() {

  if (window.innerWidth < 768) {
    return 2.2;
  }

  return 2.8;
}

function renderPage(num) {

  isRendering = true;

  pdfDoc.getPage(num).then(page => {

    const scale = getScale();

    const viewport = page.getViewport({ scale });

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = viewport.width * pixelRatio;
    canvas.height = viewport.height * pixelRatio;

    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise.then(() => {
      isRendering = false;
    });

  });

  pageNumEl.textContent = num;
}

pdfjsLib.getDocument(url).promise.then(pdf => {

  pdfDoc = pdf;

  pageCountEl.textContent = pdf.numPages;

  renderPage(pageNum);

});

document.getElementById("prev-page")
.addEventListener("click", () => {

  if(pageNum <= 1) return;

  pageNum--;

  renderPage(pageNum);

});

document.getElementById("next-page")
.addEventListener("click", () => {

  if(pageNum >= pdfDoc.numPages) return;

  pageNum++;

  renderPage(pageNum);

});

window.addEventListener("resize", () => {

  if(pdfDoc){
    renderPage(pageNum);
  }

});
document
.getElementById("fullscreenBtn")
.addEventListener("click", () => {

  if(!document.fullscreenElement){

    document.documentElement.requestFullscreen();

  } else {

    document.exitFullscreen();

  }

});