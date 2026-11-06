// Presentation only: the handover controller owns print/save state and actions.
(() => {
  const bar = document.querySelector('.print-bar');
  const actions = $('footerPrintActions');
  const info = $('footerPrintInfo');
  const meta = $('footerPrintMeta');
  meta.prepend($('workspaceTotals'));
  info.append($('printReason'));
  $('printMain').hidden = true;
  bar.append(actions);
  actions.hidden = false;
})();
