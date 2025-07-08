<script setup>
import { onMounted, reactive, ref } from 'vue';

const BASE_URL = 'https://stunning-gingersnap-0eb308.netlify.app/'

const OPERATE_TYPE = {
    NAME: 'name',
    ID: 'id',
}

const operateType = ref("")

const input = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const size = ref('default')
const background = ref(false)
const disabled = ref(false)
const editingIndex = ref("")

const memberList = ref([])
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

const fetchMembers = () => {
    fetch(`${BASE_URL}/api/members`)
        .then(response => response.json())
        .then(json => {
            memberList.value = json
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
}

const handleEditNameCancel = () => {
    operateType.value = ""
    editingIndex.value = ""
    ruleForm.name = ""
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
        });
}

const handleEditId = (id) => {
    operateType.value = OPERATE_TYPE.ID
    editingIndex.value = id
    ruleForm.id = id
}

const handleEditIdCancel = () => {
    operateType.value = ""
    editingIndex.value = ""
    ruleForm.id = ""
}

const handleEditIdSave = (id) => {
    operateType.value = ""
    editingIndex.value = ""
    ruleForm.id = ""
}

const handleDeleteMember = (id) => {
    fetch(`${BASE_URL}/api/members/${id}`, {
        method: 'DELETE'
    })
        .then(() => {
            fetchMembers()
        })
}

const handleConfirm = () => {
    console.log("开始配置")
}

const handleSizeChange = (val) => {
    console.log(`${val} items per page`)
}
const handleCurrentChange = (val) => {
    console.log(`current page: ${val}`)
}
</script>

<template>
    <div class="P-home">
        <div class="P-home-header">
            <h1>米家自动化配置助手</h1>
            <el-button>全选当前页</el-button>
        </div>
        <el-divider style="margin: 0" />
        <div class="selection-info">
            <span>已选择：<span class="selection-count">0</span> / 20</span>
            <span class="selection-limit" style="display: none">最多只能选择 20 个成员</span>
        </div>
        <div class="search-box">
            <el-input v-model="input" style="width: 100%;height: 28px;" placeholder="搜索成员..." clearable />
        </div>
        <div class="add-member">
            <el-form :inline="true" :model="addMemberForm" class="demo-form-inline">
                <el-form-item label="id">
                    <el-input v-model="addMemberForm.id" placeholder="请输入id" clearable />
                </el-form-item>
                <el-form-item label="name">
                    <el-input v-model="addMemberForm.name" placeholder="请输入name" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleAddMember">添加</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="member-container">
            <div class="member-list">
                <div class="member-item" v-for="item in memberList" :key="item.id">
                    <el-popconfirm title="确认要删除该成员吗？" placement="top" @confirm="handleDeleteMember(item.id)">
                        <template #reference>
                            <el-icon class="delete-icon">
                                <Delete />
                            </el-icon>
                        </template>
                    </el-popconfirm>
                    <el-checkbox v-model="item.checked" />
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
                                    <el-icon @click="handleEditId(item.id)">
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
            <el-button type="primary" style="margin-right: 16px;" @click="handleConfirm">开始配置</el-button>
            <div class="pagination">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 30, 40]" :size="size" :disabled="disabled" :background="background"
                    layout="total, sizes, prev, pager, next, jumper" :total="memberList.length"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="less">
.P-home {
    padding: 20px;

    .P-home-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h1 {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
    }

    .selection-info {
        margin: 16px 0;
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
        margin-bottom: 20px;
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
        margin-bottom: 20px;
        min-height: 400px;

        .member-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

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
        overflow-y: auto;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-top: 1px solid #EBEEF5;

        .pagination {
            flex: 1;
            margin-right: 16px;
        }
    }
}
</style>