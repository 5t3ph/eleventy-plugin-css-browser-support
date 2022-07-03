(() => {
  document
    .querySelectorAll(".css-support-panel-container")
    .forEach((supportPanel) => {
      const supportPanelId = supportPanel
        .querySelector(".css-support-button")
        .getAttribute("aria-controls");
      const panel = document.getElementById(supportPanelId);
      supportPanel.querySelector("code").style.pointerEvents = "none";
      supportPanel.appendChild(panel);
    });

  const handleCSSSupportPanelPosition = (supportPanel) => {
    const bounds = supportPanel.getBoundingClientRect();

    if (bounds.left < 0) supportPanel.classList.add("css-support-panel--left");

    if (bounds.right > window.innerWidth)
      supportPanel.classList.add("css-support-panel--right");
  };

  const handleCloseCSSSupportPanel = (supportPanel) => {
    const panelParent = supportPanel.closest(".css-support-panel-container");
    panelParent.querySelector("button").setAttribute("aria-expanded", "false");
    supportPanel.setAttribute("hidden", "");
    supportPanel.classList.remove("css-support-panel--left");
    supportPanel.classList.remove("css-support-panel--right");
    document.removeEventListener("click", handleClickOutsideCSSSupportPanel);
    document.removeEventListener("keyup", handleCSSSupportPanelKeys);
  };

  const handleCSSSupportPanelKeys = (e) => {
    const el = e.target;
    const panelVisible = document.querySelector(
      ".css-support-panel:not([hidden])"
    );

    if (panelVisible) {
      if (e.key === "Escape") handleCloseCSSSupportPanel(panelVisible);

      if (e.key === "Tab" && !el.closest(".css-support-panel"))
        handleCloseCSSSupportPanel(panelVisible);
    }
  };

  const handleClickOutsideCSSSupportPanel = (e) => {
    const el = e.target;
    const panelVisible = document.querySelector(
      ".css-support-panel:not([hidden])"
    );

    if (panelVisible && !el.closest(".css-support-panel"))
      handleCloseCSSSupportPanel(panelVisible);
  };

  const handleCSSSupportPanelToggle = (btn) => {
    const supportPanelId = btn.getAttribute("aria-controls");
    const supportPanel = document.getElementById(supportPanelId);

    const panelVisible = document.querySelector(
      `.css-support-panel:not([hidden]):not(#${supportPanelId}`
    );

    if (panelVisible) handleCloseCSSSupportPanel(panelVisible);

    btn.setAttribute("aria-expanded", true);
    supportPanel.removeAttribute("hidden");
    handleCSSSupportPanelPosition(supportPanel);
    document.addEventListener("click", handleClickOutsideCSSSupportPanel);
    document.addEventListener("keyup", handleCSSSupportPanelKeys);
  };

  document.addEventListener("click", (e) => {
    const el = e.target;

    if (el.matches(".css-support-button")) handleCSSSupportPanelToggle(el);
  });
})();
