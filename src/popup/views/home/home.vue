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
const searchType = ref('0') // 0 按name搜索 1 按id搜索
const currentPage = ref(1)
const currentPageMemberList = ref([])
const searchMemberList = ref([])
const editingIndex = ref("")
const updatedLoading = ref(false)

const memberList = ref([])

watch([memberList, searchMemberList, currentPage, input], ([memberListNew, searchMemberListNew, currentPageNew, inputNew]) => {
    if (!inputNew) {
        currentPageMemberList.value = memberListNew.slice((currentPageNew - 1) * 10, currentPageNew * 10)
    } else {
        currentPageMemberList.value = searchMemberListNew.slice((currentPageNew - 1) * 10, currentPageNew * 10)
    }
}, {
    deep: true,
})

//#region 
watch(updatedLoading, (newVal) => {
    if (!newVal) {
        operateType.value = ""
        editingIndex.value = ""
        ruleForm.name = ""
        ruleForm.id = ""
    }
})

const selectedMemberIds = ref([])

const ruleFormRef = ref([])
const addMemberFormRef = ref()

const ruleForm = reactive({
    name: '',
    id: '',
})

const addMemberForm = reactive({
    name: '',
    id: '',
})

const validateId = (_, value, callback) => {
    if (value === '') {
        callback(new Error('请输入ID'))
    } else {
        if (isNaN(value)) {
            callback(new Error('ID 只允许输入数字'))
        }
        callback()
    }
}

const rules = reactive({
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    id: [{ required: true, trigger: 'blur', validator: validateId }],
})

const addMemberRules = reactive({
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    id: [{ required: true, trigger: 'blur', validator: validateId }],
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

const fetchMembers = () => {
    fetch(`${BASE_URL}/api/members`)
        .then(response => response.json())
        .then(json => {
            memberList.value = json.map(item => ({
                ...item,
                checked: selectedMemberIds.value.includes(item.id)
            }))
            if (!!input.value) {
                handleSearch()
            }
            updatedLoading.value = false
        })
        .catch(err => console.log('Request Failed', err));
}

const handleAddMember = async () => {
    if (!addMemberFormRef.value) return
    try {
        await addMemberFormRef.value.validate()
        fetch(`${BASE_URL}/api/members?name=${addMemberForm.name}&id=${addMemberForm.id}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(() => {
                fetchMembers()
                addMemberForm.name = ""
                addMemberForm.id = ""
            })
            .catch(err => console.log('Request Failed', err))
    } catch (error) {
        console.log('表单验证失败', error)
    }
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

const handleEditNameSave = async (id, index) => {
    if (!ruleFormRef.value[index]) return
    try {
        await ruleFormRef.value[index].validate()
        updatedLoading.value = true
        fetch(`${BASE_URL}/api/members/${id}?name=${ruleForm.name}&id=${ruleForm.id}`, {
            method: 'PUT'
        })
            .then(() => {
                fetchMembers()
            })
            .catch(err => console.log('Request Failed', err))
            .finally(() => { })
    } catch (error) {
        console.log('表单验证失败', error)
    }
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

const handleEditIdSave = async (id, index) => {
    if (!ruleFormRef.value[index]) return
    try {
        await ruleFormRef.value[index].validate()
        updatedLoading.value = true
        fetch(`${BASE_URL}/api/members/${id}?name=${ruleForm.name}&id=${ruleForm.id}`, {
            method: 'PUT'
        })
            .then(() => {
                fetchMembers()
                selectedMemberIds.value = memberList.value.filter(item => item.checked).map(item => item.id)
            })
            .catch(err => console.log('Request Failed', err))
            .finally(() => { })
    } catch (error) {
        console.log('表单验证失败', error)
    }
}

const handleMemberChange = (id) => {
    if (selectedMemberIds.value.includes(id)) {
        selectedMemberIds.value = selectedMemberIds.value.filter(item => item !== id)
    } else {
        selectedMemberIds.value.push(id)
    }
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
            message: `处理失败: ${err}`,
            type: 'error',
            plain: true,
        })
    }
}
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
//#endregion

const handleSearch = () => {
    if (searchType.value === "0" && !!input.value.trim()) {
        searchMemberList.value = memberList.value.filter(item => item.name.includes(input.value.trim()))
    } else if (searchType.value === "1" && !!input.value.trim()) {
        searchMemberList.value = memberList.value.filter(item => item.id.includes(input.value.trim()))
    } else {
        searchMemberList.value = memberList.value
    }
    currentPage.value = 1
}

const searchTypeChange = (value) => {
    searchType.value = value
    handleSearch()
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
            <el-input v-model="input" style="width: 45%;height: 28px;" placeholder="搜索成员..." clearable
                @input="handleSearch" @clear="handleSearch" />
            <el-radio-group v-model="searchType" @change="searchTypeChange">
                <el-radio label="0">按 name 搜索</el-radio>
                <el-radio label="1">按 id 搜索</el-radio>
            </el-radio-group>
        </div>
        <div class="add-member">
            <el-form ref="addMemberFormRef" :inline="true" :model="addMemberForm" :rules="addMemberRules"
                class="demo-form-inline">
                <el-form-item label="米家ID:" prop="id">
                    <el-input v-model="addMemberForm.id" placeholder="请输入id" clearable />
                </el-form-item>
                <el-form-item label="成员名:" prop="name">
                    <el-input v-model="addMemberForm.name" placeholder="请输入name" clearable />
                </el-form-item>
                <el-form-item style="margin-left: 0px !important;">
                    <el-button type="primary" @click="handleAddMember">添加</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="member-container">
            <div class="member-list">
                <div class="member-item" v-for="(item, index) in currentPageMemberList" :key="item.id">
                    <el-popconfirm title="确认要删除该成员吗？" placement="top" @confirm="handleDeleteMember(item.id)">
                        <template #reference>
                            <el-icon class="delete-icon">
                                <Delete />
                            </el-icon>
                        </template>
                    </el-popconfirm>
                    <el-checkbox v-model="item.checked" @change="handleMemberChange(item.id)"
                        :disabled="selectedMemberIds.length >= MAX_SELECT_COUNT && !item.checked" />
                    <div class="member-item-info">
                        <el-form :ref="(el) => ruleFormRef[index] = el" :model="ruleForm" status-icon :rules="rules"
                            label-width="auto">
                            <div class="member-item-info-name">
                                <template
                                    v-if="editingIndex === item.id && operateType === OPERATE_TYPE.NAME && !updatedLoading">
                                    <el-form-item prop="name">
                                        <el-input v-model="ruleForm.name" />
                                    </el-form-item>
                                    <div>
                                        <el-icon @click="handleEditNameCancel(item.name)">
                                            <Close />
                                        </el-icon>
                                        <el-icon @click="handleEditNameSave(item.id, index)">
                                            <Check />
                                        </el-icon>
                                    </div>
                                </template>
                                <template v-else>
                                    <template
                                        v-if="updatedLoading && editingIndex === item.id && operateType === OPERATE_TYPE.NAME">
                                        <el-icon>
                                            <Loading />
                                        </el-icon>
                                    </template>
                                    <template v-else>
                                        <el-tooltip effect="dark" content="成员名" placement="top" :show-after="1000">
                                            <span>{{ item.name }}</span>
                                        </el-tooltip>
                                    </template>
                                    <el-icon @click="handleEditName(item.id, item.name)">
                                        <Edit />
                                    </el-icon>
                                </template>
                            </div>
                            <div class="member-item-info-id">
                                <template
                                    v-if="editingIndex === item.id && operateType === OPERATE_TYPE.ID && !updatedLoading">
                                    <el-form-item prop="id">
                                        <el-input v-model="ruleForm.id" />
                                    </el-form-item>
                                    <el-icon @click="handleEditIdCancel(item.id)">
                                        <Close />
                                    </el-icon>
                                    <el-icon @click="handleEditIdSave(item.id, index)">
                                        <Check />
                                    </el-icon>
                                </template>
                                <template v-else>
                                    <template
                                        v-if="updatedLoading && editingIndex === item.id && operateType === OPERATE_TYPE.ID">
                                        <el-icon>
                                            <Loading />
                                        </el-icon>
                                    </template>
                                    <template v-else>
                                        <el-tooltip effect="dark" content="米家 ID" placement="top" :show-after="1000">
                                            <span>{{ item.id }}</span>
                                        </el-tooltip>
                                    </template>
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
                <span>第 {{ currentPage }} 页，共 {{ Math.ceil((!!input ? searchMemberList.length : memberList.length) / 10)
                    }}
                    页</span>
                <el-button style="margin-left: 8px;" @click="handleNextPage"
                    :disabled="currentPage === Math.ceil((!!input ? searchMemberList.length : memberList.length) / 10)">下一页</el-button>
            </div>
            <el-button type="primary" style="margin-left: 8px;" @click="handleConfirm">开始配置</el-button>
        </div>
    </div>
</template>

<style scoped lang="less">
.P-home {
    padding: 12px;
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
        display: flex;
        margin-bottom: 12px;
        align-items: center;
        :deep(.el-radio) {
            margin-left: 12px !important;
            margin-right: 0px !important;
        }
    }

    .add-member {
        margin-bottom: 12px;

        :deep(.el-form) {
            height:30px;
        }

        :deep(.el-form-item) {
            margin-bottom: 16px !important;
            margin-right: 8px !important;
            .el-form-item__label {
                padding-right: 4px !important;
            }
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
                        align-items: center;

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