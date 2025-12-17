function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setupUI() {
  const nodeAmountRange = document.querySelector("#nodeAmountRange");
  strokeWeight(1);

  //setup Interactions
  const radioBtns = document.querySelectorAll(".radioBtn");
  radioBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      radioBtns.forEach((b) => b.classList.remove("button-active"));
      btn.classList.add("button-active");
    });
  });
  const minMaxBtn = document.querySelector("#minMax");
  const simSettings = document.querySelector("#simSettings");
  minMaxBtn.addEventListener("click", function (e) {
    simSettings.classList.toggle("simSettings-close");
    windowResized();
  });
}
