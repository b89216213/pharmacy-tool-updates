export async function managedRequest(action, extra = {}) {
  const reply = await chrome.runtime.sendMessage({kind:'managed-tool',action,...extra});
  if (!reply?.ok) throw Error(reply?.error || '管理驗證未完成');
  return reply.data;
}

