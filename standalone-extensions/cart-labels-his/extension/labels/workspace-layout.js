// Move low-frequency controls into dialogs without changing print geometry.
(() => {
  const aside = document.querySelector('.workspace > aside');
  const patient = $('patientPanel');
  const dialog = wsNode('dialog');
  dialog.id = 'patientDialog'; dialog.setAttribute('aria-labelledby', 'patientDialogTitle');
  const heading = patient.querySelector('h2');
  heading.id = 'patientDialogTitle'; heading.textContent = '查看／調整名單';
  const close = wsNode('button', '', '完成'); close.type = 'button'; close.id = 'closePatientDialog';
  close.onclick = () => dialog.close();
  patient.querySelector('.section-title').append(close);
  dialog.append(patient); document.body.append(dialog);
  aside.append(document.querySelector('.acquisition-panel'), document.querySelector('.handover-panel'));
  const printModePanel = $('printModePanel');
  if (printModePanel) aside.append(printModePanel);
  const actions = wsNode('div', 'workspace-secondary');
  const open = wsNode('button', '', '查看／調整名單');
  open.id = 'openPatientDialog'; open.type = 'button';
  open.onclick = () => {if (!wsBusy() && !ws.locked) {renderPatientList(); dialog.showModal(); $('patientSearch').focus();}};
  actions.append(open); aside.append(actions);
  const previousControls = wsControls;
  wsControls = function () {
    previousControls();
    open.disabled = wsBusy() || ws.locked || !records.length;
  };
  patient.querySelector('.side-toggle').hidden = true;
  $('clear').hidden = true;
  patient.querySelector('.panel-actions').hidden = true;
  $('summary').hidden = true;
  $('status').hidden = true;
  document.querySelector('.help-panel').hidden = true;
  // Hidden legacy controls still implement click-to-start and keyboard shortcuts.
  for (const id of ['startRow', 'startCol']) $(id).closest('label').hidden = true;
  for (const id of ['startTitle', 'startHint', 'filterInfo', 'count']) $(id).hidden = true;
  $('previewFiltered').closest('label').hidden = true;
  $('qrEnabledBar').closest('label').hidden = true;
  document.querySelector('.sb-tip').textContent = '點格子設定起印位置';
  $('startReset').textContent = '回到第一格';
  $('empty').querySelector('h3').textContent = '列印預覽';
  $('empty').querySelector('p').textContent = '讀取病房後，標籤會自動顯示。';
  const originalAfter = afterRender;
  afterRender = function () {
    originalAfter();
    const plan = pagePlan(printItems().length);
    document.querySelectorAll('.sheet').forEach((sheet, index) => {
      const label = sheet.querySelectorAll(':scope > .label')[plan[index]?.offset || 0];
      label?.classList.add('start-cell');
    });
    open.disabled = wsBusy() || ws.locked || !records.length;
  };
  if (CART_TEST_MODE) {
    const controls = $('testControls');
    const label = $('testScenarioLabel'); controls.prepend(label); label.hidden = false;
    const apply = wsNode('button', 'primary', '套用並重新讀取');
    apply.type = 'button'; apply.id = 'applyTestScenario';
    apply.onclick = () => {if (wsBusy() || ws.locked) return; $('testHelpDialog').close(); void wsCapture();};
    controls.append(apply);
  }
  document.body.classList.add('workspace-v213');
  afterRender(); requestAnimationFrame(fitPreview);
})();
