// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "processMember") {
    handleMember(request.member, request.url)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开启以支持异步响应
  }
});

// 处理单个成员
async function handleMember(member, url) {
  console.log("浏览器地址栏 url:", url);
  const platform = url.includes("extension")
    ? "0"
    : url.includes("extension")
    ? "1"
    : null; // 插件 0；固件 1

  const rcDialogTitle0 = document.querySelector(
    `[aria-labelledby="rcDialogTitle${platform}"`
  ); // 插件 rcDialogTitle0；固件 rcDialogTitle1
  if (rcDialogTitle0?.style?.display === "none") {
    throw new Error(
      "找不到企业测试成员配置弹窗，请打开需要配置的版本的弹窗后重试！"
    );
  }

  const targetTestMembers = document.getElementById("targetTestMembers");
  if (!targetTestMembers) {
    throw new Error(
      "找不到企业测试成员配置弹窗，请打开需要配置的版本的弹窗后重试！"
    );
  }

  console.log("rcDialogTitle0:", rcDialogTitle0);
  console.log("targetTestMembers:", targetTestMembers);

  // 模拟输入
  simulateReactInput(targetTestMembers, member.id);
  await sleep(1500);

  const currentId = document.getElementsByClassName(
    "ant5-select-item-option-active"
  )[0];

  if (currentId.getAttribute("aria-selected") !== "true") {
    if (!currentId) {
      throw new Error("找不到下拉选项");
    }

    currentId.click();
    await sleep(1500);

    console.log("处理 ID:", member.name, member.id);
  } else {
    simulateReactInput(targetTestMembers, "");
  }
}

// 模拟React输入
function simulateReactInput(element, value) {
  const lastValue = element.value;
  element.value = value;

  if (element._valueTracker) {
    element._valueTracker.setValue(lastValue);
  }

  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: value,
    })
  );
}

// 延时函数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
