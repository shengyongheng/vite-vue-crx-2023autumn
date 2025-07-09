<script setup>
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref, watch } from 'vue';
const BASE_URL = 'https://stunning-gingersnap-0eb308.netlify.app/'

const OPERATE_TYPE = {
    NAME: 'name',
    ID: 'id',
}

const MAX_SELECT_COUNT = 20

const operateType = ref("")

const input = ref('')
const currentPage = ref(1)
const currentPageMemberList = ref([])
const editingIndex = ref("")

const memberList = ref([])

watch([memberList, currentPage], ([memberListNew, currentPageNew]) => {
    currentPageMemberList.value = memberListNew.slice((currentPageNew - 1) * 10, currentPageNew * 10)
}, {
    deep: true,
})

const selectedMemberIds = ref([])

const ruleFormRef = ref()

const ruleForm = reactive({
    name: '',
    id: '',
})

const addMemberForm = reactive({
    name: '',
    id: '',
})

const rules = reactive({
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    id: [{ required: true, message: '请输入ID', trigger: 'blur' }],
})

onMounted(() => {
    fetchMembers()
})

const handleSelectCurrentPage = () => {
    const isAllChecked = currentPageMemberList.value.every(item => item.checked)
    const currentPageMemberIds = currentPageMemberList.value.map(item => item.id)
    if (isAllChecked) {
        currentPageMemberIds.forEach(id => {
            memberList.value.find(item => item.id === id).checked = false
        })
    } else {
        const checkedMemberIds = memberList.value.filter(item => item.checked).map(item => item.id)
        const unCheckedCurrentPageMemberIds = currentPageMemberIds.filter(id => !checkedMemberIds.includes(id))
        if (checkedMemberIds.length + unCheckedCurrentPageMemberIds.length > MAX_SELECT_COUNT) {
            openMessage()
            return
        }
        currentPageMemberIds.forEach(id => {
            memberList.value.find(item => item.id === id).checked = true
        })
    }
    selectedMemberIds.value = memberList.value.filter(item => item.checked).map(item => item.id)
}

//#region 
const fetchMembers = () => {
    fetch(`${BASE_URL}/api/members`)
        .then(response => response.json())
        .then(json => {
            memberList.value = json.map(item => ({
                ...item,
                checked: selectedMemberIds.value.includes(item.id)
            }))
        })
        .catch(err => console.log('Request Failed', err));
}

const handleAddMember = () => {
    fetch(`${BASE_URL}/api/members?name=${addMemberForm.name}&id=${addMemberForm.id}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(() => {
            fetchMembers()
        })
        .catch(err => console.log('Request Failed', err))
        .finally(() => {
            addMemberForm.name = ""
            addMemberForm.id = ""
        });
}

const handleEditName = (id, name) => {
    operateType.value = OPERATE_TYPE.NAME
    editingIndex.value = id
    ruleForm.name = name
    ruleForm.id = id
}

const handleEditNameCancel = () => {
    operateType.value = ""
    editingIndex.value = ""
    ruleForm.name = ""
    ruleForm.id = ""
}

const handleEditNameSave = (id) => {
    fetch(`${BASE_URL}/api/members/${id}?name=${ruleForm.name}&id=${ruleForm.id}`, {
        method: 'PUT'
    })
        .then(() => {
            fetchMembers()
        })
        .catch(err => console.log('Request Failed', err))
        .finally(() => {
            operateType.value = ""
            editingIndex.value = ""
            ruleForm.name = ""
            ruleForm.id = ""
        });
}

const handleEditId = (id, name) => {
    operateType.value = OPERATE_TYPE.ID
    editingIndex.value = id
    ruleForm.id = id
    ruleForm.name = name
}

const handleEditIdCancel = () => {
    operateType.value = ""
    editingIndex.value = ""
    ruleForm.id = ""
    ruleForm.name = ""
}

const handleEditIdSave = (id) => {
    fetch(`${BASE_URL}/api/members/${id}?name=${ruleForm.name}&id=${ruleForm.id}`, {
        method: 'PUT'
    })
        .then(() => {
            fetchMembers()
        })
        .catch(err => console.log('Request Failed', err))
        .finally(() => {
            operateType.value = ""
            editingIndex.value = ""
            ruleForm.name = ""
            ruleForm.id = ""
            selectedMemberIds.value = memberList.value.filter(item => item.checked).map(item => item.id)
        });
}

const handleMemberChange = (id) => {
    selectedMemberIds.value.push(id)
}

const handleDeleteMember = (id) => {
    fetch(`${BASE_URL}/api/members/${id}`, {
        method: 'DELETE'
    })
        .then(() => {
            fetchMembers()
        })
}

const handleConfirm = async () => {
    if (selectedMemberIds.value.length === 0) {
        ElMessage({
            message: `请先选择要配置的成员`,
            type: 'info',
            plain: true,
        })
        return
    }
    try {
        // 获取当前活动标签页
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const { url } = tab;
        // 确保content script已注入
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js", "content-script.js"],
        });
        // 处理每个选中的成员
        for (const member of memberList.value) {
            if (!member.checked) continue;
            try {
                // 发送消息到content script
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: "processMember",
                    member: member,
                    url: url,
                });

                if (!response || !response.success) {
                    throw new Error(response?.error || "处理失败");
                }
            } catch (error) {
                ElMessage({
                    message: `处理失败: ${member.name} ${member.id}`,
                    type: 'error',
                    plain: true,
                })
                throw error;
            }
        }
    }
    catch (err) {
        ElMessage({
            message: `处理失败: ${err}`, // Could not establish connection. Receiving end does not exist.
            type: 'error',
            plain: true,
        })
    }
}

// // 处理单个成员
// const handleMember = async (member, url) => {
//     // console.log("url:", url); // 浏览器地址栏 url
//     const platform = url.includes("extension") ? "0" : url.includes("extension") ? "1" : null;  // 插件 0；固件 1 
//     // console.log("platform:", platform);
//     const rcDialogTitle0 = document.querySelector(`[aria-labelledby="rcDialogTitle${platform}"`); // 插件 rcDialogTitle0；固件 rcDialogTitle1
//     console.log("rcDialogTitle0:", rcDialogTitle0);
//     if (rcDialogTitle0?.style?.display === "none") {
//         ElMessage({
//             message: `找不到企业测试成员配置弹窗，请打开需要配置的版本的弹窗后重试！11`,
//             type: 'error',
//             plain: true,
//         })
//         return;
//     }
//     const targetTestMembers = document.getElementById("targetTestMembers");
//     console.log("targetTestMembers:", targetTestMembers);
//     if (!targetTestMembers) {
//         ElMessage({
//             message: `找不到企业测试成员配置弹窗，请打开需要配置的版本的弹窗后重试！22`,
//             type: 'error',
//             plain: true,
//         })
//         return;
//     }

//     // 模拟输入
//     simulateReactInput(targetTestMembers, member.id);
//     await sleep(1500);

//     const currentId = document.getElementsByClassName("ant5-select-item-option-active")[0];

//     if (currentId.getAttribute('aria-selected') !== "true") {
//         if (!currentId) {
//             throw new Error("找不到下拉选项");
//         }

//         currentId.click();
//         await sleep(1500);

//         console.log("处理 ID:", member.name, member.id);
//     } else {
//         simulateReactInput(targetTestMembers, "");
//     }
// }

// // 模拟React输入
// const simulateReactInput = (element, value) => {
//     const lastValue = element.value;
//     element.value = value;

//     if (element._valueTracker) {
//         element._valueTracker.setValue(lastValue);
//     }

//     element.dispatchEvent(new InputEvent('input', {
//         bubbles: true,
//         inputType: 'insertText',
//         data: value
//     }));
//     ElMessage({
//         message: `处理成功: ${member.name} ${member.id}`,
//         type: 'success',
//         plain: true,
//     })
// }

// // 延时函数
// const sleep = (ms) => {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
//#endregion
const handlePrevPage = () => {
    currentPage.value--
}
const handleNextPage = () => {
    currentPage.value++
}
const openMessage = () => {
    ElMessage({
        message: `最多只能选择 ${MAX_SELECT_COUNT} 个成员`,
        type: 'warning',
        plain: true,
    })
}
</script>

<template>
    <div class="P-home">
        <div class="P-home-header">
            <h1>米家自动化配置助手</h1>
            <el-button @click="handleSelectCurrentPage">全选当前页</el-button>
        </div>
        <el-divider style="margin: 0" />
        <div class="selection-info">
            <span>已选择：<span class="selection-count">{{ selectedMemberIds.length }}</span> / {{ MAX_SELECT_COUNT
                }}</span>
            <span class="selection-limit" style="display: none">最多只能选择 {{ MAX_SELECT_COUNT }} 个成员</span>
        </div>
        <div class="search-box">
            <el-input v-model="input" style="width: 100%;height: 28px;" placeholder="搜索成员..." clearable />
        </div>
        <div class="add-member">
            <el-form :inline="true" :model="addMemberForm" class="demo-form-inline">
                <el-form-item label="米家ID:">
                    <el-input v-model="addMemberForm.id" placeholder="请输入id" clearable />
                </el-form-item>
                <el-form-item label="用户名:">
                    <el-input v-model="addMemberForm.name" placeholder="请输入name" clearable />
                </el-form-item>
                <el-form-item style="margin-left: 0px !important;">
                    <el-button type="primary" @click="handleAddMember">添加</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="member-container">
            <div class="member-list">
                <div class="member-item" v-for="item in currentPageMemberList" :key="item.id">
                    <el-popconfirm title="确认要删除该成员吗？" placement="top" @confirm="handleDeleteMember(item.id)">
                        <template #reference>
                            <el-icon class="delete-icon">
                                <Delete />
                            </el-icon>
                        </template>
                    </el-popconfirm>
                    <el-checkbox v-model="item.checked" @change="handleMemberChange(item.id)" />
                    <div class="member-item-info">
                        <el-form ref="ruleFormRef" :model="ruleForm" status-icon :rules="rules" label-width="auto">
                            <div class="member-item-info-name">
                                <template v-if="editingIndex === item.id && operateType === OPERATE_TYPE.NAME">
                                    <el-form-item prop="name">
                                        <el-input v-model="ruleForm.name" />
                                    </el-form-item>
                                    <div>
                                        <el-icon @click="handleEditNameCancel(item.name)">
                                            <Close />
                                        </el-icon>
                                        <el-icon @click="handleEditNameSave(item.id)">
                                            <Check />
                                        </el-icon>
                                    </div>
                                </template>
                                <template v-else>
                                    <span>{{ item.name }}</span>
                                    <el-icon @click="handleEditName(item.id, item.name)">
                                        <Edit />
                                    </el-icon>
                                </template>
                            </div>
                            <div class="member-item-info-id">
                                <template v-if="editingIndex === item.id && operateType === OPERATE_TYPE.ID">
                                    <el-form-item prop="id">
                                        <el-input v-model="ruleForm.id" />
                                    </el-form-item>
                                    <el-icon @click="handleEditIdCancel(item.id)">
                                        <Close />
                                    </el-icon>
                                    <el-icon @click="handleEditIdSave(item.id)">
                                        <Check />
                                    </el-icon>
                                </template>
                                <template v-else>
                                    <span>({{ item.id }})</span>
                                    <el-icon @click="handleEditId(item.id, item.name)">
                                        <Edit />
                                    </el-icon>
                                </template>
                            </div>
                        </el-form>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="pagination">
                <el-button style="margin-right: 8px;" @click="handlePrevPage"
                    :disabled="currentPage === 1">上一页</el-button>
                <span>第 {{ currentPage }} 页，共 {{ Math.ceil(memberList.length / 10) }} 页</span>
                <el-button style="margin-left: 8px;" @click="handleNextPage"
                    :disabled="currentPage === Math.ceil(memberList.length / 10)">下一页</el-button>
            </div>
            <el-button type="primary" style="margin-left: 8px;" @click="handleConfirm">开始配置</el-button>
        </div>
    </div>
</template>

<style scoped lang="less">
.P-home {
    padding: 16px;
    position: relative;
    .P-home-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h1 {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
    }

    .selection-info {
        margin: 12px 0;
        color: #606266;
        font-size: 14px;

        .selection-count {
            color: #409EFF;
            font-weight: bold;
        }

        .selection-limit {
            margin-left: 16px;
            color: #F56C6C;
        }
    }

    .search-box {
        margin-bottom: 12px;
    }

    .add-member {
        margin-bottom: 12px;

        :deep(.el-form) {
            height:30px;
        }

        :deep(.el-form-item) {
            margin-bottom: 16px !important;
            margin-right: 8px !important;
        }
        :deep(.el-input) {
            width: 116px;
            height: 28px;
        }
        :deep(.el-button) {
            height: 28px;
            width: 40px;
        }
    }

    .member-container {
        background: #fff;
        border-radius: 4px;
        margin-bottom: 16px;

        .member-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;

            .member-item {
                position: relative;
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 4px;
                background: #F5F7FA;
                transition: all 0.3s;

                &:hover {
                    background: #EBEEF5;
                }

                &:hover .delete-icon {
                    display: block;
                }

                :deep(.el-checkbox) {
                    margin-right: 12px;
                }

                
                .delete-icon {
                        position: absolute;
                        display: none;
                        right: -4px;
                        top: -4px;
                        cursor: pointer;
                }

                .member-item-info {
                    flex: 1;
                    position: relative;

                    .member-item-info-name, .member-item-info-id {
                        display: flex;
                        justify-content: space-between;

                        :deep(.el-form-item) {
                            margin-bottom: 0px !important;
                        }
                        :deep(.el-input) {
                            height:18px;
                            width: 116px;
                        }
                    }
                    span {
                        color: #606266;
                        
                        &:first-of-type {
                            margin-right: 8px;
                            font-weight: 500;
                        }

                        &:last-of-type {
                            color: #909399;
                            font-size: 13px;
                        }
                    }
                }
            }
        }
    }

    .footer {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px 16px 16px;
        border-top: 1px solid #EBEEF5;

        .pagination {
            flex: 1;
        }
    }
}
</style>