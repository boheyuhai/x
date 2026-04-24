const stage = document.getElementById("orbital-stage");

if (stage) {
  const root = document.documentElement;
  const enterButton = stage.querySelector(".enter-button");

  const updateMotion = (clientX, clientY) => {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (clientX - centerX) / rect.width;
    const offsetY = (clientY - centerY) / rect.height;

    root.style.setProperty("--tilt-x", `${offsetY * -10}deg`);
    root.style.setProperty("--tilt-y", `${offsetX * 12}deg`);
    root.style.setProperty("--shift-x", `${offsetX * 24}px`);
    root.style.setProperty("--shift-y", `${offsetY * 24}px`);
  };

  stage.addEventListener("pointermove", (event) => {
    updateMotion(event.clientX, event.clientY);
  });

  stage.addEventListener("pointerleave", () => {
    root.style.setProperty("--tilt-x", "0deg");
    root.style.setProperty("--tilt-y", "0deg");
    root.style.setProperty("--shift-x", "0px");
    root.style.setProperty("--shift-y", "0px");
  });

  if (enterButton) {
    enterButton.addEventListener("click", () => {
      enterButton.classList.add("is-pressed");
      window.setTimeout(() => {
        enterButton.classList.remove("is-pressed");
      }, 220);
    });
  }
}
